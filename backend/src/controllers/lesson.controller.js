import LessonService from "../services/lesson.service.js";
import ProgressionLeconService from "../services/progression-lecon.service.js";
import ApiResponse from "../utils/api-response.js";

class LessonController {
  async index(req, res) {
    try {
      const lessons = await LessonService.getAllLessons();
      return ApiResponse.success(
        res,
        "Liste des leçons récupérée avec succès.",
        lessons,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async show(req, res) {
    try {
      const { id } = req.params;
      const lesson = await LessonService.getLessonById(id);
      return ApiResponse.success(res, "Leçon récupérée avec succès.", lesson);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async complete(req, res) {
    try {
      const { id } = req.params;
      const result = await ProgressionLeconService.completeLesson(id, req.user);
      return ApiResponse.success(
        res,
        "Leçon marquée comme terminée.",
        result,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async status(req, res) {
    try {
      const { id } = req.params;
      const result = await ProgressionLeconService.getLessonStatus(id, req.user);
      return ApiResponse.success(res, "Statut de la leçon récupéré.", result);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async store(req, res) {
    try {
      const id = await LessonService.createLesson(req.body, req.user);
      return ApiResponse.success(res, "Leçon créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async update(req, res) {
    try {
      const { id } = req.params;
      const lesson = await LessonService.updateLesson(id, req.body, req.user);
      return ApiResponse.success(res, "Leçon modifiée avec succès.", lesson);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  async destroy(req, res) {
    try {
      const { id } = req.params;
      await LessonService.deleteLesson(id, req.user);
      return ApiResponse.success(res, "Leçon supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new LessonController();