import multer from "multer";
import ApiResponse from "../utils/api-response.js";

const FILE_FILTER_ERROR = "Type de fichier non autorisé";

/**
 * Middleware d'erreurs global (PHASE 4).
 *
 * - Les erreurs applicatives typées (AppError) produisent une réponse
 *   uniforme avec leur code HTTP.
 * - Les erreurs d'upload Multer (fichier trop volumineux, type de fichier
 *   refusé) produisent un 400 avec un message clair.
 * - Les erreurs techniques produisent un 500 générique sans fuite de
 *   détails internes (les détails sont journalisés côté serveur).
 */
const errorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Fichier trop volumineux. Taille maximale : 100 Mo."
        : `Erreur lors de l'upload du fichier.`;
    return ApiResponse.error(res, message, 400, [
      { field: "fichier", message },
    ]);
  }

  if (error && error.message && error.message.includes(FILE_FILTER_ERROR)) {
    return ApiResponse.error(res, error.message, 400, [
      { field: "fichier", message: error.message },
    ]);
  }

  return ApiResponse.fromError(res, error);
};

export default errorHandler;
