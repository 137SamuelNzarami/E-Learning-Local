import { Router } from "express";

import QuestionController from "../controllers/question.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  createQuestionValidator,
  updateQuestionValidator,
} from "../validators/question.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

// Questions d'un quiz (étudiant autorisé : réponses SANS indicateur de correction)
router.get("/quiz/:id_quiz", authMiddleware, QuestionController.getByQuiz);

router.get("/", authMiddleware, roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR), QuestionController.index);

router.get("/:id", authMiddleware, QuestionController.show);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createQuestionValidator,
  validate,
  QuestionController.store,
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateQuestionValidator,
  validate,
  QuestionController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  QuestionController.destroy,
);

export default router;