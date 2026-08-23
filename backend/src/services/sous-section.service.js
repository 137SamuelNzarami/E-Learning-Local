import SousSectionRepository from "../repositories/sous-section.repository.js";
import SectionRepository from "../repositories/section.repository.js";
import ParcoursService from "./parcours.service.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class SousSectionService {
  /**
   * Toutes les sous-sections (vue gestion : admin + formateurs)
   */
  async getAllSousSections() {
    return await SousSectionRepository.findAll();
  }

  /**
   * Sous-sections d'une section (listes légères, sans contenu).
   *
   * - Admin / formateur propriétaire : liste complète.
   * - Étudiant : la section parente doit être accessible (blocage backend).
   */
  async getSousSectionsBySection(id_section, user) {
    await this._assertSectionAccessible(id_section, user);

    return await SousSectionRepository.findBySection(id_section);
  }

  /**
   * Une sous-section AVEC son contenu rich text.
   *
   * Le contrôle d'accès est fait côté backend :
   * un étudiant ne peut pas lire le contenu d'une section verrouillée.
   */
  async getSousSectionById(id, user) {
    const sousSection = await SousSectionRepository.findById(id);

    if (!sousSection) {
      throw new NotFoundError("Sous-section introuvable.");
    }

    await this._assertSectionAccessible(sousSection.id_section, user);

    return sousSection;
  }

  /**
   * Créer une sous-section (contenu rich text)
   */
  async createSousSection(data, user) {
    await assertCanManage("section", data.id_section, user);

    const ordre =
      data.ordre ?? (await SousSectionRepository.nextOrder(data.id_section));

    try {
      return await SousSectionRepository.create({ ...data, ordre });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Modifier une sous-section (titre / contenu rich text / ordre)
   */
  async updateSousSection(id, data, user) {
    const sousSection = await SousSectionRepository.findById(id);

    if (!sousSection) {
      throw new NotFoundError("Sous-section introuvable.");
    }

    await assertCanManage("sous-section", id, user);

    try {
      await SousSectionRepository.update(id, data);
      return await SousSectionRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Réordonner les sous-sections d'une section (propriétaire uniquement)
   */
  async reorderSousSections(id_section, orderedIds, user) {
    await assertCanManage("section", id_section, user);

    const existants = await SousSectionRepository.findBySection(id_section);
    const idsExistants = existants.map((s) => Number(s.id_sous_section));
    const ids = orderedIds.map(Number);

    if (
      ids.length !== idsExistants.length ||
      !ids.every((id) => idsExistants.includes(id))
    ) {
      throw new ConflictError(
        "La liste de réordonnancement doit contenir exactement toutes les sous-sections.",
      );
    }

    await SousSectionRepository.reorder(id_section, ids);

    return await SousSectionRepository.findBySection(id_section);
  }

  /**
   * Supprimer une sous-section (propriétaire uniquement)
   */
  async deleteSousSection(id, user) {
    const sousSection = await SousSectionRepository.findById(id);

    if (!sousSection) {
      throw new NotFoundError("Sous-section introuvable.");
    }

    await assertCanManage("sous-section", id, user);

    try {
      return await SousSectionRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Garde-fou : la SECTION doit être lisible par l'utilisateur
   * (inscription + chapitres précédents validés pour un étudiant).
   */
  async _assertSectionAccessible(id_section, user) {
    const section = await SectionRepository.findById(id_section);

    if (!section) {
      throw new NotFoundError("Section introuvable.");
    }

    await ParcoursService.assertChapterAccessible(section.id_chapitre, user);

    return section;
  }
}

export default new SousSectionService();
