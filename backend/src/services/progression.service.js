import ProgressionRepository from "../repositories/progression.repository.js";

import UserRepository from "../repositories/user.repository.js";

import FormationRepository from "../repositories/formation.repository.js";

import EnrollmentRepository from "../repositories/enrollment.repository.js";

import ProgressionLeconService from "./progression-lecon.service.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertPersonalAccess,
  imposeOwnership,
  scopePersonalRowsByFormation,
  scopeToUser,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/app-errors.js";

class ProgressionService {
  /**
   * Récupérer toutes les progressions
   */
  async getAllProgressions() {
    return await ProgressionRepository.findAll();
  }
  /**
   * Récupérer une progression par son ID
   */
  async getProgressionById(id, user) {
    const progression = await ProgressionRepository.findById(id);

    if (!progression) {
      throw new NotFoundError("Progression introuvable.");
    }

    // IDOR : un non-admin ne peut lire que ses propres progressions
    assertPersonalAccess(user, progression.id_utilisateur);

    return progression;
  }
  /**
   * Récupérer les progressions d'un utilisateur
   */
  async getProgressionsByUser(id_utilisateur, user) {
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await ProgressionRepository.findByUserId(idCible);
  }
  /**
   * Récupérer les progressions d'une formation
   */
  async getProgressionsByFormation(id_formation, user) {
    const formation = await FormationRepository.findById(id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    const rows = await ProgressionRepository.findByFormationId(id_formation);

    // Un étudiant ne voit que sa propre progression ; un formateur qui
    // possède la formation voit toutes les progressions de ses étudiants.
    return scopePersonalRowsByFormation(rows, user, formation);
  }
  /**
   * Créer une progression
   */
  async createProgression(data, user) {
    imposeOwnership(data, user);

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const formation = await FormationRepository.findById(data.id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }
    /**
     * Vérifier que l'utilisateur
     * est inscrit à la formation
     */
    const enrollment = await EnrollmentRepository.findByUserAndFormation(
      data.id_utilisateur,
      data.id_formation,
    );

    if (!enrollment) {
      throw new AccessDeniedError("Cet utilisateur n'est pas inscrit à cette formation.");
    }
    /**
     * Vérifier qu'une progression
     * n'existe pas déjà
     */
    const existingProgression =
      await ProgressionRepository.findByUserAndFormation(
        data.id_utilisateur,
        data.id_formation,
      );

    if (existingProgression) {
      throw new ConflictError(
        "Une progression existe déjà pour cet utilisateur dans cette formation.",
      );
    }
    /**
     * Vérifier le pourcentage
     */
    const pourcentage = data.pourcentage ?? 0;

    if (Number(pourcentage) < 0 || Number(pourcentage) > 100) {
      throw new ValidationError("Le pourcentage doit être compris entre 0 et 100.");
    }

    try {
      return await ProgressionRepository.create({
        ...data,
        pourcentage,
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Modifier une progression
   */
  async updateProgression(id, data, user) {
    const progression = await ProgressionRepository.findById(id);

    if (!progression) {
      throw new NotFoundError("Progression introuvable.");
    }

    // IDOR : un non-admin ne peut modifier que ses propres progressions
    assertPersonalAccess(user, progression.id_utilisateur);

    imposeOwnership(data, user);

    // Mise à jour partielle : si l'utilisateur ou la formation ne sont pas
    // fournis, on conserve les valeurs existantes.
    if (data.id_utilisateur === undefined) {
      data.id_utilisateur = progression.id_utilisateur;
    }
    if (data.id_formation === undefined) {
      data.id_formation = progression.id_formation;
    }

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const formation = await FormationRepository.findById(data.id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }
    /**
     * Vérifier l'inscription
     */
    const enrollment = await EnrollmentRepository.findByUserAndFormation(
      data.id_utilisateur,
      data.id_formation,
    );

    if (!enrollment) {
      throw new AccessDeniedError("Cet utilisateur n'est pas inscrit à cette formation.");
    }
    /**
     * Vérifier le pourcentage
     */
    if (Number(data.pourcentage) < 0 || Number(data.pourcentage) > 100) {
      throw new ValidationError("Le pourcentage doit être compris entre 0 et 100.");
    }
    /**
     * Vérifier qu'on ne crée pas
     * un doublon en changeant le couple
     * utilisateur / formation.
     */
    const existingProgression =
      await ProgressionRepository.findByUserAndFormation(
        data.id_utilisateur,
        data.id_formation,
      );

    if (
      existingProgression &&
      existingProgression.id_progression !== Number(id)
    ) {
      throw new ConflictError(
        "Une progression existe déjà pour cet utilisateur dans cette formation.",
      );
    }

    try {
      await ProgressionRepository.update(id, data);

      return await ProgressionRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Recalculer la progression de tous les étudiants d'une formation.
   *
   * - Administrateur : toutes les formations.
   * - Formateur : uniquement ses propres formations.
   */
  async recomputeForFormation(id_formation, user) {
    const formation = await FormationRepository.findById(id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    const { canAccessFormation } = await import("../utils/ownership.js");

    if (!canAccessFormation(formation, user)) {
      throw new AccessDeniedError(
        "Accès interdit. Cette ressource ne vous appartient pas.",
      );
    }

    const enrollments = await EnrollmentRepository.findByFormationId(id_formation);

    const updated = [];

    for (const enrollment of enrollments) {
      const pourcentage = await ProgressionLeconService.recomputeForUserAndFormation(
        enrollment.id_utilisateur,
        id_formation,
      );

      updated.push({ id_utilisateur: enrollment.id_utilisateur, pourcentage });
    }

    return updated;
  }

  /**
   * Supprimer une progression
   */
  async deleteProgression(id, user) {
    const progression = await ProgressionRepository.findById(id);

    if (!progression) {
      throw new NotFoundError("Progression introuvable.");
    }

    // IDOR : un non-admin ne peut supprimer que ses propres progressions
    assertPersonalAccess(user, progression.id_utilisateur);

    try {
      return await ProgressionRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new ProgressionService();