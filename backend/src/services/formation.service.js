import FormationRepository from "../repositories/formation.repository.js";
import CategoryRepository from "../repositories/category.repository.js";
import UserRepository from "../repositories/user.repository.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertCanManage,
  canAccessFormation,
  isAdmin,
  isEtudiant,
  isFormateur,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/app-errors.js";

class FormationService {
  /**
   * Catalogue :
   * - Étudiant   : uniquement les formations PUBLIEES.
   * - Formateur  : formations publiées + les siennes (y compris brouillons).
   * - Admin      : tout.
   */
  async getAllFormations(user) {
    const rows = await FormationRepository.findAll();

    if (!user || isEtudiant(user)) {
      return rows.filter((f) => f.statut === "PUBLIEE");
    }

    if (isFormateur(user)) {
      return rows.filter(
        (f) =>
          f.statut === "PUBLIEE" ||
          Number(f.id_formateur) === Number(user.id),
      );
    }

    return rows;
  }

  /**
   * Détail d'une formation.
   *
   * - Un étudiant ne peut consulter le détail que d'une formation
   *   PUBLIEE (inscrite ou non : la fiche catalogue reste visible).
   * - Un formateur voit ses brouillons ; pas ceux des autres.
   */
  async getFormationById(id, user) {
    const formation = await FormationRepository.findById(id);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    if (
      formation.statut !== "PUBLIEE" &&
      !canAccessFormation(formation, user)
    ) {
      throw new NotFoundError("Formation introuvable.");
    }

    return formation;
  }

  /**
   * Créer une formation
   *
   * - Le formateur est propriétaire (id_formateur imposé par le token).
   * - Une nouvelle formation démarre en BROUILLON.
   */
  async createFormation(data, user) {
    if (!user || !user.id) {
      throw new UnauthorizedError("Utilisateur non authentifié.");
    }

    if (isFormateur(user)) {
      data.id_formateur = user.id;
    }

    if (isAdmin(user) && !data.id_formateur) {
      throw new ValidationError("Le formateur est obligatoire.");
    }

    if (!isAdmin(user) && !isFormateur(user)) {
      throw new AccessDeniedError("Accès interdit. Vous n'avez pas les permissions nécessaires.");
    }

    const existe = await FormationRepository.findByTitle(data.titre);
    if (existe) {
      throw new ConflictError("Une formation portant ce titre existe déjà.");
    }

    const categorie = await CategoryRepository.findById(data.id_categorie);
    if (!categorie) {
      throw new NotFoundError("Catégorie introuvable.");
    }

    const formateur = await UserRepository.findById(data.id_formateur);
    if (!formateur) {
      throw new NotFoundError("Formateur introuvable.");
    }

    // statut initial contrôlé côté serveur
    delete data.statut;

    return await FormationRepository.create({
      ...data,
      statut: "BROUILLON",
    });
  }

  /**
   * Modifier une formation (propriétaire uniquement)
   */
  async updateFormation(id, data, user) {
    const formation = await FormationRepository.findById(id);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    await assertCanManage("formation", id, user);

    if (isFormateur(user)) {
      // un formateur ne peut pas transférer la propriété
      data.id_formateur = user.id;
    }

    // statut uniquement via publish/unpublish
    delete data.statut;

    const existe = await FormationRepository.findByTitle(data.titre);
    if (existe && existe.id_formation !== Number(id)) {
      throw new ConflictError("Une autre formation possède déjà ce titre.");
    }

    const categorie = await CategoryRepository.findById(data.id_categorie);
    if (!categorie) {
      throw new NotFoundError("Catégorie introuvable.");
    }

    const formateur = await UserRepository.findById(data.id_formateur);
    if (!formateur) {
      throw new NotFoundError("Formateur introuvable.");
    }

    await FormationRepository.update(id, data);
    return await FormationRepository.findById(id);
  }

  /**
   * Publier une formation (propriétaire / admin)
   */
  async publishFormation(id, user, publier = true) {
    const formation = await FormationRepository.findById(id);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    await assertCanManage("formation", id, user);

    const statut = publier ? "PUBLIEE" : "BROUILLON";

    await FormationRepository.updateStatut(id, statut);

    return await FormationRepository.findById(id);
  }

  /**
   * Supprimer une formation (propriétaire / admin)
   *
   * Suppression en cascade transactionnelle : chapitres, sections,
   * sous-sections, quiz, questions, réponses, tentatives, réponses
   * étudiantes, progressions, inscriptions et avis.
   */
  async deleteFormation(id, user) {
    const formation = await FormationRepository.findById(id);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    await assertCanManage("formation", id, user);

    try {
      return await FormationRepository.deleteCascade(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}
export default new FormationService();
