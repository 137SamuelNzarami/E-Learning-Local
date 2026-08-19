import { Router } from "express";

import ConversationController from "../controllers/conversation.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import ROLES from "../constants/role.js";
import validate from "../middlewares/validate.js";

import {
    createConversationValidator,
    updateConversationValidator
} from "../validators/conversation.validator.js";

const router = Router();

/**
 * Toutes les conversations (administrateur uniquement)
 */
router.get(
    "/",
    authMiddleware,
    roleMiddleware(ROLES.ADMIN),
    ConversationController.index
);

/**
 * Une conversation
 */
router.get(
    "/:id",
    authMiddleware,
    ConversationController.show
);

/**
 * Créer une conversation
 */
router.post(
    "/",
    authMiddleware,
    createConversationValidator,
    validate,
    ConversationController.store
);

/**
 * Modifier une conversation
 */
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware(ROLES.ADMIN),
    updateConversationValidator,
    validate,
    ConversationController.update
);

/**
 * Supprimer une conversation
 */
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(ROLES.ADMIN),
    ConversationController.destroy
);

export default router;