import { Router } from "express";

import ConversationParticipantController from "../controllers/conversation-participant.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import ROLES from "../constants/role.js";

import validate from "../middlewares/validate.js";

import { createConversationParticipantValidator } from "../validators/conversation-participant.validator.js";

const router = Router();
/**
 * Tous les participants
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  ConversationParticipantController.index,
);
/**
 * Participants d'une conversation
 */
router.get(
  "/conversation/:id_conversation",
  authMiddleware,
  ConversationParticipantController.getByConversation,
);
/**
 * Conversations d'un utilisateur
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  ConversationParticipantController.getByUser,
);
/**
 * Un participant
 */
router.get("/:id", authMiddleware, ConversationParticipantController.show);
/**
 * Ajouter un participant
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  createConversationParticipantValidator,
  validate,
  ConversationParticipantController.store,
);
/**
 * Supprimer un participant
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  ConversationParticipantController.destroy,
);

export default router;