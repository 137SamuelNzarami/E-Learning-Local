import QuizRepository from "../repositories/quiz.repository.js";
import ChapterRepository from "../repositories/chapter.repository.js";
import ParcoursService from "./parcours.service.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage, isAdmin, isEtudiant } from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
} from "../utils/app-errors.js";

class QuizService {
  async getAllQuizzes() {
    return await QuizRepository.findAll();
  }

  /**
   * Un quiz — un étudiant ne peut consulter que le quiz d'un chapitre
   * accessible (inscription + chapitres précédents validés).
   */
  async getQuizById(id, user) {
    const quiz = await QuizRepository.findById(id);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    await ParcoursService.assertChapterAccessible(quiz.id_chapitre, user);

    return quiz;
  }

  /**
   * Quiz d'un chapitre (règle : un quiz par chapitre).
   * Étudiant : le chapitre doit être accessible.
   */
  async getQuizByChapter(id_chapitre, user) {
    await ParcoursService.assertChapterAccessible(id_chapitre, user);

    return await QuizRepository.findByChapter(id_chapitre);
  }

  /**
   * Créer le quiz de fin de chapitre
   *
   * Règles :
   * - le formateur doit posséder la formation du chapitre ;
   * - un seul quiz par chapitre ;
   * - score_reussite entre 0 et 100.
   */
  async createQuiz(data, user) {
    const chapter = await ChapterRepository.findById(data.id_chapitre);

    if (!chapter) {
      throw new NotFoundError("Le chapitre sélectionné est introuvable.");
    }

    await assertCanManage("chapter", data.id_chapitre, user);

    const existants = await QuizRepository.findByChapter(data.id_chapitre);

    if (existants.length > 0) {
      throw new ConflictError(
        "Ce chapitre possède déjà un quiz. Un seul quiz est autorisé par chapitre.",
      );
    }

    if (
      data.score_reussite !== undefined &&
      (Number(data.score_reussite) < 0 || Number(data.score_reussite) > 100)
    ) {
      throw new ConflictError(
        "Le score de réussite doit être compris entre 0 et 100.",
      );
    }

    return await QuizRepository.create(data);
  }

  /**
   * Modifier un quiz (titre / score de réussite)
   */
  async updateQuiz(id, data, user) {
    const quiz = await QuizRepository.findById(id);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    await assertCanManage("quiz", id, user);

    if (
      data.score_reussite !== undefined &&
      (Number(data.score_reussite) < 0 || Number(data.score_reussite) > 100)
    ) {
      throw new ConflictError(
        "Le score de réussite doit être compris entre 0 et 100.",
      );
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

    await assertCanManage("quiz", id, user);

    try {
      return await QuizRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer ce quiz car il contient déjà des questions ou des tentatives.",
        );
      }
      handleDatabaseError(error);
    }
  }
}

export default new QuizService();
