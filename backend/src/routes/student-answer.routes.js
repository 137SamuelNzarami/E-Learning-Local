import { Router } from "express";

import StudentAnswerController from "../controllers/student-answer.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  createStudentAnswerValidator,
  updateStudentAnswerValidator,
} from "../validators/student-answer.validator.js";

const router = Router();

/**
 * Toutes les réponses des étudiants (données personnelles : admin / formateur)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  StudentAnswerController.index,
);

/**
 * Réponses d'une tentative
 */
router.get(
  "/attempt/:id_tentative",
  authMiddleware,
  StudentAnswerController.getByAttempt,
);

/**
 * Réponses d'une question
 */
router.get(
  "/question/:id_question",
  authMiddleware,
  StudentAnswerController.getByQuestion,
);

/**
 * Réponses d'un utilisateur
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  StudentAnswerController.getByUser,
);

/**
 * Une réponse étudiant
 */
router.get("/:id", authMiddleware, StudentAnswerController.show);

/**
 * Enregistrer une réponse étudiant
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  createStudentAnswerValidator,
  validate,
  StudentAnswerController.store,
);

/**
 * Modifier une réponse étudiant
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  updateStudentAnswerValidator,
  validate,
  StudentAnswerController.update,
);

/**
 * Supprimer une réponse étudiant
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  StudentAnswerController.destroy,
);

export default router;
