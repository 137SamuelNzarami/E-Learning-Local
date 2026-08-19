import NotificationRepository from "../repositories/notification.repository.js";
import UserRepository from "../repositories/user.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertPersonalAccess, scopeToUser } from "../utils/ownership.js";
import { NotFoundError } from "../utils/app-errors.js";

class NotificationService {
  /**
   * Récupérer toutes les notifications
   * (administrateur uniquement, imposé par la route)
   */
  async getAllNotifications() {
    return await NotificationRepository.findAll();
  }
  /**
   * Récupérer une notification
   */
  async getNotificationById(id, user) {
    const notification = await NotificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundError("Notification introuvable.");
    }

    // IDOR : un non-admin ne peut lire que ses propres notifications
    assertPersonalAccess(user, notification.id_utilisateur);

    return notification;
  }
  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getNotificationsByUser(id_utilisateur, user) {
    // L'identité est imposée par le token, sauf pour l'administrateur
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await NotificationRepository.findByUserId(idCible);
  }
  /**
   * Créer une notification
   */
  async createNotification(data) {
    const user = await UserRepository.findById(data.id_utilisateur);

    if (!user) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    try {
      return await NotificationRepository.create(data);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Modifier une notification
   */
  async updateNotification(id, data) {
    const notification = await NotificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundError("Notification introuvable.");
    }

    try {
      await NotificationRepository.update(id, data);

      return await NotificationRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Marquer une notification comme lue.
   *
   * Un non-admin ne peut marquer que ses propres notifications (IDOR).
   */
  async markAsRead(id, user) {
    const notification = await NotificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundError("Notification introuvable.");
    }

    // IDOR : seul le propriétaire (ou un administrateur) peut marquer
    assertPersonalAccess(user, notification.id_utilisateur);

    if (notification.lu) {
      return notification;
    }

    await NotificationRepository.markAsRead(id);

    return await NotificationRepository.findById(id);
  }
  /**
   * Récupérer les notifications non lues de l'utilisateur connecté
   */
  async getUnreadNotifications(user) {
    // L'identité est imposée par le token
    return await NotificationRepository.findUnreadByUserId(user.id);
  }
  /**
   * Compter les notifications non lues de l'utilisateur connecté
   */
  async countUnreadNotifications(user) {
    return await NotificationRepository.countUnreadByUserId(user.id);
  }
  /**
   * Supprimer une notification
   */
  async deleteNotification(id) {
    const notification = await NotificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundError("Notification introuvable.");
    }

    try {
      return await NotificationRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new NotificationService();
