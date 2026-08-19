import { Router } from "express";

import SubmissionController from "../controllers/submission.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";
import { uploadSingle } from "../config/upload.js";

import {
  createSubmissionValidator,
  updateSubmissionValidator,
} from "../validators/submission.validator.js";

const router = Router();
/**
 * Toutes les soumissions (données personnelles : admin / formateur)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  SubmissionController.index,
);
/**
 * Soumissions d'un utilisateur
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  SubmissionController.getByUser,
);
/**
 * Soumissions d'un devoir
 */
router.get(
  "/assignment/:id_devoir",
  authMiddleware,
  SubmissionController.getByAssignment,
);
/**
 * Une soumission
 */
router.get("/:id", authMiddleware, SubmissionController.show);
/**
 * Créer une soumission (un étudiant soumet son devoir)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  uploadSingle,
  createSubmissionValidator,
  validate,
  SubmissionController.store,
);
/**
 * Modifier une soumission
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  uploadSingle,
  updateSubmissionValidator,
  validate,
  SubmissionController.update,
);
/**
 * Supprimer une soumission
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  SubmissionController.destroy,
);

export default router;
