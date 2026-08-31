/**
 * CONSTANTES D'UPLOAD — source unique de vérité pour les fichiers médias.
 *
 * Alignées sur le pipeline réel : `config/upload.js` (middleware multer)
 * importe ces listes pour accepter exactement les mêmes types que ceux
 * annoncés ici. Aucune liste parallèle ne doit exister ailleurs.
 *
 * Scope produit (MISSION) :
 *  - IMAGE     : brouillons du formateur (JPG/JPEG/PNG/WEBP), ≤ 5 Mo.
 *  - VIDÉO     : contenu pédagogique (MP4/WebM/OGG/MOV/MKV/AVI), ≤ 500 Mo.
 *  - DOCUMENT  : supports de cours (PDF/DOCX/PPTX/XLSX/TXT...), ≤ 20 Mo.
 */
const UPLOAD = Object.freeze({
  /** Tailles maximales par type (octets). */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024,

  /** Limite globale multer : le maximum de tous les types. */
  MAX_FILE_SIZE: 500 * 1024 * 1024,

  IMAGE_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
  IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],

  VIDEO_MIME_TYPES: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ],
  VIDEO_EXTENSIONS: [".mp4", ".webm", ".ogg", ".mov", ".mkv", ".avi"],

  DOCUMENT_MIME_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/markdown",
  ],
  DOCUMENT_EXTENSIONS: [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".txt",
    ".md",
  ],
});

export default UPLOAD;