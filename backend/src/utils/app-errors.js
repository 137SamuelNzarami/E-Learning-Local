import HTTP_STATUS from "../constants/httpStatus.js";

/**
 * Erreur applicative typée (PHASE 4).
 *
 * Chaque sous-classe porte un code HTTP explicite afin que les
 * contrôleurs et le middleware d'erreurs renvoient un contrat HTTP
 * cohérent (404, 403, 409, ...) au lieu d'un 500 systématique.
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** Ressource inexistante -> 404 */
export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

/** Droit insuffisant sur une ressource -> 403 */
export class AccessDeniedError extends AppError {
  constructor(message = "Accès interdit.") {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

/** Authentification manquante/invalide -> 401 */
export class UnauthorizedError extends AppError {
  constructor(message = "Non authentifié.") {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

/** Conflit avec une ressource existante -> 409 */
export class ConflictError extends AppError {
  constructor(message = "Conflit avec une ressource existante.") {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

/** Données invalides -> 422 */
export class ValidationError extends AppError {
  constructor(message = "Erreur de validation.", errors = null) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }
}

export default AppError;
