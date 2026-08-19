import AttemptService from "../services/attempt.service.js";

import ApiResponse from "../utils/api-response.js";

class AttemptController {
  async index(req, res) {
    try {
      const attempts = await AttemptService.getAllAttempts();

      return ApiResponse.success(
        res,
        "Liste des tentatives récupérée avec succès.",
        attempts,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const attempt = await AttemptService.getAttemptById(id, req.user);

      return ApiResponse.success(
        res,
        "Tentative récupérée avec succès.",
        attempt,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const attempts = await AttemptService.getAttemptsByUser(
        id_utilisateur,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Tentatives de l'utilisateur récupérées avec succès.",
        attempts,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async getByQuiz(req, res) {
    try {
      const { id_quiz } = req.params;

      const attempts = await AttemptService.getAttemptsByQuiz(
        id_quiz,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Tentatives du quiz récupérées avec succès.",
        attempts,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const id = await AttemptService.createAttempt(req.body, req.user);

      return ApiResponse.success(res, "Tentative créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const attempt = await AttemptService.updateAttempt(id, req.body, req.user);

      return ApiResponse.success(
        res,
        "Tentative modifiée avec succès.",
        attempt,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      await AttemptService.deleteAttempt(id, req.user);

      return ApiResponse.success(res, "Tentative supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new AttemptController();
