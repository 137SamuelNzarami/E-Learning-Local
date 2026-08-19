import ProgressionService from "../services/progression.service.js";

import ApiResponse from "../utils/api-response.js";

class ProgressionController {
  async index(req, res) {
    try {
      const progressions = await ProgressionService.getAllProgressions();

      return ApiResponse.success(
        res,
        "Liste des progressions récupérée avec succès.",
        progressions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const progression = await ProgressionService.getProgressionById(
        id,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Progression récupérée avec succès.",
        progression,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const progressions =
        await ProgressionService.getProgressionsByUser(id_utilisateur, req.user);

      return ApiResponse.success(
        res,
        "Progressions de l'utilisateur récupérées avec succès.",
        progressions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async getByFormation(req, res) {
    try {
      const { id_formation } = req.params;

      const progressions =
        await ProgressionService.getProgressionsByFormation(
          id_formation,
          req.user,
        );

      return ApiResponse.success(
        res,
        "Progressions de la formation récupérées avec succès.",
        progressions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const id = await ProgressionService.createProgression(req.body, req.user);

      return ApiResponse.success(res, "Progression créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const progression = await ProgressionService.updateProgression(
        id,
        req.body,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Progression modifiée avec succès.",
        progression,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async recompute(req, res) {
    try {
      const { id_formation } = req.params;

      const updated = await ProgressionService.recomputeForFormation(
        id_formation,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Progressions recalculées avec succès.",
        updated,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      await ProgressionService.deleteProgression(id, req.user);

      return ApiResponse.success(res, "Progression supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new ProgressionController();