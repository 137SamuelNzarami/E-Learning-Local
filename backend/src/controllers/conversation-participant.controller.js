import ConversationParticipantService from "../services/conversation-participant.service.js";

import ApiResponse from "../utils/api-response.js";

class ConversationParticipantController {
  /**
   * Tous les participants
   */
  async index(req, res) {
    try {
      const participants =
        await ConversationParticipantService.getAllParticipants();

      return ApiResponse.success(
        res,
        "Liste des participants récupérée avec succès.",
        participants,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Un participant
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const participant =
        await ConversationParticipantService.getParticipantById(id, req.user);

      return ApiResponse.success(
        res,
        "Participant récupéré avec succès.",
        participant,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Participants d'une conversation
   */
  async getByConversation(req, res) {
    try {
      const { id_conversation } = req.params;

      const participants =
        await ConversationParticipantService.getParticipantsByConversation(
          id_conversation,
          req.user,
        );

      return ApiResponse.success(
        res,
        "Participants de la conversation récupérés avec succès.",
        participants,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Conversations d'un utilisateur
   */
  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const conversations =
        await ConversationParticipantService.getConversationsByUser(
          id_utilisateur,
          req.user,
        );

      return ApiResponse.success(
        res,
        "Conversations de l'utilisateur récupérées avec succès.",
        conversations,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Ajouter un participant
   */
  async store(req, res) {
    try {
      const id = await ConversationParticipantService.addParticipant(req.body);

      return ApiResponse.success(res, "Participant ajouté avec succès.", {
        id,
      });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer un participant
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await ConversationParticipantService.removeParticipant(id);

      return ApiResponse.success(res, "Participant supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new ConversationParticipantController();