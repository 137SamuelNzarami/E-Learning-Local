import ConversationParticipantRepository from "../repositories/conversation-participant.repository.js";

import ConversationRepository from "../repositories/conversation.repository.js";

import UserRepository from "../repositories/user.repository.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import { isAdmin, scopeToUser } from "../utils/ownership.js";
import { AccessDeniedError, ConflictError, NotFoundError } from "../utils/app-errors.js";

class ConversationParticipantService {
  /**
   * Récupérer tous les participants
   * (administrateur uniquement, imposé par la route)
   */
  async getAllParticipants() {
    return await ConversationParticipantRepository.findAll();
  }
  /**
   * Récupérer un participant par son ID
   */
  async getParticipantById(id, user) {
    const participant = await ConversationParticipantRepository.findById(id);

    if (!participant) {
      throw new NotFoundError("Participant introuvable.");
    }

    // Un non-admin ne peut consulter un participant que s'il participe
    // lui-même à la conversation.
    if (!isAdmin(user)) {
      const own = await ConversationParticipantRepository.findByUserAndConversation(
        user.id,
        participant.id_conversation,
      );

      if (!own) {
        throw new AccessDeniedError(
          "L'utilisateur n'est pas participant de cette conversation.",
        );
      }
    }

    return participant;
  }
  /**
   * Récupérer les participants d'une conversation
   */
  async getParticipantsByConversation(id_conversation, user) {
    const conversation = await ConversationRepository.findById(id_conversation);

    if (!conversation) {
      throw new NotFoundError("Conversation introuvable.");
    }

    // Un non-admin ne voit les participants que s'il participe
    // lui-même à la conversation.
    if (!isAdmin(user)) {
      const own = await ConversationParticipantRepository.findByUserAndConversation(
        user.id,
        id_conversation,
      );

      if (!own) {
        throw new AccessDeniedError(
          "L'utilisateur n'est pas participant de cette conversation.",
        );
      }
    }

    return await ConversationParticipantRepository.findByConversationId(
      id_conversation,
    );
  }
  /**
   * Récupérer les conversations d'un utilisateur
   */
  async getConversationsByUser(id_utilisateur, user) {
    // L'identité est imposée par le token, sauf pour l'administrateur
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await ConversationParticipantRepository.findByUserId(idCible);
  }
  /**
   * Ajouter un participant
   */
  async addParticipant(data) {
    const conversation = await ConversationRepository.findById(
      data.id_conversation,
    );

    if (!conversation) {
      throw new NotFoundError("Conversation introuvable.");
    }

    const user = await UserRepository.findById(data.id_utilisateur);

    if (!user) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const existing =
      await ConversationParticipantRepository.findByUserAndConversation(
        data.id_utilisateur,
        data.id_conversation,
      );

    if (existing) {
      throw new ConflictError("Cet utilisateur participe déjà à cette conversation.");
    }

    try {
      return await ConversationParticipantRepository.create(data);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Supprimer un participant
   */
  async removeParticipant(id) {
    const participant = await ConversationParticipantRepository.findById(id);

    if (!participant) {
      throw new NotFoundError("Participant introuvable.");
    }

    try {
      return await ConversationParticipantRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new ConversationParticipantService();
