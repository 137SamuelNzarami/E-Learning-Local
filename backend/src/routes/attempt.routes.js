import { Router } from "express";
import { param } from "express-validator";

import AttemptController from "../controllers/attempt.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  startAttemptValidator,
  submitAttemptValidator,
} from "../validators/attempt.validator.js";

const router = Router();

/**
 * Toutes les tentatives (admin)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  AttemptController.index,
);

/**
 * Tentatives d'un utilisateur
 *
 * - Étudiant : uniquement les siennes.
 * - Formateur : celles de ses étudiants.
 */
router.get("/user/:id_utilisateur", authMiddleware, AttemptController.byUser);

/**
 * Démarrer une tentative sur un quiz
 *
 * Étudiant inscrit, chapitres précédents validés,
 * aucune tentative EN_COURS existante.
 */
router.post(
  "/quiz/:id_quiz/start",
  authMiddleware,
  roleMiddleware(ROLES.ETUDIANT),
  startAttemptValidator,
  validate,
  AttemptController.start,
);

/**
 * Soumettre une tentative EN_COURS
 *
 * Body : { reponses: [ { id_question, id_reponses } | { id_question, contenu } ] }
 */
router.post(
  "/:id/submit",
  authMiddleware,
  roleMiddleware(ROLES.ETUDIANT),
  submitAttemptValidator,
  validate,
  AttemptController.submit,
);

/**
 * Mes tentatives sur un quiz
 */
router.get(
  "/quiz/:id_quiz/mine",
  authMiddleware,
  roleMiddleware(ROLES.ETUDIANT),
  AttemptController.mine,
);

/**
 * Une tentative (détail + réponses étudiant)
 */
router.get("/:id", authMiddleware, AttemptController.show);

/**
 * Correction manuelle des réponses libres
 *
 * Formateur propriétaire du quiz / admin.
 * Body : { notes: [ { id_reponse_etudiant, note } ] }
 */
router.patch(
  "/:id/corriger",
  authMiddleware,
  roleMiddleware(ROLES.FORMATEUR, ROLES.ADMIN),
  AttemptController.corriger,
);

export default router;
