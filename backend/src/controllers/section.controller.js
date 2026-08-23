import SectionService from "../services/section.service.js";
import ApiResponse from "../utils/api-response.js";

class SectionController {
  async index(req, res) {
    try {
      const rows = await SectionService.getAllSections();
      return ApiResponse.success(
        res,
        "Liste des sections récupérée avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async byChapter(req, res) {
    try {
      const { id_chapitre } = req.params;
      const rows = await SectionService.getSectionsByChapter(
        id_chapitre,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Sections récupérées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      const row = await SectionService.getSectionById(id, req.user);
      return ApiResponse.success(res, "Section récupérée avec succès.", row);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const id = await SectionService.createSection(req.body, req.user);
      return ApiResponse.success(res, "Section créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const row = await SectionService.updateSection(id, req.body, req.user);
      return ApiResponse.success(res, "Section modifiée avec succès.", row);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async reorder(req, res) {
    try {
      const { id_chapitre } = req.params;
      const rows = await SectionService.reorderSections(
        id_chapitre,
        req.body.sections ?? [],
        req.user,
      );
      return ApiResponse.success(
        res,
        "Sections réordonnées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await SectionService.deleteSection(id, req.user);
      return ApiResponse.success(res, "Section supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new SectionController();
