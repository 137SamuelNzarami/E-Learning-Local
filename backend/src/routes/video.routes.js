import { Router } from "express";

import VideoController from "../controllers/video.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";
import { uploadSingle } from "../config/upload.js";

import {
  createVideoValidator,
  updateVideoValidator,
} from "../validators/video.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

router.get("/", authMiddleware, VideoController.index);

router.get("/:id", authMiddleware, VideoController.show);

/**
 * Créer une vidéo (multipart/form-data).
 *
 * Champs : id_lecon, titre, fichier (le fichier vidéo).
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  uploadSingle,
  createVideoValidator,
  validate,
  VideoController.store,
);

/**
 * Modifier une vidéo (multipart/form-data).
 *
 * Le champ `fichier` est optionnel : s'il est absent, le chemin existant
 * est conservé.
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  uploadSingle,
  updateVideoValidator,
  validate,
  VideoController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  VideoController.destroy,
);

export default router;