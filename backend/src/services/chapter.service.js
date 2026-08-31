import ChapterRepository from "../repositories/chapter.repository.js";
import FormationRepository from "../repositories/formation.repository.js";
import QuizRepository from "../repositories/quiz.repository.js";
import ProgressionChapitreRepository from "../repositories/progression-chapitre.repository.js";
import ParcoursService from "./parcours.service.js";
import ProgressionService from "./progression.service.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertCanManage,
  isAdmin,
  isEtudiant,
  isFormateur,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/app-errors.js";

class ChapterService {
  /**
   * Tous les chapitres (vue gestion : admin + formateurs).
   * Les étudiants passent par le parcours d'une formation.
   */
  async getAllChapters() {
    return await ChapterRepository.findAll();
  }

  /**
   * Chapitres d'une formation.
   *
   * - Admin / formateur propriétaire : liste complète.
   * - Étudiant inscrit               : parcours (accès + validation).
   */
  async getChaptersByFormation(id_formation, user) {
    const formation = await FormationRepository.findById(id_formation);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    if (!isAdmin(user) && !isFormateur(user)) {
      if (!isEtudiant(user)) {
        throw new AccessDeniedError(
          "Accès interdit. Vous n'avez pas les permissions nécessaires.",
        );
      }
      // Étudiant : vue PARCOURS avec blocage backend
      return await ParcoursService.getParcours(id_formation, user);
    }

    const chapters = await ChapterRepository.findByFormation(id_formation);

    return chapters;
  }

  /**
   * Un chapitre — contrôle du blocage côté backend.
   *
   * Un étudiant qui appelle directement GET /chapters/:id sans avoir
   * validé les chapitres précédents reçoit un refus (403).
   */
  async getChapterById(id, user) {
    // Garde-fou backend (inscription + chapitres précédents validés)
    const chapter = await ParcoursService.assertChapterAccessible(id, user);

    // L'étudiant a besoin du contexte de parcours : état de validation,
    // chapitre suivant et fin de formation (bouton "Chapitre suivant").
    if (isEtudiant(user)) {
      return await ParcoursService.getChapterContext(id, user);
    }

    return chapter;
  }

  /**
   * Créer un chapitre
   */
  async createChapter(data, user) {
    const formation = await FormationRepository.findById(data.id_formation);

    if (!formation) {
      throw new NotFoundError("La formation sélectionnée est introuvable.");
    }

    await assertCanManage("formation", data.id_formation, user);

    const ordre =
      data.ordre ?? (await ChapterRepository.nextOrder(data.id_formation));

    try {
      const id = await ChapterRepository.create({
        ...data,
        ordre,
      });
      return id;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Modifier un chapitre (propriétaire uniquement)
   */
  async updateChapter(id, data, user) {
    const chapter = await ChapterRepository.findById(id);

    if (!chapter) {
      throw new NotFoundError("Chapitre introuvable.");
    }

    await assertCanManage("chapter", id, user);

    try {
      await ChapterRepository.update(id, data);
      return await ChapterRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Réordonner les chapitres d'une formation (propriétaire uniquement)
   */
  async reorderChapters(id_formation, orderedIds, user) {
    const formation = await FormationRepository.findById(id_formation);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    await assertCanManage("formation", id_formation, user);

    const existants = await ChapterRepository.findByFormation(id_formation);
    const idsExistants = existants.map((c) => Number(c.id_chapitre));

    const ids = orderedIds.map(Number);

    if (
      ids.length !== idsExistants.length ||
      !ids.every((id) => idsExistants.includes(id))
    ) {
      throw new ConflictError(
        "La liste de réordonnancement doit contenir exactement tous les chapitres de la formation.",
      );
    }

    await ChapterRepository.reorder(id_formation, ids);

    return await ChapterRepository.findByFormation(id_formation);
  }

  /**
   * Marquer un chapitre SANS quiz comme terminé (étudiant inscrit).
   * Idempotent ; recalcule la progression et débloque la suite.
   */
  async completeChapter(id, user) {
    const chapter = await ChapterRepository.findById(id);

    if (!chapter) {
      throw new NotFoundError("Chapitre introuvable.");
    }

    // accès = inscrit + précédents validés (blocage backend)
    await ParcoursService.assertChapterAccessible(id, user);

    const quizzes = await QuizRepository.findByChapter(id);

    if (quizzes.length > 0) {
      throw new ConflictError(
        "Ce chapitre est validé par son quiz. Il ne peut pas être marqué manuellement.",
      );
    }

    await ProgressionChapitreRepository.upsertComplete(user.id, id);

    const pourcentage = await ProgressionService.recomputeForUserAndFormation(
      user.id,
      chapter.id_formation,
    );

    return { completed: true, pourcentage };
  }

  /**
   * Supprimer un chapitre (propriétaire uniquement)
   */
  async deleteChapter(id, user) {
    const chapter = await ChapterRepository.findById(id);

    if (!chapter) {
      throw new NotFoundError("Chapitre introuvable.");
    }

    await assertCanManage("chapter", id, user);

    try {
      return await ChapterRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer ce chapitre car il contient encore des éléments liés.",
        );
      }
      handleDatabaseError(error);
    }
  }
}

export default new ChapterService();
