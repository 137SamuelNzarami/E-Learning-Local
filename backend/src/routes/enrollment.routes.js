import { Router } from "express";

import EnrollmentController from "../controllers/enrollment.controller.js";

import ROLES from "../constants/role.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

import validate from "../middlewares/validate.js";

import { createEnrollmentValidator } from "../validators/enrollment.validator.js";

const router = Router();
/**
 * Toutes les inscriptions (données personnelles : admin / formateur)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  EnrollmentController.index,
);
/**
 * Inscriptions d'un utilisateur
 */
router.get(
  "/user/:id_utilisateur",
  authMiddleware,
  EnrollmentController.getByUser,
);
/**
 * Étudiants d'une formation
 */
router.get(
  "/formation/:id_formation",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  EnrollmentController.getByFormation,
);
/**
 * Une inscription
 */
router.get("/:id", authMiddleware, EnrollmentController.show);

/**
 * Créer une inscription (auto-inscription pour un étudiant)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  createEnrollmentValidator,
  validate,
  EnrollmentController.store,
);
/**
 * Supprimer une inscription
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR, ROLES.ETUDIANT),
  EnrollmentController.destroy,
);

export default router;