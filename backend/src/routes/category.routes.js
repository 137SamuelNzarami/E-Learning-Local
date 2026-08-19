import { Router } from "express";

import CategoryController from "../controllers/category.controller.js";

import categoryValidator from "../validators/category.validator.js";

import validate from "../middlewares/validate.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import ROLES from "../constants/role.js";

const router = Router();

/**
 * ==============================
 * Routes publiques
 * ==============================
 */
/**
 * Récupérer toutes les catégories
 */
router.get("/", CategoryController.index);
/**
 * Récupérer une catégorie par son identifiant
 */
router.get("/:id", CategoryController.show);
/**
 * ==============================
 * Routes protégées
 * ==============================
 */
/**
 * Créer une catégorie
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  categoryValidator,
  validate,
  CategoryController.store,
);
/**
 * Modifier une catégorie
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  categoryValidator,
  validate,
  CategoryController.update,
);
/**
 * Supprimer une catégorie
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  CategoryController.destroy,
);

export default router;
