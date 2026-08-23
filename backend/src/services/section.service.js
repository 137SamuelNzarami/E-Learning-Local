import SectionRepository from "../repositories/section.repository.js";
import ParcoursService from "./parcours.service.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class SectionService {
  /**
   * Toutes les sections (vue gestion : admin + formateurs)
   */
  async getAllSections() {
    return await SectionRepository.findAll();
  }

  /**
   * Sections d'un chapitre.
   *
   * - Admin / formateur propriétaire : liste complète.
   * - Étudiant : le chapitre doit être accessible (blocage backend).
   */
  async getSectionsByChapter(id_chapitre, user) {
    await ParcoursService.assertChapterAccessible(id_chapitre, user);

    return await SectionRepository.findByChapter(id_chapitre);
  }

  /**
   * Une section — le chapitre parent doit être accessible.
   */
  async getSectionById(id, user) {
    const section = await SectionRepository.findById(id);

    if (!section) {
      throw new NotFoundError("Section introuvable.");
    }

    await ParcoursService.assertChapterAccessible(section.id_chapitre, user);

    return section;
  }

  /**
   * Créer une section
   */
  async createSection(data, user) {
    await assertCanManage("chapter", data.id_chapitre, user);

    const ordre =
      data.ordre ?? (await SectionRepository.nextOrder(data.id_chapitre));

    try {
      return await SectionRepository.create({ ...data, ordre });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Modifier une section
   */
  async updateSection(id, data, user) {
    const section = await SectionRepository.findById(id);

    if (!section) {
      throw new NotFoundError("Section introuvable.");
    }

    await assertCanManage("section", id, user);

    try {
      await SectionRepository.update(id, data);
      return await SectionRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Réordonner les sections d'un chapitre (propriétaire uniquement)
   */
  async reorderSections(id_chapitre, orderedIds, user) {
    await assertCanManage("chapter", id_chapitre, user);

    const existants = await SectionRepository.findByChapter(id_chapitre);
    const idsExistants = existants.map((s) => Number(s.id_section));
    const ids = orderedIds.map(Number);

    if (
      ids.length !== idsExistants.length ||
      !ids.every((id) => idsExistants.includes(id))
    ) {
      throw new ConflictError(
        "La liste de réordonnancement doit contenir exactement toutes les sections.",
      );
    }

    await SectionRepository.reorder(id_chapitre, ids);

    return await SectionRepository.findByChapter(id_chapitre);
  }

  /**
   * Supprimer une section (sous-sections supprimées en CASCADE)
   */
  async deleteSection(id, user) {
    const section = await SectionRepository.findById(id);

    if (!section) {
      throw new NotFoundError("Section introuvable.");
    }

    await assertCanManage("section", id, user);

    try {
      return await SectionRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new SectionService();
