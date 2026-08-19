import { validationResult } from "express-validator";
import ApiResponse from "../utils/api-response.js";

/**
 * Middleware de validation (PHASE 4).
 *
 * - Réponse HTTP 422 (Unprocessable Entity) pour des données invalides.
 * - Format d'erreur normalisé : `[{ field, message }]`, sans jamais
 *   renvoyer la valeur saisie au client.
 */
export default function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const detail = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return ApiResponse.error(res, "Erreur de validation.", 422, detail);
  }

  next();
}
