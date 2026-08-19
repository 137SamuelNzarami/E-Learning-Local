import { Router } from "express";

import NotificationController from "../controllers/notification.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import ROLES from "../constants/role.js";

import validate from "../middlewares/validate.js";

import {
  createNotificationValidator,
  updateNotificationValidator,
} from "../validators/notification.validator.js";

import { param } from "express-validator";

const router = Router();
/**
 * Toutes les notifications
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  NotificationController.index,
);
/**
 * Notifications d'un utilisateur
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  NotificationController.getByUser,
);
/**
 * Notifications non lues de l'utilisateur connecté
 */
router.get(
  "/unread",
  authMiddleware,
  NotificationController.unread,
);

/**
 * Nombre de notifications non lues de l'utilisateur connecté
 */
router.get(
  "/count-unread",
  authMiddleware,
  NotificationController.countUnread,
);

/**
 * Marquer une notification comme lue
 * (uniquement la notification de l'utilisateur connecté)
 */
router.patch(
  "/:id/lu",
  authMiddleware,
  param("id").isInt({ min: 1 }).withMessage("L'identifiant est invalide."),
  validate,
  NotificationController.markAsRead,
);

/**
 * Une notification
 */
router.get("/:id", authMiddleware, NotificationController.show);
/**
 * Créer une notification
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  createNotificationValidator,
  validate,
  NotificationController.store,
);
/**
 * Modifier une notification
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  updateNotificationValidator,
  validate,
  NotificationController.update,
);
/**
 * Supprimer une notification
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  NotificationController.destroy,
);

export default router;