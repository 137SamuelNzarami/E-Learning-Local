import pool from "../config/database.js";
import ChapterRepository from "../repositories/chapter.repository.js";
import ProgressionRepository from "../repositories/progression.repository.js";
import FormationRepository from "../repositories/formation.repository.js";
import EnrollmentRepository from "../repositories/enrollment.repository.js";
import ParcoursService from "./parcours.service.js";
import ROLES from "../constants/role.js";
import { AccessDeniedError, NotFoundError } from "../utils/app-errors.js";
import { canAccessFormation, isAdmin } from "../utils/ownership.js";

/**
 * PROGRESSION — source de vérité : le BACKEND.
 *
 * pourcentage = chapitres VALIDÉS / chapitres TOTAUX × 100
 *
 * Un chapitre est validé par :
 *   - la réussite de son quiz de fin de chapitre (tentatives REUSSIE) ;
 *   - ou, s'il n'a pas de quiz, son marquage explicite comme terminé
 *     par l'étudiant inscrit.
 *
 * Le frontend ne peut jamais écrire un pourcentage arbitraire :
 * la valeur est recalculée et persistée côté serveur.
 */
class ProgressionService {
  /**
   * Toutes les progressions (admin)
   */
  async getAllProgressions() {
    return await ProgressionRepository.findAll();
  }

  /**
   * Progressions d'un utilisateur
   *
   * - Étudiant : uniquement les siennes (IDOR).
   * - Formateur : celles de ses étudiants.
   * - Admin : toutes.
   */
  async getProgressionsByUser(id_utilisateur, user) {
    const idCible = Number(id_utilisateur);

    if (!isAdmin(user) && idCible !== Number(user.id)) {
      // un étudiant ne peut lire que ses propres progressions ;
      // un formateur doit posséder au moins une formation commune.
      if (user.role !== ROLES.FORMATEUR) {
        throw new AccessDeniedError(
          "Accès interdit. Cette ressource ne vous appartient pas.",
        );
      }

      const partage = await this._sharesFormation(user.id, idCible);
      if (!partage) {
        throw new AccessDeniedError(
          "Accès interdit. Cet utilisateur n'est pas inscrit à vos formations.",
        );
      }
    }

    const rows = await ProgressionRepository.findByUserId(idCible);

    for (const row of rows) {
      row.pourcentage = await ParcoursService.computePourcentage(
        row.id_formation,
        idCible,
      );
    }

    return rows;
  }

  /**
   * Progressions des inscrits d'une formation
   *
   * - Formateur propriétaire / admin uniquement.
   */
  async getProgressionsByFormation(id_formation, user) {
    const formation = await FormationRepository.findById(id_formation);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    if (!canAccessFormation(formation, user)) {
      throw new AccessDeniedError(
        "Accès interdit. Cette formation ne vous appartient pas.",
      );
    }

    const enrollments =
      await EnrollmentRepository.findByFormationId(id_formation);

    const rows = [];
    for (const enrollment of enrollments) {
      rows.push({
        id_utilisateur: enrollment.id_utilisateur,
        id_formation: Number(id_formation),
        pourcentage: await ParcoursService.computePourcentage(
          id_formation,
          enrollment.id_utilisateur,
        ),
      });
    }

    return rows;
  }

  /**
   * Vrai si l'étudiant est inscrit à au moins une formation du formateur.
   */
  async _sharesFormation(idFormateur, idEtudiant) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(*) AS total
            FROM inscriptions i
            INNER JOIN formations f ON i.id_formation = f.id_formation
            WHERE i.id_utilisateur = ? AND f.id_formateur = ?
            `,
      [idEtudiant, idFormateur],
    );
    return Number(rows[0].total) > 0;
  }

  /**
   * Recalculer puis persister la progression d'un étudiant dans une
   * formation. Retourne le pourcentage calculé.
   */
  async recomputeForUserAndFormation(id_utilisateur, id_formation) {
    const pourcentage = await ParcoursService.computePourcentage(
      id_formation,
      id_utilisateur,
    );

    let progression = await ProgressionRepository.findByUserAndFormation(
      id_utilisateur,
      id_formation,
    );

    if (!progression) {
      await ProgressionRepository.create({
        id_utilisateur,
        id_formation,
        pourcentage,
      });
    } else if (Number(progression.pourcentage) !== Number(pourcentage)) {
      await ProgressionRepository.update(progression.id_progression, {
        pourcentage,
      });
    }

    return pourcentage;
  }

  /**
   * Progressions de l'utilisateur courant dans toutes ses formations
   */
  async getMyProgression(user) {
    const rows = await ProgressionRepository.findByUserId(user.id);

    // recalcul à chaud : la valeur persistée n'est qu'un cache
    for (const row of rows) {
      row.pourcentage = await ParcoursService.computePourcentage(
        row.id_formation,
        user.id,
      );
    }

    return rows;
  }

  /**
   * Recalculer les progressions de tous les inscrits d'une formation
   * (admin + formateur propriétaire).
   */
  async recomputeForFormation(id_formation, user) {
    const formation = await FormationRepository.findById(id_formation);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    if (!canAccessFormation(formation, user)) {
      throw new AccessDeniedError(
        "Accès interdit. Cette formation ne vous appartient pas.",
      );
    }

    const enrollments =
      await EnrollmentRepository.findByFormationId(id_formation);

    const resultats = [];
    for (const enrollment of enrollments) {
      const pourcentage = await this.recomputeForUserAndFormation(
        enrollment.id_utilisateur,
        id_formation,
      );
      resultats.push({
        id_utilisateur: enrollment.id_utilisateur,
        pourcentage,
      });
    }

    return resultats;
  }
}

export default new ProgressionService();
