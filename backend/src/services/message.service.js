import MessageRepository from "../repositories/message.repository.js";
import ConversationRepository from "../repositories/conversation.repository.js";
import ConversationParticipantRepository from "../repositories/conversation-participant.repository.js";
import UserRepository from "../repositories/user.repository.js";
import NotificationRepository from "../repositories/notification.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertPersonalAccess, scopeToUser, isAdmin } from "../utils/ownership.js";
import { AccessDeniedError, NotFoundError } from "../utils/app-errors.js";

class MessageService {
  /**
   * Récupérer tous les messages
   * (administrateur uniquement, imposé par la route)
   */
  async getAllMessages() {
    return await MessageRepository.findAll();
  }
  /**
   * Récupérer un message par son ID
   */
  async getMessageById(id, user) {
    const message = await MessageRepository.findById(id);

    if (!message) {
      throw new NotFoundError("Message introuvable.");
    }

    // Un non-admin ne peut lire un message que s'il participe
    // à la conversation correspondante.
    if (!isAdmin(user)) {
      await this.checkParticipation(user.id, message.id_conversation);
    }

    return message;
  }
  /**
   * Récupérer les messages d'une conversation
   */
  async getMessagesByConversation(id_conversation, user) {
    const conversation = await ConversationRepository.findById(id_conversation);

    if (!conversation) {
      throw new NotFoundError("Conversation introuvable.");
    }

    // Un non-admin ne peut lire que les conversations auxquelles
    // il participe.
    if (!isAdmin(user)) {
      await this.checkParticipation(user.id, id_conversation);
    }

    return await MessageRepository.findByConversationId(id_conversation);
  }
  /**
   * Récupérer les messages d'un utilisateur
   */
  async getMessagesBySender(id_expediteur, user) {
    // L'identité est imposée par le token, sauf pour l'administrateur
    const idCible = scopeToUser(user, id_expediteur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await MessageRepository.findBySenderId(idCible);
  }
  /**
   * Vérifier que l'utilisateur participe
   * à la conversation
   */
  async checkParticipation(id_utilisateur, id_conversation) {
    const participant =
      await ConversationParticipantRepository.findByUserAndConversation(
        id_utilisateur,
        id_conversation,
      );

    if (!participant) {
      throw new AccessDeniedError(
        "L'utilisateur n'est pas participant de cette conversation.",
      );
    }

    return participant;
  }
  /**
   * Créer un message
   */
  async createMessage(data, user) {
    // Pour un non-admin, l'expéditeur est imposé par le token
    if (!isAdmin(user)) {
      data.id_expediteur = user.id;
    }

    const conversation = await ConversationRepository.findById(
      data.id_conversation,
    );

    if (!conversation) {
      throw new NotFoundError("Conversation introuvable.");
    }

    const expediteur = await UserRepository.findById(data.id_expediteur);

    if (!expediteur) {
      throw new NotFoundError("Expéditeur introuvable.");
    }

    await this.checkParticipation(data.id_expediteur, data.id_conversation);

    try {
      const messageId = await MessageRepository.create(data);

      this._notifyOtherParticipants(
        data.id_conversation,
        data.id_expediteur,
        conversation.sujet,
      ).catch(() => {});

      return messageId;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async _notifyOtherParticipants(id_conversation, idExpediteur, sujet) {
    const participants =
      await ConversationParticipantRepository.findByConversationId(id_conversation);

    const expediteur = await UserRepository.findById(idExpediteur);
    const nomExpediteur = expediteur
      ? `${expediteur.prenom ?? ""} ${expediteur.nom ?? ""}`
      : "Un utilisateur";

    for (const p of participants) {
      if (Number(p.id_utilisateur) === Number(idExpediteur)) continue;

      await NotificationRepository.create({
        id_utilisateur: p.id_utilisateur,
        titre: "Nouveau message",
        contenu: `${nomExpediteur} a envoyé un message dans « ${sujet || "conversation"} ».`,
      });
    }
  }
  /**
   * Modifier un message
   */
  async updateMessage(id, data, user) {
    const message = await MessageRepository.findById(id);

    if (!message) {
      throw new NotFoundError("Message introuvable.");
    }

    // IDOR : un non-admin ne peut modifier que ses propres messages
    assertPersonalAccess(user, message.id_expediteur);

    if (
      data.id_expediteur &&
      Number(data.id_expediteur) !== Number(message.id_expediteur)
    ) {
      throw new AccessDeniedError("L'expéditeur d'un message ne peut pas être modifié.");
    }

    if (data.id_conversation) {
      if (Number(data.id_conversation) !== Number(message.id_conversation)) {
        throw new AccessDeniedError(
          "La conversation d'un message ne peut pas être modifiée.",
        );
      }
    }

    try {
      await MessageRepository.update(id, data);

      return await MessageRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Supprimer un message
   */
  async deleteMessage(id, user) {
    const message = await MessageRepository.findById(id);

    if (!message) {
      throw new NotFoundError("Message introuvable.");
    }

    // IDOR : un non-admin ne peut supprimer que ses propres messages
    assertPersonalAccess(user, message.id_expediteur);

    try {
      return await MessageRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new MessageService();
