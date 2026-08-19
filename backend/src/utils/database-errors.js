import {
  ConflictError,
  NotFoundError,
} from "./app-errors.js";

/**
 * Traduction des erreurs SQL usuelles en erreurs applicatives typées
 * (PHASE 4) afin d'exposer un code HTTP cohérent.
 */
export function handleDatabaseError(error) {

    if (error.code === "ER_DUP_ENTRY") {
        throw new ConflictError("Cette information existe déjà.");
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
        throw new NotFoundError("La référence demandée est introuvable.");
    }

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
            "Impossible de supprimer cet enregistrement car il est utilisé par d'autres données."
        );
    }

    throw error;

}
