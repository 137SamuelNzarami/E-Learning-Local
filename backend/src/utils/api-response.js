import AppError from "./app-errors.js";
import MESSAGES from "../constants/messages.js";

class ApiResponse {
    /**
     * Réponse de succès
     * @param {Response} res
     * @param {String} message
     * @param {Object|Array|null} data
     * @param {Number} statusCode
     * @param {Object|null} pagination - métadonnées de pagination (optionnel)
     */
    static success(
        res,
        message = "Succès",
        data = null,
        statusCode = 200,
        pagination = null
    ) {
        const body = {
            success: true,
            message,
            data
        };

        if (pagination) {
            body.pagination = pagination;
        }

        return res.status(statusCode).json(body);

    }
    /**
     * Réponse d'erreur
     * @param {Response} res
     * @param {String} message
     * @param {Number} statusCode
     * @param {Object|Array|null} errors
     */
    static error(
        res,
        message = "Une erreur est survenue.",
        statusCode = 500,
        errors = null
    ) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    }
    /**
     * Réponse d'erreur à partir d'une exception.
     *
     * - Les erreurs applicatives typées (AppError) conservent leur
     *   code HTTP et leur message métier.
     * - Toute autre erreur (technique) renvoie un 500 générique afin de
     *   ne jamais exposer les détails internes (SQL, stack, ...).
     *
     * @param {Response} res
     * @param {Error} error
     */
    static fromError(res, error) {
        if (error instanceof AppError) {
            return ApiResponse.error(res, error.message, error.statusCode, error.errors);
        }

        console.error(error);

        return ApiResponse.error(res, MESSAGES.SERVER_ERROR, 500);
    }
}

export default ApiResponse;