import { Router } from "express";

import ProgressionController from "../controllers/progression.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  createProgressionValidator,
  updateProgressionValidator,
} from "../validators/progression.validator.js";

const router = Router();

/**
 * Toutes les progressions (données personnelles : admin / formateur)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  ProgressionController.index,
);

/**
 * Progressions d'un utilisateur
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  ProgressionController.getByUser,
);

/**
 * Progressions d'une formation
 */
router.get(
  "/formation/:id_formation",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  ProgressionController.getByFormation,
);

/**
 * Recalculer toutes les progressions d'une formation
 * (leçons terminées + quiz réussis + devoirs remis)
 */
router.post(
  "/formation/:id_formation/recompute",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  ProgressionController.recompute,
);

/**
 * Une progression
 */
router.get("/:id", authMiddleware, ProgressionController.show);

/**
 * Créer une progression
 * (donnée calculée : admin / formateur uniquement)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createProgressionValidator,
  validate,
  ProgressionController.store,
);

/**
 * Modifier une progression
 * (donnée calculée : admin / formateur uniquement)
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateProgressionValidator,
  validate,
  ProgressionController.update,
);

/**
 * Supprimer une progression
 * (donnée calculée : admin / formateur uniquement)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  ProgressionController.destroy,
);

export default router;