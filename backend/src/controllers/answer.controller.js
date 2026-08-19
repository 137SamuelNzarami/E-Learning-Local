import AnswerService from "../services/answer.service.js";
import ApiResponse from "../utils/api-response.js";

class AnswerController {
  /**
   * Récupérer toutes les réponses
   */
  async index(req, res) {
    try {
      const answers = await AnswerService.getAllAnswers();

      return ApiResponse.success(
        res,
        "Liste des réponses récupérée avec succès.",
        answers,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer une réponse
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const answer = await AnswerService.getAnswerById(id, req.user);

      return ApiResponse.success(res, "Réponse récupérée avec succès.", answer);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer les réponses d'une question
   */
  async getByQuestion(req, res) {
    try {
      const { id_question } = req.params;

      const answers = await AnswerService.getAnswersByQuestion(id_question, req.user);

      return ApiResponse.success(
        res,
        "Réponses de la question récupérées avec succès.",
        answers,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Créer une réponse
   */
  async store(req, res) {
    try {
      const id = await AnswerService.createAnswer(req.body, req.user);

      return ApiResponse.success(res, "Réponse créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier une réponse
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const answer = await AnswerService.updateAnswer(id, req.body, req.user);

      return ApiResponse.success(res, "Réponse modifiée avec succès.", answer);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer une réponse
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await AnswerService.deleteAnswer(id, req.user);

      return ApiResponse.success(res, "Réponse supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new AnswerController();