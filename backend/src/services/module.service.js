import ModuleRepository from "../repositories/module.repository.js";
import FormationRepository from "../repositories/formation.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class ModuleService {
  /**
   * Récupérer tous les modules
   */
  async getAllModules() {
    return await ModuleRepository.findAll();
  }
  /**
   * Récupérer un module par son ID
   */
  async getModuleById(id) {
    const module = await ModuleRepository.findById(id);
    if (!module) {
      throw new NotFoundError("Module introuvable.");
    }
    return module;
  }
  /**
   * Créer un module
   */
  async createModule(data, user) {
    // Vérifier que la formation existe
    const formation = await FormationRepository.findById(data.id_formation);
    if (!formation) {
      throw new NotFoundError("La formation sélectionnée est introuvable.");
    }
    // Le formateur ne peut créer que dans ses propres formations
    await assertCanManage("formation", data.id_formation, user);
    // Vérifier qu'un module portant le même titre n'existe pas déjà
    const existe = await ModuleRepository.findByTitle(data.titre);
    if (existe) {
      throw new ConflictError("Un module portant ce titre existe déjà.");
    }
    return await ModuleRepository.create(data);
  }
  /**
   * Modifier un module
   */
  async updateModule(id, data, user) {
    const module = await ModuleRepository.findById(id);
    if (!module) {
      throw new NotFoundError("Module introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut modifier le module
    await assertCanManage("module", id, user);
    // Vérifier que la formation existe
    const formation = await FormationRepository.findById(data.id_formation);
    if (!formation) {
      throw new NotFoundError("La formation sélectionnée est introuvable.");
    }
    // Si le module est déplacé, le formateur doit posséder la formation cible
    await assertCanManage("formation", data.id_formation, user);
    // Vérifier le doublon de titre
    const existe = await ModuleRepository.findByTitle(data.titre);

    if (existe && existe.id_module !== Number(id)) {
      throw new ConflictError("Un module portant ce titre existe déjà.");
    }
    try {
      await ModuleRepository.update(id, data);

      return await ModuleRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Supprimer un module
   */
  async deleteModule(id, user) {
    const module = await ModuleRepository.findById(id);
    if (!module) {
      throw new NotFoundError("Module introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("module", id, user);
    try {
      return await ModuleRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError("Impossible de supprimer ce module car il contient des chapitres.");
      }
      handleDatabaseError(error);
    }
  }
}

export default new ModuleService();
