import MessageService from "../services/message.service.js";
import ApiResponse from "../utils/api-response.js";
import { parsePagination, paginateRows } from "../utils/pagination.js";

class MessageController {
  /**
   * Tous les messages
   */
  async index(req, res) {
    try {
      const messages = await MessageService.getAllMessages();
      const pagination = parsePagination(req.query);
      const { rows, pagination: meta } = paginateRows(messages, pagination);

      return ApiResponse.success(
        res,
        "Liste des messages récupérée avec succès.",
        rows,
        200,
        meta,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Un message
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const message = await MessageService.getMessageById(id, req.user);

      return ApiResponse.success(res, "Message récupéré avec succès.", message);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Messages d'une conversation
   */
  async getByConversation(req, res) {
    try {
      const { id_conversation } = req.params;

      const messages =
        await MessageService.getMessagesByConversation(id_conversation, req.user);

      const pagination = parsePagination(req.query);
      const { rows, pagination: meta } = paginateRows(messages, pagination);

      return ApiResponse.success(
        res,
        "Messages de la conversation récupérés avec succès.",
        rows,
        200,
        meta,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Messages d'un utilisateur
   */
  async getBySender(req, res) {
    try {
      const { id_expediteur } = req.params;

      const messages = await MessageService.getMessagesBySender(id_expediteur, req.user);

      return ApiResponse.success(
        res,
        "Messages de l'expéditeur récupérés avec succès.",
        messages,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Créer un message
   */
  async store(req, res) {
    try {
      const id = await MessageService.createMessage(req.body, req.user);

      return ApiResponse.success(res, "Message créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier un message
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const message = await MessageService.updateMessage(id, req.body, req.user);

      return ApiResponse.success(res, "Message modifié avec succès.", message);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer un message
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await MessageService.deleteMessage(id, req.user);

      return ApiResponse.success(res, "Message supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new MessageController();