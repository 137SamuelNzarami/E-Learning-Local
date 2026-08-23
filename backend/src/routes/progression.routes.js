import { Router } from "express";
import { param } from "express-validator";

import ProgressionController from "../controllers/progression.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

const router = Router();

/**
 * Ma progression (étudiant courant)
 */
router.get("/me", authMiddleware, ProgressionController.mine);

/**
 * Toutes les progressions (admin)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  ProgressionController.index,
);

/**
 * Progressions d'un utilisateur
 *
 * - Étudiant : uniquement les siennes.
 * - Formateur : celles de ses étudiants.
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  [param("id_utilisateur").isInt({ min: 1 })],
  validate,
  ProgressionController.getByUser,
);

/**
 * Progressions d'une formation (formateur propriétaire / admin)
 */
router.get(
  "/formation/:id_formation",
  authMiddleware,
  roleMiddleware(ROLES.FORMATEUR, ROLES.ADMIN),
  [param("id_formation").isInt({ min: 1 })],
  validate,
  ProgressionController.getByFormation,
);

/**
 * Recalculer toutes les progressions d'une formation (admin)
 */
router.post(
  "/formation/:id_formation/recompute",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  [param("id_formation").isInt({ min: 1 })],
  validate,
  ProgressionController.recompute,
);

export default router;
