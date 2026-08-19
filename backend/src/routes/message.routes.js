import { Router } from "express";

import MessageController from "../controllers/message.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import ROLES from "../constants/role.js";

import validate from "../middlewares/validate.js";

import {
  createMessageValidator,
  updateMessageValidator,
} from "../validators/message.validator.js";

const router = Router();

/**
 * Tous les messages
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  MessageController.index,
);

/**
 * Messages d'une conversation
 */
router.get(
  "/conversation/:id_conversation",
  authMiddleware,
  MessageController.getByConversation,
);

/**
 * Messages d'un expéditeur
 */
router.get(
  "/sender/:id_expediteur",
  authMiddleware,
  MessageController.getBySender,
);

/**
 * Un message
 */
router.get("/:id", authMiddleware, MessageController.show);

/**
 * Créer un message
 */
router.post(
  "/",
  authMiddleware,
  createMessageValidator,
  validate,
  MessageController.store,
);

/**
 * Modifier un message
 */
router.put(
  "/:id",
  authMiddleware,
  updateMessageValidator,
  validate,
  MessageController.update,
);

/**
 * Supprimer un message
 */
router.delete("/:id", authMiddleware, MessageController.destroy);

export default router;
