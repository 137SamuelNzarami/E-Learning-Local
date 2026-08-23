import AnswerRepository from "../repositories/answer.repository.js";
import QuestionRepository from "../repositories/question.repository.js";
import QuizRepository from "../repositories/quiz.repository.js";
import ParcoursService from "./parcours.service.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertCanManage,
  canSeeCorrection,
  resolveFormation,
  stripCorrectionField,
} from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class AnswerService {
  async getAllAnswers() {
    return await AnswerRepository.findAll();
  }

  /**
   * Masque le corrigé (est_correcte) pour tout utilisateur qui n'a pas
   * les droits de correction. Un étudiant — même inscrit — ne doit
   * JAMAIS pouvoir obtenir les bonnes réponses via l'API.
   */
  async exposeCorrection(rows, user, idQuestion) {
    const formation = await resolveFormation("question", idQuestion);

    if (canSeeCorrection(user, formation)) {
      return rows;
    }

    return rows.map((row) => stripCorrectionField(row));
  }

  async getAnswerById(id, user) {
    const answer = await AnswerRepository.findById(id);

    if (!answer) {
      throw new NotFoundError("Réponse introuvable.");
    }

    // accès au quiz parent requis
    const question = await QuestionRepository.findById(answer.id_question);
    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }
    const quiz = await QuizRepository.findById(question.id_quiz);
    await ParcoursService.assertChapterAccessible(quiz.id_chapitre, user);

    const formation = await resolveFormation("question", answer.id_question);

    return canSeeCorrection(user, formation)
      ? answer
      : stripCorrectionField(answer);
  }

  async getAnswersByQuestion(id_question, user) {
    const question = await QuestionRepository.findById(id_question);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    const quiz = await QuizRepository.findById(question.id_quiz);
    await ParcoursService.assertChapterAccessible(quiz.id_chapitre, user);

    const rows = await AnswerRepository.findByQuestionId(id_question);

    return await this.exposeCorrection(rows, user, id_question);
  }

  /**
   * Créer un choix de réponse (questions QCM uniquement)
   */
  async createAnswer(data, user) {
    const question = await QuestionRepository.findById(data.id_question);

    if (!question) {
      throw new NotFoundError("La question sélectionnée est introuvable.");
    }

    if (question.type !== "QCM") {
      throw new ConflictError(
        "Une question à réponse libre ne possède pas de choix prédéfinis.",
      );
    }

    await assertCanManage("question", data.id_question, user);

    // L'API expose `texte` ; la colonne DB est `contenu`.
    return await AnswerRepository.create({
      id_question: data.id_question,
      contenu: (data.texte ?? "").trim(),
      est_correcte: !!data.est_correcte,
    });
  }

  async updateAnswer(id, data, user) {
    const answer = await AnswerRepository.findById(id);

    if (!answer) {
      throw new NotFoundError("Réponse introuvable.");
    }

    await assertCanManage("answer", id, user);

    const payload = {};
    if (data.texte !== undefined) {
      payload.contenu = String(data.texte).trim();
    }
    if (data.est_correcte !== undefined) {
      payload.est_correcte = !!data.est_correcte;
    }

    try {
      await AnswerRepository.update(id, payload);
      return await AnswerRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async deleteAnswer(id, user) {
    const answer = await AnswerRepository.findById(id);

    if (!answer) {
      throw new NotFoundError("Réponse introuvable.");
    }

    await assertCanManage("answer", id, user);

    try {
      return await AnswerRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new AnswerService();
