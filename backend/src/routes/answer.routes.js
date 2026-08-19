import { Router } from "express";

import AnswerController from "../controllers/answer.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import {
  createAnswerValidator,
  updateAnswerValidator,
} from "../validators/answer.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  AnswerController.index,
);

router.get(
  "/question/:id_question",
  authMiddleware,
  AnswerController.getByQuestion,
);

router.get("/:id", authMiddleware, AnswerController.show);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createAnswerValidator,
  validate,
  AnswerController.store,
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateAnswerValidator,
  validate,
  AnswerController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  AnswerController.destroy,
);

export default router;