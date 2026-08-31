import QuestionRepository from "../repositories/question.repository.js";
import AnswerRepository from "../repositories/answer.repository.js";
import QuizRepository from "../repositories/quiz.repository.js";
import ParcoursService from "./parcours.service.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertCanManage,
} from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class QuestionService {
  async getAllQuestions() {
    return await QuestionRepository.findAll();
  }

  /**
   * Une question — un étudiant ne peut lire que les questions d'un
   * quiz de chapitre accessible. Le type est visible ; le corrigé ne
   * l'est jamais ici (les choix viennent de /answers avec masquage).
   */
  async getQuestionById(id, user) {
    const question = await QuestionRepository.findById(id);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    await ParcoursService.assertQuizAccessible(question.id_quiz, user);

    return question;
  }

  /**
   * Questions d'un quiz — chapitre accessible obligatoire pour un étudiant.
   */
  async getQuestionsByQuiz(id_quiz, user) {
    const quiz = await QuizRepository.findById(id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    await ParcoursService.assertChapterAccessible(quiz.id_chapitre, user);

    return await QuestionRepository.findByQuizId(id_quiz);
  }

  /**
   * Créer une question (QCM uniquement)
   *
   * Règles :
   * - QCM : le formateur ajoute ensuite ses choix via /answers ;
   * - le type LIBRE n'est plus pris en charge par le produit.
   */
  async createQuestion(data, user) {
    const quiz = await QuizRepository.findById(data.id_quiz);

    if (!quiz) {
      throw new NotFoundError("Le quiz sélectionné est introuvable.");
    }

    await assertCanManage("quiz", data.id_quiz, user);

    if (data.type !== undefined && data.type !== "QCM") {
      throw new ConflictError(
        "Seules les questions à choix multiple (QCM) sont prises en charge.",
      );
    }

    if (
      data.points !== undefined &&
      (!Number.isInteger(Number(data.points)) || Number(data.points) < 1)
    ) {
      throw new ConflictError("Les points doivent être un entier >= 1.");
    }

    return await QuestionRepository.create(data);
  }

  async updateQuestion(id, data, user) {
    const question = await QuestionRepository.findById(id);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    await assertCanManage("question", id, user);

    if (data.type !== undefined && data.type !== question.type) {
      // changer le type d'une question déjà répondue fausserait l'historique
      throw new ConflictError(
        "Le type d'une question ne peut pas être modifié. Supprimez-la et créez une nouvelle question.",
      );
    }

    if (
      data.points !== undefined &&
      (!Number.isInteger(Number(data.points)) || Number(data.points) < 1)
    ) {
      throw new ConflictError("Les points doivent être un entier >= 1.");
    }

    try {
      await QuestionRepository.update(id, data);
      return await QuestionRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async deleteQuestion(id, user) {
    const question = await QuestionRepository.findById(id);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    await assertCanManage("question", id, user);

    try {
      return await QuestionRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer cette question car elle possède déjà des réponses ou des tentatives.",
        );
      }
      handleDatabaseError(error);
    }
  }
}

export default new QuestionService();
