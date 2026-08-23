import { Router } from "express";

import StudentAnswerController from "../controllers/student-answer.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

const router = Router();

/**
 * Toutes les réponses d'étudiants (admin)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  StudentAnswerController.index,
);

/**
 * Réponses d'une tentative
 *
 * - Étudiant : uniquement ses propres réponses.
 * - Formateur : réponses des tentatives de SES quiz.
 */
router.get(
  "/attempt/:id_tentative",
  authMiddleware,
  roleMiddleware(ROLES.ETUDIANT, ROLES.FORMATEUR, ROLES.ADMIN),
  StudentAnswerController.getByAttempt,
);

/**
 * Une réponse étudiant (avec note / correction si autorisé)
 */
router.get("/:id", authMiddleware, StudentAnswerController.show);

export default router;
