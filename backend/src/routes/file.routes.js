import { Router } from "express";
import fs from "node:fs";

import authMiddleware from "../middlewares/auth.middleware.js";
import FileAccessService from "../services/file-access.service.js";
import ApiResponse from "../utils/api-response.js";
import { uploadDir } from "../config/upload.js";

const router = Router();

/**
 * Autoriser le token en query string (`?token=`) pour que les balises
 * `<video>` et les liens `<a href>` puissent charger les fichiers
 * protégés sans en-tête Authorization personnalisable.
 */
const tokenFromQuery = (req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
};

/**
 * Servir un fichier uploadé protégé.
 *
 * - Authentification obligatoire (header ou `?token=`).
 * - Contrôle d'accès par type de ressource (vidéo, document,
 *   soumission, consignes de devoir).
 * - Support des requêtes Range (lecture vidéo) via `res.sendFile`.
 */
router.get("/:filename", tokenFromQuery, authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;

    const absolute = FileAccessService.resolveAbsolutePath(filename);

    if (!absolute) {
      return ApiResponse.error(res, "Nom de fichier invalide.", 400);
    }

    const access = await FileAccessService.resolveAccess(filename, req.user);

    if (!access.allowed || !access.type) {
      return ApiResponse.error(
        res,
        "Fichier introuvable ou accès refusé.",
        404,
      );
    }

    try {
      await fs.promises.access(absolute, fs.constants.F_OK);
    } catch {
      return ApiResponse.error(res, "Fichier introuvable.", 404);
    }

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, max-age=3600");

    res.sendFile(
      absolute,
      {
        dotfiles: "deny",
        headers: {
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
      },
      (err) => {
        if (err && !res.headersSent) {
          ApiResponse.error(res, "Fichier introuvable.", 404);
        }
      },
    );
  } catch (error) {
    return ApiResponse.fromError(res, error);
  }
});

export default router;
