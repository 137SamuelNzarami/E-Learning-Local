import { Router } from "express";

import AssignmentController from "../controllers/assignment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";
import { uploadConsignes } from "../config/upload.js";

import {
  createAssignmentValidator,
  updateAssignmentValidator,
} from "../validators/assignment.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

router.get("/", authMiddleware, AssignmentController.index);

router.get("/:id", authMiddleware, AssignmentController.show);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createAssignmentValidator,
  validate,
  AssignmentController.store,
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateAssignmentValidator,
  validate,
  AssignmentController.update,
);

/**
 * Déposer (ou remplacer) le fichier de consignes d'un devoir.
 * (multipart/form-data, champ `fichier_consignes`)
 */
router.put(
  "/:id/consignes",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  uploadConsignes,
  AssignmentController.uploadConsignes,
);

/**
 * Retirer le fichier de consignes d'un devoir.
 */
router.delete(
  "/:id/consignes",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  AssignmentController.deleteConsignes,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  AssignmentController.destroy,
);

export default router;