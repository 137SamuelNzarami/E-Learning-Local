import { Router } from "express";
import { param } from "express-validator";

import SousSectionController from "../controllers/sous-section.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createSousSectionValidator,
  updateSousSectionValidator,
} from "../validators/sous-section.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

/**
 * Toutes les sous-sections (vue gestion)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  SousSectionController.index,
);

/**
 * Sous-sections d'une section (liste légère)
 *
 * Étudiant : section accessible uniquement (blocage backend).
 */
router.get("/section/:id_section", authMiddleware, SousSectionController.bySection);

/**
 * Une sous-section AVEC son contenu rich text
 */
router.get("/:id", authMiddleware, SousSectionController.show);

/**
 * Créer une sous-section (contenu rich text)
 *
 * Administrateur + Formateur (propriétaire de la section).
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  createSousSectionValidator,
  validate,
  SousSectionController.store,
);

/**
 * Modifier une sous-section (titre / contenu rich text / ordre)
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  updateSousSectionValidator,
  validate,
  SousSectionController.update,
);

/**
 * Réordonner les sous-sections d'une section
 *
 * Body : { "sous_sections": [9, 7, 8] }
 */
router.patch(
  "/section/:id_section/reorder",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  [param("id_section").isInt({ min: 1 })],
  validate,
  SousSectionController.reorder,
);

/**
 * Supprimer une sous-section
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  SousSectionController.destroy,
);

export default router;
