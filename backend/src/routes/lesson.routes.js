import { Router } from "express";

import LessonController from "../controllers/lesson.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createLessonValidator,
  updateLessonValidator,
} from "../validators/lesson.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

router.get("/", authMiddleware, LessonController.index);

router.get("/:id", authMiddleware, LessonController.show);

/**
 * État de complétion d'une leçon pour l'utilisateur courant.
 */
router.get("/:id/status", authMiddleware, LessonController.status);

/**
 * Marquer une leçon comme terminée (progression événementielle).
 * Accessible à tout utilisateur authentifié, inscrit à la formation.
 */
router.post("/:id/complete", authMiddleware, LessonController.complete);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createLessonValidator,
  validate,
  LessonController.store,
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateLessonValidator,
  validate,
  LessonController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  LessonController.destroy,
);

export default router;
