import { Router } from "express";
import { param } from "express-validator";

import SectionController from "../controllers/section.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createSectionValidator,
  updateSectionValidator,
} from "../validators/section.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

/**
 * Toutes les sections (vue gestion)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  SectionController.index,
);

/**
 * Sections d'un chapitre
 *
 * Étudiant : chapitre accessible uniquement (blocage backend).
 */
router.get("/chapter/:id_chapitre", authMiddleware, SectionController.byChapter);

/**
 * Une section
 */
router.get("/:id", authMiddleware, SectionController.show);

/**
 * Créer une section
 *
 * Administrateur + Formateur (propriétaire du chapitre).
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createSectionValidator,
  validate,
  SectionController.store,
);

/**
 * Modifier une section
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateSectionValidator,
  validate,
  SectionController.update,
);

/**
 * Réordonner les sections d'un chapitre
 *
 * Body : { "sections": [5, 4, 6] }
 */
router.patch(
  "/chapter/:id_chapitre/reorder",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  [param("id_chapitre").isInt({ min: 1 })],
  validate,
  SectionController.reorder,
);

/**
 * Supprimer une section (sous-sections supprimées en cascade)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  SectionController.destroy,
);

export default router;
