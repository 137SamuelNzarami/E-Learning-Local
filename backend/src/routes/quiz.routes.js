import { Router } from "express";

import QuizController from "../controllers/quiz.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createQuizValidator,
  updateQuizValidator,
} from "../validators/quiz.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

router.get("/", authMiddleware, QuizController.index);

router.get("/:id", authMiddleware, QuizController.show);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createQuizValidator,
  validate,
  QuizController.store,
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateQuizValidator,
  validate,
  QuizController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  QuizController.destroy,
);

export default router;
