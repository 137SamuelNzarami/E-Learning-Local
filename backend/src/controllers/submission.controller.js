import SubmissionService from "../services/submission.service.js";
import ApiResponse from "../utils/api-response.js";

class SubmissionController {
  /**
   * Toutes les soumissions
   */
  async index(req, res) {
    try {
      const submissions = await SubmissionService.getAllSubmissions();

      return ApiResponse.success(
        res,
        "Liste des soumissions récupérée avec succès.",
        submissions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Une soumission
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const submission = await SubmissionService.getSubmissionById(
        id,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Soumission récupérée avec succès.",
        submission,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Soumissions d'un devoir
   */
  async getByAssignment(req, res) {
    try {
      const { id_devoir } = req.params;

      const submissions =
        await SubmissionService.getSubmissionsByAssignment(id_devoir, req.user);

      return ApiResponse.success(
        res,
        "Soumissions du devoir récupérées avec succès.",
        submissions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Soumissions d'un utilisateur
   */
  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const submissions =
        await SubmissionService.getSubmissionsByUser(id_utilisateur, req.user);

      return ApiResponse.success(
        res,
        "Soumissions de l'utilisateur récupérées avec succès.",
        submissions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Créer une soumission
   */
  async store(req, res) {
    try {
      const data = { ...req.body };
      if (req.file) data.fichier = `/uploads/${req.file.filename}`;
      const id = await SubmissionService.createSubmission(data, req.user);

      return ApiResponse.success(res, "Soumission créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier une soumission
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const submission = await SubmissionService.updateSubmission(
        id,
        { ...req.body, ...(req.file ? { fichier: `/uploads/${req.file.filename}` } : {}) },
        req.user,
      );

      return ApiResponse.success(
        res,
        "Soumission modifiée avec succès.",
        submission,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer une soumission
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await SubmissionService.deleteSubmission(id, req.user);

      return ApiResponse.success(res, "Soumission supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new SubmissionController();
