import NotificationService from "../services/notification.service.js";

import ApiResponse from "../utils/api-response.js";

import { parsePagination, paginateRows } from "../utils/pagination.js";

class NotificationController {
  /**
   * Toutes les notifications
   */
  async index(req, res) {
    try {
      const notifications = await NotificationService.getAllNotifications();
      const pagination = parsePagination(req.query);
      const { rows, pagination: meta } = paginateRows(notifications, pagination);

      return ApiResponse.success(
        res,
        "Liste des notifications récupérée avec succès.",
        rows,
        200,
        meta,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Une notification
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const notification = await NotificationService.getNotificationById(
        id,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Notification récupérée avec succès.",
        notification,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Notifications d'un utilisateur
   */
  async getByUser(req, res) {
    try {
      const { id_utilisateur } = req.params;

      const notifications =
        await NotificationService.getNotificationsByUser(
          id_utilisateur,
          req.user,
        );

      const pagination = parsePagination(req.query);
      const { rows, pagination: meta } = paginateRows(notifications, pagination);

      return ApiResponse.success(
        res,
        "Notifications de l'utilisateur récupérées avec succès.",
        rows,
        200,
        meta,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Créer une notification
   */
  async store(req, res) {
    try {
      const id = await NotificationService.createNotification(req.body);

      return ApiResponse.success(res, "Notification créée avec succès.", {
        id,
      }, 201);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Modifier une notification
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const notification = await NotificationService.updateNotification(
        id,
        req.body,
      );

      return ApiResponse.success(
        res,
        "Notification modifiée avec succès.",
        notification,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Marquer une notification comme lue
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(id, req.user);

      return ApiResponse.success(
        res,
        "Notification marquée comme lue.",
        notification,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Notifications non lues de l'utilisateur connecté
   */
  async unread(req, res) {
    try {
      const notifications = await NotificationService.getUnreadNotifications(
        req.user,
      );

      return ApiResponse.success(
        res,
        "Notifications non lues récupérées avec succès.",
        notifications,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Compter les notifications non lues de l'utilisateur connecté
   */
  async countUnread(req, res) {
    try {
      const total = await NotificationService.countUnreadNotifications(
        req.user,
      );

      return ApiResponse.success(
        res,
        "Nombre de notifications non lues récupéré avec succès.",
        { total },
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
  /**
   * Supprimer une notification
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      await NotificationService.deleteNotification(id);

      return ApiResponse.success(res, "Notification supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new NotificationController();