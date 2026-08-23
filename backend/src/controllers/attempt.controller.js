import AttemptService from "../services/attempt.service.js";
import ApiResponse from "../utils/api-response.js";

class AttemptController {
  /**
   * Toutes les tentatives (admin)
   */
  async index(req, res) {
    try {
      const rows = await AttemptService.getAllAttempts();
      return ApiResponse.success(
        res,
        "Liste des tentatives récupérée avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Démarrer une tentative sur un quiz
   *
   * - Étudiant inscrit + chapitres précédents validés.
   * - Une seule tentative "EN_COURS" à la fois (idempotent).
   */
  async start(req, res) {
    try {
      const { id_quiz } = req.params;
      const row = await AttemptService.startAttempt(
        { id_quiz },
        req.user,
      );
      return ApiResponse.success(res, "Tentative démarrée avec succès.", row);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Soumettre une tentative EN_COURS
   *
   * Body :
   * {
   *   "reponses": [
   *     { "id_question": 1, "id_reponses": [10] },          // QCM
   *     { "id_question": 2, "contenu": "Ma réponse..." }    // LIBRE
   *   ]
   * }
   *
   * QCM : correction automatique. LIBRE : A_CORRIGER (formateur).
   */
  async submit(req, res) {
    try {
      const { id } = req.params;
      const row = await AttemptService.submitAttempt(id, req.body, req.user);
      return ApiResponse.success(res, "Tentative soumise avec succès.", row);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Correction manuelle des réponses libres
   *
   * Body : { notes: [ { id_reponse_etudiant, note } ] }
   */
  async corriger(req, res) {
    try {
      const { id } = req.params;
      const row = await AttemptService.corrigerTentative(
        id,
        req.body,
        req.user,
      );
      return ApiResponse.success(res, "Tentative corrigée avec succès.", row);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Tentatives d'un quiz :
   * - étudiant : les siennes uniquement ;
   * - formateur propriétaire : celles de ses étudiants ;
   * - administrateur : toutes.
   */
  async byQuiz(req, res) {
    try {
      const { id_quiz } = req.params;
      const rows = await AttemptService.getAttemptsByQuiz(
        id_quiz,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Tentatives du quiz récupérées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Historique des tentatives de l'étudiant courant sur un quiz
   */
  async mine(req, res) {
    try {
      const { id_quiz } = req.params;
      const rows = await AttemptService.getMyHistory(id_quiz, req.user);
      return ApiResponse.success(
        res,
        "Historique des tentatives récupéré avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      const row = await AttemptService.getAttemptById(id, req.user);
      return ApiResponse.success(res, "Tentative récupérée avec succès.", row);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  /**
   * Tentatives d'un étudiant (soi-même / formateur propriétaire / admin)
   */
  async byUser(req, res) {
    try {
      const { id_utilisateur } = req.params;
      const rows = await AttemptService.getAttemptsByUser(
        id_utilisateur,
        req.user,
      );
      return ApiResponse.success(
        res,
        "Tentatives de l'utilisateur récupérées avec succès.",
        rows,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new AttemptController();
