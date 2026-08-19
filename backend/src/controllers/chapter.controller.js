import ChapterService from "../services/chapter.service.js";
import ApiResponse from "../utils/api-response.js";

class ChapterController {
  /**
   * Récupérer tous les chapitres
   */
  async index(req, res) {
    try {
      const chapters = await ChapterService.getAllChapters();
      return ApiResponse.success(
        res,
        "Liste des chapitres récupérée avec succès.",
        chapters,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer un chapitre
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const chapter = await ChapterService.getChapterById(id);
      return ApiResponse.success(
        res,
        "Chapitre récupéré avec succès.",
        chapter,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Créer un chapitre
   */
  async store(req, res) {
    try {
      const id = await ChapterService.createChapter(req.body, req.user);
      return ApiResponse.success(res, "Chapitre créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier un chapitre
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const chapter = await ChapterService.updateChapter(id, req.body, req.user);
      return ApiResponse.success(res, "Chapitre modifié avec succès.", chapter);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer un chapitre
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      await ChapterService.deleteChapter(id, req.user);
      return ApiResponse.success(res, "Chapitre supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new ChapterController();
