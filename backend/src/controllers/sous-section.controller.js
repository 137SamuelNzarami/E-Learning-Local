import SousSectionService from "../services/sous-section.service.js";
import ApiResponse from "../utils/api-response.js";

class SousSectionController {
  async index(req, res) {
    try {
      const rows = await SousSectionService.getAllSousSections();
      return ApiResponse.success(
        res,
        "Liste des sous-sections récupérée avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async bySection(req, res) {
    try {
      const { id_section } = req.params;
      const rows = await SousSectionService.getSousSectionsBySection(
        id_section,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Sous-sections récupérées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Détail AVEC le contenu rich text
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const row = await SousSectionService.getSousSectionById(id, req.user);
      return ApiResponse.success(
        res,
        "Sous-section récupérée avec succès.",
        row,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const id = await SousSectionService.createSousSection(
        req.body,
        req.user,
      );
      return ApiResponse.success(res, "Sous-section créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const row = await SousSectionService.updateSousSection(
        id,
        req.body,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Sous-section modifiée avec succès.",
        row,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async reorder(req, res) {
    try {
      const { id_section } = req.params;
      const rows = await SousSectionService.reorderSousSections(
        id_section,
        req.body.sous_sections ?? [],
        req.user,
      );
      return ApiResponse.success(
        res,
        "Sous-sections réordonnées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await SousSectionService.deleteSousSection(id, req.user);
      return ApiResponse.success(res, "Sous-section supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new SousSectionController();
