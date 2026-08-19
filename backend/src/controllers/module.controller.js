import ModuleService from "../services/module.service.js";
import ApiResponse from "../utils/api-response.js";

class ModuleController {
  /**
   * Récupérer tous les modules
   */
  async index(req, res) {
    try {
      const modules = await ModuleService.getAllModules();

      return ApiResponse.success(
        res,
        "Liste des modules récupérée avec succès.",
        modules,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer un module par son ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const module = await ModuleService.getModuleById(id);
      return ApiResponse.success(res, "Module récupéré avec succès.", module);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Ajouter un module
   */
  async store(req, res) {
    try {
      const id = await ModuleService.createModule(req.body, req.user);

      return ApiResponse.success(res, "Module créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier un module
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const module = await ModuleService.updateModule(id, req.body, req.user);

      return ApiResponse.success(res, "Module modifié avec succès.", module);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer un module
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      await ModuleService.deleteModule(id, req.user);
      return ApiResponse.success(res, "Module supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new ModuleController();