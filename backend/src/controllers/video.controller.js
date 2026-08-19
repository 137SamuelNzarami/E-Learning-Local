import VideoService from "../services/video.service.js";
import ApiResponse from "../utils/api-response.js";

class VideoController {
  async index(req, res) {
    try {
      const videos = await VideoService.getAllVideos();

      return ApiResponse.success(
        res,
        "Liste des vidéos récupérée avec succès.",
        videos,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const video = await VideoService.getVideoById(id);

      return ApiResponse.success(res, "Vidéo récupérée avec succès.", video);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const data = { ...req.body };

      // Le chemin est dérivé du fichier uploadé (multipart)
      if (req.file) {
        data.chemin_video = `/uploads/${req.file.filename}`;
      }

      const id = await VideoService.createVideo(data, req.user);

      return ApiResponse.success(res, "Vidéo créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const data = { ...req.body };

      // Le chemin est dérivé du fichier uploadé, s'il y en a un
      if (req.file) {
        data.chemin_video = `/uploads/${req.file.filename}`;
      }

      const video = await VideoService.updateVideo(id, data, req.user);

      return ApiResponse.success(res, "Vidéo modifiée avec succès.", video);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      await VideoService.deleteVideo(id, req.user);

      return ApiResponse.success(res, "Vidéo supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new VideoController();