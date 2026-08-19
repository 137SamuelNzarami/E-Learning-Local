import CategoryService from "../services/category.service.js";
import ApiResponse from "../utils/api-response.js";

class CategoryController {
  /**
   * GET /api/categories
   */
  async index(req, res) {
    try {
      const categories = await CategoryService.getAllCategories();
      return ApiResponse.success(
        res,
        "Liste des catégories récupérée avec succès.",
        categories,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * GET /api/categories/:id
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const category = await CategoryService.getCategoryById(id);

      return ApiResponse.success(
        res,
        "Catégorie récupérée avec succès.",
        category,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * POST /api/categories
   */
  async store(req, res) {
    try {
      const result = await CategoryService.createCategory(req.body);

      return ApiResponse.success(
        res,
        "Catégorie créée avec succès.",
        result,
        201,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * PUT /api/categories/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      await CategoryService.updateCategory(id, req.body);
      return ApiResponse.success(res, "Catégorie modifiée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * DELETE /api/categories/:id
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      return ApiResponse.success(res, "Catégorie supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new CategoryController();
