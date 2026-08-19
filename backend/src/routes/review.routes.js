import { Router } from "express";

import ReviewController from "../controllers/review.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import ROLES from "../constants/role.js";
import validate from "../middlewares/validate.js";

import {
  createReviewValidator,
  updateReviewValidator,
} from "../validators/review.validator.js";

const router = Router();

/**
 * Tous les avis (données personnelles : administrateur uniquement)
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN),
  ReviewController.index,
);

/**
 * Avis d'un utilisateur
 */
router.get("/user/:id_utilisateur", authMiddleware, ReviewController.getByUser);

/**
 * Avis d'une formation
 */
router.get(
  "/formation/:id_formation",
  authMiddleware,
  ReviewController.getByFormation,
);

/**
 * Un avis
 */
router.get("/:id", authMiddleware, ReviewController.show);

/**
 * Créer un avis
 */
router.post(
  "/",
  authMiddleware,
  createReviewValidator,
  validate,
  ReviewController.store,
);

/**
 * Modifier un avis
 */
router.put(
  "/:id",
  authMiddleware,
  updateReviewValidator,
  validate,
  ReviewController.update,
);

/**
 * Supprimer un avis
 *
 * Propriétaire de l'avis (ou administrateur).
 * La vérification de propriété est faite dans le service.
 */
router.delete("/:id", authMiddleware, ReviewController.destroy);

export default router;
