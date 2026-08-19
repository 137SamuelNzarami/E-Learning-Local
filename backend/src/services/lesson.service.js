import LessonRepository from "../repositories/lesson.repository.js";
import ChapterRepository from "../repositories/chapter.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class LessonService {
  async getAllLessons() {
    return await LessonRepository.findAll();
  }
  async getLessonById(id) {
    const lesson = await LessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundError("Leçon introuvable.");
    }
    return lesson;
  }
  async createLesson(data, user) {
    const chapter = await ChapterRepository.findById(data.id_chapitre);
    if (!chapter) {
      throw new NotFoundError("Le chapitre sélectionné est introuvable.");
    }
    // Le formateur ne peut créer que dans ses propres chapitres
    await assertCanManage("chapter", data.id_chapitre, user);
    const existe = await LessonRepository.findByTitle(data.titre);
    if (existe) {
      throw new ConflictError("Une leçon portant ce titre existe déjà.");
    }
    return await LessonRepository.create(data);
  }
  async updateLesson(id, data, user) {
    const lesson = await LessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundError("Leçon introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut modifier la leçon
    await assertCanManage("lesson", id, user);
    const chapter = await ChapterRepository.findById(data.id_chapitre);
    if (!chapter) {
      throw new NotFoundError("Le chapitre sélectionné est introuvable.");
    }
    // Si la leçon est déplacée, le formateur doit posséder le chapitre cible
    await assertCanManage("chapter", data.id_chapitre, user);
    const existe = await LessonRepository.findByTitle(data.titre);
    if (existe && existe.id_lecon !== Number(id)) {
      throw new ConflictError("Une leçon portant ce titre existe déjà.");
    }
    try {
      await LessonRepository.update(id, data);
      return await LessonRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  async deleteLesson(id, user) {
    const lesson = await LessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundError("Leçon introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("lesson", id, user);
    try {
      return await LessonRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError("Impossible de supprimer cette leçon car elle est utilisée dans d'autres données.");
      }
      handleDatabaseError(error);
    }
  }
}

export default new LessonService();