import { Router } from "express";

import UserController from "../controllers/user.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createUserValidator,
  updateUserValidator,
} from "../validators/user.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

/**
 * GET /api/users
 * Liste de tous les utilisateurs
 * Administrateur uniquement
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  UserController.index,
);

/**
 * GET /api/users/:id
 * Détails d'un utilisateur
 *
 * Authentifié pour l'instant.
 * La vérification "est-ce son propre compte ?"
 * sera traitée dans l'autorisation métier.
 */
router.get("/:id", authMiddleware, UserController.show);

/**
 * POST /api/users
 * Créer un utilisateur
 * Administrateur uniquement
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  createUserValidator,
  validate,
  UserController.store,
);

/**
 * PUT /api/users/:id
 * Modifier un utilisateur
 * Administrateur uniquement
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  updateUserValidator,
  validate,
  UserController.update,
);

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur
 * Administrateur uniquement
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  UserController.destroy,
);

export default router;