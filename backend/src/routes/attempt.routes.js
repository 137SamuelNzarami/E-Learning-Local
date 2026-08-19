import { Router } from "express";

import AttemptController from "../controllers/attempt.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  createAttemptValidator,
  updateAttemptValidator,
} from "../validators/attempt.validator.js";

const router = Router();
/**
 * Toutes les tentatives (données personnelles : admin / formateur)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  AttemptController.index,
);
/**
 * Tentatives d'un utilisateur
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  AttemptController.getByUser,
);
/**
 * Tentatives d'un quiz
 */
router.get("/quiz/:id_quiz", authMiddleware, AttemptController.getByQuiz);
/**
 * Une tentative
 */
router.get("/:id", authMiddleware, AttemptController.show);
/**
 * Créer une tentative (un étudiant passe son quiz)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  createAttemptValidator,
  validate,
  AttemptController.store,
);
/**
 * Modifier une tentative
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  updateAttemptValidator,
  validate,
  AttemptController.update,
);
/**
 * Supprimer une tentative
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  AttemptController.destroy,
);

export default router;