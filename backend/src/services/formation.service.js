import FormationRepository from "../repositories/formation.repository.js";
import CategoryRepository from "../repositories/category.repository.js";
import UserRepository from "../repositories/user.repository.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage, isAdmin, isFormateur } from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/app-errors.js";

class FormationService {
  /**
   * Récupérer toutes les formations
   */
  async getAllFormations() {
    return await FormationRepository.findAll();
  }
  /**
   * Récupérer une formation par son ID
   */
  async getFormationById(id) {
    const formation = await FormationRepository.findById(id);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }
    return formation;
  }
  /**
   * Ajouter une formation
   */
  async createFormation(data, user) {
    if (!user || !user.id) {
      throw new UnauthorizedError("Utilisateur non authentifié.");
    }

    if (isFormateur(user)) {
      // Le formateur ne peut créer que pour lui-même :
      // le propriétaire vient du token, jamais du client.
      data.id_formateur = user.id;
    }

    if (isAdmin(user) && !data.id_formateur) {
      throw new ValidationError("Le formateur est obligatoire.");
    }

    if (!isAdmin(user) && !isFormateur(user)) {
      throw new AccessDeniedError("Accès interdit. Vous n'avez pas les permissions nécessaires.");
    }

    // Vérifier si le titre existe déjà
    const existe = await FormationRepository.findByTitle(data.titre);
    if (existe) {
      throw new ConflictError("Une formation portant ce titre existe déjà.");
    }
    // Vérifier que la catégorie existe
    const categorie = await CategoryRepository.findById(data.id_categorie);
    if (!categorie) {
      throw new NotFoundError("Catégorie introuvable.");
    }
    // Vérifier que le formateur existe
    const formateur = await UserRepository.findById(data.id_formateur);
    if (!formateur) {
      throw new NotFoundError("Formateur introuvable.");
    }
    return await FormationRepository.create(data);
  }
  /**
   * Modifier une formation
   */
  async updateFormation(id, data, user) {
    const formation = await FormationRepository.findById(id);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut modifier
    await assertCanManage("formation", id, user);

    if (isFormateur(user)) {
      // Un formateur ne peut pas transférer la propriété de sa formation
      data.id_formateur = user.id;
    }

    // Vérifier le titre uniquement s'il appartient à une autre formation
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
   * Supprimer une formation
   */
  async deleteFormation(id, user) {
    const formation = await FormationRepository.findById(id);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("formation", id, user);

    try {
      return await FormationRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError("Impossible de supprimer cette formation car des étudiants y sont déjà inscrits.");
      }
      handleDatabaseError(error);
    }
  }
}
export default new FormationService();
