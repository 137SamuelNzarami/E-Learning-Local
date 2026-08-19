import AssignmentRepository from "../repositories/assignment.repository.js";
import LessonRepository from "../repositories/lesson.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import {
  ConflictError,
  NotFoundError,
} from "../utils/app-errors.js";

class AssignmentService {
  async getAllAssignments() {
    return await AssignmentRepository.findAll();
  }

  async getAssignmentById(id) {
    const assignment = await AssignmentRepository.findById(id);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    return assignment;
  }

  async createAssignment(data, user) {
    const lesson = await LessonRepository.findById(data.id_lecon);

    if (!lesson) {
      throw new NotFoundError("Leçon introuvable.");
    }

    // Le formateur ne peut créer que dans ses propres leçons
    await assertCanManage("lesson", data.id_lecon, user);

    const existing = await AssignmentRepository.findByTitle(data.titre);

    if (existing) {
      throw new ConflictError("Un devoir avec ce titre existe déjà.");
    }

    try {
      return await AssignmentRepository.create(data);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async updateAssignment(id, data, user) {
    const assignment = await AssignmentRepository.findById(id);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut modifier le devoir
    await assertCanManage("assignment", id, user);

    const lesson = await LessonRepository.findById(data.id_lecon);

    if (!lesson) {
      throw new NotFoundError("Leçon introuvable.");
    }

    // Si le devoir est déplacé, le formateur doit posséder la leçon cible
    await assertCanManage("lesson", data.id_lecon, user);

    const existing = await AssignmentRepository.findByTitle(data.titre);

    if (existing && existing.id_devoir !== Number(id)) {
      throw new ConflictError("Un devoir avec ce titre existe déjà.");
    }

    try {
      await AssignmentRepository.update(id, data);

      return await AssignmentRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async deleteAssignment(id, user) {
    const assignment = await AssignmentRepository.findById(id);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("assignment", id, user);

    try {
      return await AssignmentRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer ce devoir car des soumissions y sont associées.",
        );
      }

      handleDatabaseError(error);
    }
  }

  /**
   * Associer (ou remplacer) le fichier de consignes d'un devoir.
   */
  async setConsignes(id, fichierConsignes, user) {
    const assignment = await AssignmentRepository.findById(id);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    await assertCanManage("assignment", id, user);

    await AssignmentRepository.update(id, { fichier_consignes: fichierConsignes });

    return await AssignmentRepository.findById(id);
  }

  /**
   * Retirer le fichier de consignes d'un devoir.
   */
  async clearConsignes(id, user) {
    const assignment = await AssignmentRepository.findById(id);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    await assertCanManage("assignment", id, user);

    await AssignmentRepository.update(id, { fichier_consignes: null });

    return await AssignmentRepository.findById(id);
  }
}

export default new AssignmentService();
