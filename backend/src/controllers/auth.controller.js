import AuthService from "../services/auth.service.js";
import ApiResponse from "../utils/api-response.js";

class AuthController {
  /**
   * Inscription
   */
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);

      return ApiResponse.success(res, "Inscription réussie.", result, 201);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Connexion
   */
  async login(req, res) {
    try {
      const { email, mot_de_passe } = req.body;

      const result = await AuthService.login(email, mot_de_passe);

      return ApiResponse.success(res, "Connexion réussie.", result);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Changement de mot de passe de l'utilisateur connecté
   */
  async changePassword(req, res) {
    try {
      const { mot_de_passe_actuel, mot_de_passe } = req.body;

      const result = await AuthService.changePassword(
        req.user.id,
        mot_de_passe_actuel,
        mot_de_passe,
      );

      return ApiResponse.success(
        res,
        "Mot de passe modifié avec succès.",
        result,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Profil de l'utilisateur connecté
   */
  async profile(req, res) {
    try {
      const utilisateur = await AuthService.getCurrentUser(req.user.id);

      return ApiResponse.success(
        res,
        "Profil récupéré avec succès.",
        utilisateur,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new AuthController();