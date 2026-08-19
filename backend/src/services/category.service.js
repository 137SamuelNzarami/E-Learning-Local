import CategoryRepository from "../repositories/category.repository.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class CategoryService {
  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories() {
    return await CategoryRepository.findAll();
  }
  /**
   * Récupérer une catégorie par son identifiant
   */
  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Catégorie introuvable.");
    }
    return category;
  }
  /**
   * Créer une catégorie
   */
  async createCategory(data) {
    const exists = await CategoryRepository.findByName(data.nom_categorie);
    if (exists) {
      throw new ConflictError("Cette catégorie existe déjà.");
    }
    const id = await CategoryRepository.create(data);
    return {
      id,
    };
  }
  /**
   * Modifier une catégorie
   */
  async updateCategory(id, data) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Catégorie introuvable.");
    }

    const exists = await CategoryRepository.findByName(data.nom_categorie);
    if (exists && exists.id_categorie !== Number(id)) {
      throw new ConflictError("Cette catégorie existe déjà.");
    }

    await CategoryRepository.update(id, data);
    return true;
  }
  /**
   * Supprimer une catégorie
   */
  async deleteCategory(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Catégorie introuvable.");
    }
    try {
      return await CategoryRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer cette catégorie car elle est utilisée par une ou plusieurs formations.",
        );
      }

      handleDatabaseError(error);
    }
  }
}

export default new CategoryService();
