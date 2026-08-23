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
   * Chapitres d'une formation
   * (étudiant : vue PARCOURS avec état accessible/verrouillé)
   */
  async byFormation(req, res) {
    try {
      const { id_formation } = req.params;
      const data = await ChapterService.getChaptersByFormation(
        id_formation,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Chapitres récupérés avec succès.",
        data,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Récupérer un chapitre (blocage backend pour un étudiant)
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const chapter = await ChapterService.getChapterById(id, req.user);
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
   * Réordonner les chapitres d'une formation
   */
  async reorder(req, res) {
    try {
      const { id_formation } = req.params;
      const chapitres = await ChapterService.reorderChapters(
        id_formation,
        req.body.chapitres ?? [],
        req.user,
      );
      return ApiResponse.success(
        res,
        "Chapitres réordonnés avec succès.",
        chapitres,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Marquer un chapitre sans quiz comme terminé (étudiant inscrit)
   */
  async complete(req, res) {
    try {
      const { id } = req.params;
      const result = await ChapterService.completeChapter(id, req.user);
      return ApiResponse.success(res, "Chapitre terminé.", result);
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
