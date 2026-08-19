import EnrollmentService from "../services/enrollment.service.js";

import ApiResponse from "../utils/api-response.js";

class EnrollmentController {
  /**
   * Récupérer toutes les inscriptions
   */
  async index(req, res) {
    try {
      const enrollments = await EnrollmentService.getAllEnrollments();

      return ApiResponse.success(
        res,
        "Liste des inscriptions récupérée avec succès.",
        enrollments,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer une inscription
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const enrollment = await EnrollmentService.getEnrollmentById(
        id,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Inscription récupérée avec succès.",
        enrollment,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer les inscriptions d'un utilisateur
   */
  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const enrollments =
        await EnrollmentService.getEnrollmentsByUser(id_utilisateur, req.user);

      return ApiResponse.success(
        res,
        "Inscriptions de l'utilisateur récupérées avec succès.",
        enrollments,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer les étudiants d'une formation
   */
  async getByFormation(req, res) {
    try {
      const { id_formation } = req.params;

      const enrollments =
        await EnrollmentService.getEnrollmentsByFormation(
          id_formation,
          req.user,
        );

      return ApiResponse.success(
        res,
        "Étudiants inscrits à la formation récupérés avec succès.",
        enrollments,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Créer une inscription
   */
  async store(req, res) {
    try {
      const id = await EnrollmentService.createEnrollment(req.body, req.user);

      return ApiResponse.success(res, "Inscription créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer une inscription
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await EnrollmentService.deleteEnrollment(id, req.user);

      return ApiResponse.success(res, "Inscription supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new EnrollmentController();