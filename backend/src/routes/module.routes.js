import { Router } from "express";

import ModuleController from "../controllers/module.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createModuleValidator,
  updateModuleValidator,
} from "../validators/module.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

/**
 * Liste des modules
 *
 * Tous les utilisateurs authentifiés
 */
router.get("/", authMiddleware, ModuleController.index);

/**
 * Un module
 *
 * Tous les utilisateurs authentifiés
 */
router.get("/:id", authMiddleware, ModuleController.show);

/**
 * Création
 *
 * Administrateur + Formateur
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createModuleValidator,
  validate,
  ModuleController.store,
);

/**
 * Modification
 *
 * Administrateur + Formateur (propriétaire).
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateModuleValidator,
  validate,
  ModuleController.update,
);

/**
 * Suppression
 *
 * Administrateur + Formateur (propriétaire).
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  ModuleController.destroy,
);

export default router;
