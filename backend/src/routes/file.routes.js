import { Router } from "express";
import fs from "node:fs";
import path from "node:path";

import authMiddleware from "../middlewares/auth.middleware.js";
import FileAccessService from "../services/file-access.service.js";
import ApiResponse from "../utils/api-response.js";
import { uploadDir, uploadSingle, assertTypeSize } from "../config/upload.js";

const MIME_TYPES = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

const router = Router();

/**
 * Upload d'un fichier média pédagogique (image / vidéo / document).
 *
 * - Authentification obligatoire.
 * - Champ multipart `fichier`.
 * - Types et tailles contrôlés par `config/upload.js` + `constants/upload.js`.
 * - Retourne l'URL de lecture protégée `/api/files/<nom>` que l'éditeur
 *   rich text insère dans `contenu`. Le contrôle d'accès à la LECTURE
 *   reste appliqué au `GET /api/files/:filename` (JWT + résolution
 *   formation via section / sous-section).
 */
router.post("/upload", authMiddleware, (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      return ApiResponse.error(res, err.message || "Échec de l'upload du fichier.", 400);
    }

    if (!req.file) {
      return ApiResponse.error(res, "Aucun fichier reçu (champ « fichier » attendu).", 400);
    }

    try {
      const type = assertTypeSize(req.file);
      const src = `/api/files/${req.file.filename}`;
      return ApiResponse.success(
        res,
        "Fichier uploadé.",
        {
          fileName: req.file.filename,
          src,
          type,
          mimeType: req.file.mimetype,
        },
        201,
      );
    } catch (error) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return ApiResponse.error(res, error.message, 400);
    }
  });
});

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
 * - Contrôle d'accès par type de ressource (vidéo, document, …).
 * - Support Range natif : 206 Partial Content pour les vidéos longues.
 * - Streaming via fs.createReadStream (pas de chargement en mémoire).
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
      return ApiResponse.error(res, "Fichier introuvable ou accès refusé.", 404);
    }

    const stat = await fs.promises.stat(absolute).catch(() => null);
    if (!stat || !stat.isFile()) {
      return ApiResponse.error(res, "Fichier introuvable.", 404);
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileSize = stat.size;

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Content-Type", contentType);

    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || start < 0 || start > end) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;

      res.status(206)
        .setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`)
        .setHeader("Accept-Ranges", "bytes")
        .setHeader("Content-Length", chunkSize);

      const stream = fs.createReadStream(absolute, { start, end });
      stream.on("error", () => {
        if (!res.headersSent) res.status(500).end();
        else res.end();
      });
      stream.pipe(res);
    } else {
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", fileSize);

      const stream = fs.createReadStream(absolute);
      stream.on("error", () => {
        if (!res.headersSent) res.status(500).end();
        else res.end();
      });
      stream.pipe(res);
    }
  } catch (error) {
    return ApiResponse.fromError(res, error);
  }
});

export default router;
