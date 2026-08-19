import UserService from "../services/user.service.js";
import ApiResponse from "../utils/api-response.js";
import { parsePagination, paginateRows } from "../utils/pagination.js";

class UserController {
  /**
   * Récupérer tous les utilisateurs
   */
  async index(req, res) {
    try {
      const utilisateurs = await UserService.getAllUsers();
      const pagination = parsePagination(req.query);
      const { rows, pagination: meta } = paginateRows(utilisateurs, pagination);
      return ApiResponse.success(
        res,
        "Liste des utilisateurs récupérée avec succès.",
        rows,
        200,
        meta,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Récupérer un utilisateur par son ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;
      const utilisateur = await UserService.getUserById(id, req.user);
      return ApiResponse.success(
        res,
        "Utilisateur récupéré avec succès.",
        utilisateur,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Ajouter un utilisateur
   */
  async store(req, res) {
    try {
      const id = await UserService.createUser(req.body);
      return ApiResponse.success(res, "Utilisateur créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier un utilisateur
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const utilisateur = await UserService.updateUser(id, req.body);

      return ApiResponse.success(
        res,
        "Utilisateur modifié avec succès.",
        utilisateur,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer un utilisateur
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await UserService.deleteUser(id);

      return ApiResponse.success(res, "Utilisateur supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}
export default new UserController();
