import AnswerRepository from "../repositories/answer.repository.js";
import QuestionRepository from "../repositories/question.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { canAccessFormation } from "../utils/ownership.js";
import { resolveFormation } from "../utils/ownership.js";
import { NotFoundError } from "../utils/app-errors.js";

class AnswerService {
  /**
   * Récupérer toutes les réponses
   * (accessible aux administrateurs et formateurs uniquement)
   */
  async getAllAnswers() {
    return await AnswerRepository.findAll();
  }

  /**
   * Masquer le champ est_correcte si l'utilisateur n'a pas le droit
   * de connaître la correction (uniquement le formateur propriétaire
   * de la formation et l'administrateur).
   *
   * @param {Object|Array<Object>} rows - réponse(s) contenant est_correcte
   * @param {Object} user - utilisateur authentifié
   * @param {number|string} idQuestion - question racine
   */
  async exposeCorrection(rows, user, idQuestion) {
    const formation = await resolveFormation("question", idQuestion);

    if (canAccessFormation(formation, user)) {
      return rows;
    }

    const strip = (row) => {
      const { est_correcte, ...rest } = row;
      return rest;
    };

    return Array.isArray(rows) ? rows.map(strip) : strip(rows);
  }

  /**
   * Récupérer une réponse par son ID
   */
  async getAnswerById(id, user) {
    const answer = await AnswerRepository.findById(id);
    if (!answer) {
      throw new NotFoundError("Réponse introuvable.");
    }
    return await this.exposeCorrection(answer, user, answer.id_question);
  }
  /**
   * Récupérer les réponses d'une question
   */
  async getAnswersByQuestion(id_question, user) {
    const question = await QuestionRepository.findById(id_question);
    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }
    const rows = await AnswerRepository.findByQuestionId(id_question);
    return await this.exposeCorrection(rows, user, id_question);
  }
  /**
   * Créer une réponse
   */
  async createAnswer(data, user) {
    const question = await QuestionRepository.findById(data.id_question);
    if (!question) {
      throw new NotFoundError("La question sélectionnée est introuvable.");
    }
    // Le formateur ne peut créer que dans ses propres questions
    await assertCanManage("question", data.id_question, user);
    return await AnswerRepository.create(data);
  }
  /**
   * Modifier une réponse
   */
  async updateAnswer(id, data, user) {
    const answer = await AnswerRepository.findById(id);
    if (!answer) {
      throw new NotFoundError("Réponse introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut modifier la réponse
    await assertCanManage("answer", id, user);
    const question = await QuestionRepository.findById(data.id_question);
    if (!question) {
      throw new NotFoundError("La question sélectionnée est introuvable.");
    }
    // Si la réponse est déplacée, le formateur doit posséder la question cible
    await assertCanManage("question", data.id_question, user);
    try {
      await AnswerRepository.update(id, data);
      return await AnswerRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Supprimer une réponse
   */
  async deleteAnswer(id, user) {
    const answer = await AnswerRepository.findById(id);
    if (!answer) {
      throw new NotFoundError("Réponse introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("answer", id, user);
    try {
      return await AnswerRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new AnswerService();
