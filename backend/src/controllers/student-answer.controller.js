import StudentAnswerService from "../services/student-answer.service.js";
import ApiResponse from "../utils/api-response.js";

class StudentAnswerController {
  /**
   * Toutes les réponses d'étudiants (admin)
   */
  async index(req, res) {
    try {
      const rows = await StudentAnswerService.getAllStudentAnswers();
      return ApiResponse.success(
        res,
        "Liste des réponses récupérée avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Réponses d'une tentative
   *
   * - Étudiant : uniquement les siennes.
   * - Formateur : réponses des tentatives de SES quiz.
   */
  async getByAttempt(req, res) {
    try {
      const { id_tentative } = req.params;
      const rows = await StudentAnswerService.getByAttempt(
        id_tentative,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Réponses de la tentative récupérées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Une réponse étudiant (avec correction si autorisé)
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const row = await StudentAnswerService.getStudentAnswerById(
        id,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Réponse récupérée avec succès.",
        row,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new StudentAnswerController();
