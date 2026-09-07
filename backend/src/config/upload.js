import path from "node:path";
import { fileURLToPath } from "node:url";

import multer from "multer";

import { env } from "./env.js";
import UPLOAD from "../constants/upload.js";

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
 * Types MIME acceptés = union des trois familles (image/vidéo/document),
 * alignés EXACTEMENT sur `constants/upload.js` (source unique de vérité).
 */
export const acceptedMimeTypes = new Set([
  ...UPLOAD.IMAGE_MIME_TYPES,
  ...UPLOAD.VIDEO_MIME_TYPES,
  ...UPLOAD.DOCUMENT_MIME_TYPES,
]);

const FILE_FILTER_ERROR =
  "Type de fichier non autorisé. Formats acceptés : images (jpg, jpeg, png, webp), vidéos (mp4, webm, ogg, mov, mkv, avi) et documents (pdf, doc, docx, ppt, pptx, xls, xlsx, txt, md).";

const fileFilter = (req, file, cb) => {
  if (acceptedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(FILE_FILTER_ERROR));
  }
};

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
    // L'id de l'utilisateur authentifié est encodé en préfixe du nom de
    // fichier : il permet au serveur d'accorder à SON propriétaire un
    // accès immédiat au fichier (prévisualisation avant sauvegarde de la
    // section), sans affaiblir les règles d'accès des autres rôles.
    const owner = req.user?.id ?? "u";
    cb(null, `${owner}-${Date.now()}-${base}${ext}`);
  },
});

/**
 * Middleware d'upload générique : un seul fichier dans le champ `fichier`.
 *
 * La limite multer (`fileSize`) est le maximum GLOBAL des trois familles ;
 * la limite spécifique à chaque type (image 5 Mo, vidéo 500 Mo, document
 * 20 Mo) est ensuite vérifiée par `assertTypeSize` après réception du
 * fichier (multer ne peut pas appliquer une taille différente par MIME).
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD.MAX_FILE_SIZE,
  },
}).single("fichier");

/**
 * Famille média associée à un MIME ('image' | 'video' | 'document').
 */
export function getUploadMeta(mimetype) {
  if (UPLOAD.IMAGE_MIME_TYPES.includes(mimetype)) {
    return { type: "image", maxSize: UPLOAD.MAX_IMAGE_SIZE };
  }
  if (UPLOAD.VIDEO_MIME_TYPES.includes(mimetype)) {
    return { type: "video", maxSize: UPLOAD.MAX_VIDEO_SIZE };
  }
  return { type: "document", maxSize: UPLOAD.MAX_DOCUMENT_SIZE };
}

/**
 * Valide la taille d'un fichier reçu contre la limite de sa famille.
 * À appeler APRES `uploadSingle` (multer ne connaît qu'une limite globale).
 * Retourne la famille ; lève une erreur si le fichier dépasse la limite.
 */
export function assertTypeSize(file) {
  const meta = getUploadMeta(file.mimetype);
  if (file.size > meta.maxSize) {
    const err = new Error(
      `Fichier trop volumineux pour un ${meta.type} (maximum ${Math.round(
        meta.maxSize / 1024 / 1024,
      )} Mo).`,
    );
    err.code = "FILE_TOO_LARGE";
    throw err;
  }
  return meta.type;
}