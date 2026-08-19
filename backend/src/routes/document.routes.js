import { Router } from "express";

import DocumentController from "../controllers/document.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.js";
import { uploadSingle } from "../config/upload.js";

import {
  createDocumentValidator,
  updateDocumentValidator,
} from "../validators/document.validator.js";

import ROLES from "../constants/role.js";

const router = Router();

router.get("/", authMiddleware, DocumentController.index);

router.get("/:id", authMiddleware, DocumentController.show);

/**
 * Créer un document (multipart/form-data).
 *
 * Champs : id_lecon, titre, fichier (le fichier).
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  uploadSingle,
  createDocumentValidator,
  validate,
  DocumentController.store,
);

/**
 * Modifier un document (multipart/form-data).
 *
 * Le champ `fichier` est optionnel : s'il est absent, le chemin existant
 * est conservé.
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  uploadSingle,
  updateDocumentValidator,
  validate,
  DocumentController.update,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR),
  DocumentController.destroy,
);

export default router;
