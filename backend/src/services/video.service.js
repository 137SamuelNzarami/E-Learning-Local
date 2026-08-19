import VideoRepository from "../repositories/video.repository.js";
import LessonRepository from "../repositories/lesson.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/app-errors.js";

class VideoService {
  async getAllVideos() {
    return await VideoRepository.findAll();
  }
  async getVideoById(id) {
    const video = await VideoRepository.findById(id);
    if (!video) {
      throw new NotFoundError("Vidéo introuvable.");
    }
    return video;
  }
  async createVideo(data, user) {
    // Un fichier (ou un chemin explicite) est obligatoire à la création
    if (!data.chemin_video) {
      throw new ValidationError(
        "Le fichier vidéo est obligatoire.",
        [{ field: "fichier", message: "Le fichier vidéo est obligatoire." }],
      );
    }

    const lesson = await LessonRepository.findById(data.id_lecon);
    if (!lesson) {
      throw new NotFoundError("La leçon sélectionnée est introuvable.");
    }
    // Le formateur ne peut créer que dans ses propres leçons
    await assertCanManage("lesson", data.id_lecon, user);
    const existe = await VideoRepository.findByTitle(data.titre);
    if (existe) {
      throw new ConflictError("Une vidéo portant ce titre existe déjà.");
    }
    return await VideoRepository.create(data);
  }
  async updateVideo(id, data, user) {
    const video = await VideoRepository.findById(id);
    if (!video) {
      throw new NotFoundError("Vidéo introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut modifier la vidéo
    await assertCanManage("video", id, user);
    const lesson = await LessonRepository.findById(data.id_lecon);
    if (!lesson) {
      throw new NotFoundError("La leçon sélectionnée est introuvable.");
    }
    // Si la vidéo est déplacée, le formateur doit posséder la leçon cible
    await assertCanManage("lesson", data.id_lecon, user);
    const existe = await VideoRepository.findByTitle(data.titre);
    if (existe && existe.id_video !== Number(id)) {
      throw new ConflictError("Une vidéo portant ce titre existe déjà.");
    }
    try {
      await VideoRepository.update(id, data);

      return await VideoRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  async deleteVideo(id, user) {
    const video = await VideoRepository.findById(id);
    if (!video) {
      throw new NotFoundError("Vidéo introuvable.");
    }
    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("video", id, user);
    try {
      return await VideoRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new VideoService();
