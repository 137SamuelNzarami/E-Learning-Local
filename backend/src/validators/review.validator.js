import { body } from "express-validator";

export const createReviewValidator = [

    body("id_utilisateur")
        .notEmpty()
        .withMessage("L'utilisateur est obligatoire.")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de l'utilisateur est invalide."),

    body("id_formation")
        .notEmpty()
        .withMessage("La formation est obligatoire.")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la formation est invalide."),

    body("note")
        .notEmpty()
        .withMessage("La note est obligatoire.")
        .isInt({ min: 1, max: 5 })
        .withMessage(
            "La note doit être un nombre entier compris entre 1 et 5."
        ),

    body("commentaire")
        .optional()
        .isString()
        .withMessage("Le commentaire doit être une chaîne de caractères.")
];

export const updateReviewValidator = createReviewValidator;