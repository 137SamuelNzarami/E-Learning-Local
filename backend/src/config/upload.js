import path from "node:path";
import { fileURLToPath } from "node:url";

import multer from "multer";

import { env } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dossier de stockage des fichiers uploadés.
 *
 * `UPLOAD_PATH` est résolu par rapport à la racine du backend
 * (défaut : `src/uploads` → `<backend>/src/uploads`).
 */
export const uploadDir = path.resolve(
  __dirname,
  "../..",
  env.uploadPath ?? "src/uploads",
);

/**
 * Configuration Multer (PHASE 4 — uploads).
 *
 * - Stockage disque dans `UPLOAD_PATH`.
 * - Nom de fichier : horodatage + nom d'origine assaini + extension.
 * - Taille maximale : 100 Mo (vidéos et documents).
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9\-_]+/gi, "-")
      .slice(0, 80);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

/**
 * Types MIME acceptés.
 *
 * Vidéos : mp4, webm, ogg, mov, mkv, avi
 * Documents : pdf, doc, docx, ppt, pptx, xls, xlsx, txt, md
 */
export const acceptedMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
]);

const fileFilter = (req, file, cb) => {
  if (acceptedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Type de fichier non autorisé. Formats acceptés : vidéos (mp4, webm, ogg, mov, mkv, avi) et documents (pdf, doc, docx, ppt, pptx, xls, xlsx, txt, md).",
      ),
    );
  }
};

/**
 * Middleware d'upload générique : un seul fichier dans le champ `fichier`.
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 Mo
  },
}).single("fichier");

/**
 * Middleware d'upload du fichier de consignes d'un devoir :
 * un seul fichier dans le champ `fichier_consignes`.
 */
export const uploadConsignes = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 Mo
  },
}).single("fichier_consignes");
