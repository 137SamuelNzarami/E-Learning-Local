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
 * Tous les chapitres (vue gestion)
 *
 * Administrateur + Formateur
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  ChapterController.index,
);

/**
 * Chapitres d'une formation
 *
 * - Étudiant : vue PARCOURS (accessible / verrouillé / validé).
 * - Admin + Formateur : liste complète.
 */
router.get("/formation/:id_formation", authMiddleware, ChapterController.byFormation);

/**
 * Un chapitre
 *
 * Étudiant : le backend vérifie inscription + chapitres précédents validés.
 */
router.get("/:id", authMiddleware, ChapterController.show);

/**
 * Créer un chapitre
 *
 * Administrateur + Formateur (propriétaire de la formation).
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
 * Modifier un chapitre
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
 * Réordonner les chapitres d'une formation
 *
 * Body : { "chapitres": [3, 1, 2] }
 */
router.patch(
  "/formation/:id_formation/reorder",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  ChapterController.reorder,
);

/**
 * Marquer un chapitre SANS quiz comme terminé (étudiant inscrit)
 */
router.post("/:id/complete", authMiddleware, ChapterController.complete);

/**
 * Supprimer un chapitre
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
