import { Router } from "express";

import FormationController from "../controllers/formation.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  createFormationValidator,
  updateFormationValidator,
} from "../validators/formation.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

/**
 * Toutes les formations
 *
 * Administrateur + Formateur + Étudiant
 */
router.get("/", authMiddleware, FormationController.index);

/**
 * Une formation
 *
 * Administrateur + Formateur + Étudiant
 */
router.get("/:id", authMiddleware, FormationController.show);

/**
 * Créer une formation
 *
 * Administrateur + Formateur
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createFormationValidator,
  validate,
  FormationController.store,
);

/**
 * Modifier une formation
 *
 * Administrateur + Formateur (propriétaire).
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateFormationValidator,
  validate,
  FormationController.update,
);

/**
 * Supprimer une formation
 *
 * Administrateur + Formateur (propriétaire).
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  FormationController.destroy,
);

export default router;