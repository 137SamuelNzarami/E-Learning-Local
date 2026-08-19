import { Router } from "express";

import ChapterController from "../controllers/chapter.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  createChapterValidator,
  updateChapterValidator,
} from "../validators/chapter.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

/**
 * Liste des chapitres
 *
 * Tous les utilisateurs authentifiés
 */
router.get("/", authMiddleware, ChapterController.index);

/**
 * Un chapitre
 *
 * Tous les utilisateurs authentifiés
 */
router.get("/:id", authMiddleware, ChapterController.show);

/**
 * Création
 *
 * Administrateur + Formateur
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createChapterValidator,
  validate,
  ChapterController.store,
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
  updateChapterValidator,
  validate,
  ChapterController.update,
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
  ChapterController.destroy,
);

export default router;