import ChapterRepository from "../repositories/chapter.repository.js";
import ModuleRepository from "../repositories/module.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class ChapterService {
  /**
   * Récupérer tous les chapitres
   */
  async getAllChapters() {
    return await ChapterRepository.findAll();
  }
  /**
   * Récupérer un chapitre par son ID
   */
  async getChapterById(id) {
    const chapter = await ChapterRepository.findById(id);
    if (!chapter) {
      throw new NotFoundError("Chapitre introuvable.");
    }
    return chapter;
  }
  /**
   * Créer un chapitre
   */
  async createChapter(data, user) {
    // Vérifier que le module existe
    const module = await ModuleRepository.findById(data.id_module);
    if (!module) {
      throw new NotFoundError("Le module sélectionné est introuvable.");
    }
    // Le formateur ne peut créer que dans ses propres modules
    await assertCanManage("module", data.id_module, user);
    // Vérifier qu'un chapitre portant le même titre n'existe pas
    const existe = await ChapterRepository.findByTitle(data.titre);
    if (existe) {
      throw new ConflictError("Un chapitre portant ce titre existe déjà.");
    }
    return await ChapterRepository.create(data);
  }
  /**
   * Modifier un chapitre
   */
  async updateChapter(id, data, user) {
    const chapter = await ChapterRepository.findById(id);
    if (!chapter) {
      throw new NotFoundError("Chapitre introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut modifier le chapitre
    await assertCanManage("chapter", id, user);
    // Vérifier que le module existe
    const module = await ModuleRepository.findById(data.id_module);
    if (!module) {
      throw new NotFoundError("Le module sélectionné est introuvable.");
    }
    // Si le chapitre est déplacé, le formateur doit posséder le module cible
    await assertCanManage("module", data.id_module, user);
    // Vérifier le doublon de titre
    const existe = await ChapterRepository.findByTitle(data.titre);
    if (existe && existe.id_chapitre !== Number(id)) {
      throw new ConflictError("Un chapitre portant ce titre existe déjà.");
    }
    try {
      await ChapterRepository.update(id, data);
      return await ChapterRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Supprimer un chapitre
   */
  async deleteChapter(id, user) {
    const chapter = await ChapterRepository.findById(id);
    if (!chapter) {
      throw new NotFoundError("Chapitre introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("chapter", id, user);
    try {
      return await ChapterRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError("Impossible de supprimer ce chapitre car il contient des leçons.");
      }
      handleDatabaseError(error);
    }
  }
}

export default new ChapterService();