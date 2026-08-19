import QuizRepository from "../repositories/quiz.repository.js";
import LessonRepository from "../repositories/lesson.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class QuizService {
  async getAllQuizzes() {
    return await QuizRepository.findAll();
  }

  async getQuizById(id) {
    const quiz = await QuizRepository.findById(id);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    return quiz;
  }

  async createQuiz(data, user) {
    const lesson = await LessonRepository.findById(data.id_lecon);

    if (!lesson) {
      throw new NotFoundError("La leçon sélectionnée est introuvable.");
    }

    // Le formateur ne peut créer que dans ses propres leçons
    await assertCanManage("lesson", data.id_lecon, user);

    const existe = await QuizRepository.findByTitle(data.titre);

    if (existe) {
      throw new ConflictError("Un quiz portant ce titre existe déjà.");
    }

    return await QuizRepository.create(data);
  }

  async updateQuiz(id, data, user) {
    const quiz = await QuizRepository.findById(id);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut modifier le quiz
    await assertCanManage("quiz", id, user);

    const lesson = await LessonRepository.findById(data.id_lecon);

    if (!lesson) {
      throw new NotFoundError("La leçon sélectionnée est introuvable.");
    }

    // Si le quiz est déplacé, le formateur doit posséder la leçon cible
    await assertCanManage("lesson", data.id_lecon, user);

    const existe = await QuizRepository.findByTitle(data.titre);

    if (existe && existe.id_quiz !== Number(id)) {
      throw new ConflictError("Un quiz portant ce titre existe déjà.");
    }

    try {
      await QuizRepository.update(id, data);

      return await QuizRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async deleteQuiz(id, user) {
    const quiz = await QuizRepository.findById(id);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("quiz", id, user);

    try {
      return await QuizRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer ce quiz car il contient déjà des questions.",
        );
      }

      handleDatabaseError(error);
    }
  }
}

export default new QuizService();
