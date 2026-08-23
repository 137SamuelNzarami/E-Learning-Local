import ProgressionService from "../services/progression.service.js";
import ApiResponse from "../utils/api-response.js";

class ProgressionController {
  /**
   * Toutes les progressions (admin)
   */
  async index(req, res) {
    try {
      const rows = await ProgressionService.getAllProgressions();
      return ApiResponse.success(
        res,
        "Liste des progressions récupérée avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Ma progression (étudiant courant, toutes formations)
   */
  async mine(req, res) {
    try {
      const rows = await ProgressionService.getMyProgression(req.user);
      return ApiResponse.success(
        res,
        "Progression récupérée avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Progressions d'un utilisateur
   *
   * - Étudiant : uniquement les siennes.
   * - Formateur : celles de ses étudiants.
   */
  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;
      const rows = await ProgressionService.getProgressionsByUser(
        id_utilisateur,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Progressions récupérées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Progressions d'une formation (formateur propriétaire / admin)
   */
  async getByFormation(req, res) {
    try {
      const { id_formation } = req.params;
      const rows = await ProgressionService.getProgressionsByFormation(
        id_formation,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Progressions de la formation récupérées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Recalculer toutes les progressions d'une formation (admin)
   */
  async recompute(req, res) {
    try {
      const { id_formation } = req.params;
      const rows = await ProgressionService.recomputeForFormation(
        id_formation,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Progressions recalculées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new ProgressionController();
