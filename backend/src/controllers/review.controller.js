import ReviewService from "../services/review.service.js";
import ApiResponse from "../utils/api-response.js";

class ReviewController {
  /**
   * Tous les avis
   */
  async index(req, res) {
    try {
      const reviews = await ReviewService.getAllReviews();

      return ApiResponse.success(
        res,
        "Liste des avis récupérée avec succès.",
        reviews,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Un avis
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const review = await ReviewService.getReviewById(id, req.user);

      return ApiResponse.success(res, "Avis récupéré avec succès.", review);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Avis d'une formation
   */
  async getByFormation(req, res) {
    try {
      const { id_formation } = req.params;

      const reviews = await ReviewService.getReviewsByFormation(id_formation);

      return ApiResponse.success(
        res,
        "Avis de la formation récupérés avec succès.",
        reviews,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Avis d'un utilisateur
   */
  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const reviews = await ReviewService.getReviewsByUser(id_utilisateur, req.user);

      return ApiResponse.success(
        res,
        "Avis de l'utilisateur récupérés avec succès.",
        reviews,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Créer un avis
   */
  async store(req, res) {
    try {
      const id = await ReviewService.createReview(req.body, req.user);

      return ApiResponse.success(res, "Avis créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Modifier un avis
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const review = await ReviewService.updateReview(id, req.body, req.user);

      return ApiResponse.success(res, "Avis modifié avec succès.", review);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Supprimer un avis
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await ReviewService.deleteReview(id, req.user);

      return ApiResponse.success(res, "Avis supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new ReviewController();
