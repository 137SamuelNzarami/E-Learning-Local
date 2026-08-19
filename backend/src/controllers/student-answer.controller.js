import StudentAnswerService from "../services/student-answer.service.js";

import ApiResponse from "../utils/api-response.js";

class StudentAnswerController {
  /**
   * Toutes les réponses des étudiants
   */
  async index(req, res) {
    try {
      const answers = await StudentAnswerService.getAllStudentAnswers();

      return ApiResponse.success(
        res,
        "Liste des réponses des étudiants récupérée avec succès.",
        answers,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Une réponse étudiant
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const answer = await StudentAnswerService.getStudentAnswerById(
        id,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Réponse de l'étudiant récupérée avec succès.",
        answer,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Réponses d'une tentative
   */
  async getByAttempt(req, res) {
    try {
      const { id_tentative } = req.params;

      const answers = await StudentAnswerService.getByAttempt(
        id_tentative,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Réponses de la tentative récupérées avec succès.",
        answers,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Réponses d'une question
   */
  async getByQuestion(req, res) {
    try {
      const { id_question } = req.params;

      const answers = await StudentAnswerService.getByQuestion(
        id_question,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Réponses des étudiants à la question récupérées avec succès.",
        answers,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Réponses d'un utilisateur
   */
  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const answers = await StudentAnswerService.getByUser(
        id_utilisateur,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Réponses de l'utilisateur récupérées avec succès.",
        answers,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Créer une réponse étudiant
   */
  async store(req, res) {
    try {
      const id = await StudentAnswerService.createStudentAnswer(
        req.body,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Réponse de l'étudiant enregistrée avec succès.",
        { id },
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier une réponse étudiant
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const answer = await StudentAnswerService.updateStudentAnswer(
        id,
        req.body,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Réponse de l'étudiant modifiée avec succès.",
        answer,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer une réponse étudiant
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await StudentAnswerService.deleteStudentAnswer(id, req.user);

      return ApiResponse.success(
        res,
        "Réponse de l'étudiant supprimée avec succès.",
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new StudentAnswerController();