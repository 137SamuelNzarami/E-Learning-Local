import { body } from "express-validator";

export const createProgressionValidator = [
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

  body("pourcentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Le pourcentage doit être compris entre 0 et 100."),
];

export const updateProgressionValidator = [
  body("id_utilisateur")
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'utilisateur est invalide."),

  body("id_formation")
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la formation est invalide."),

  body("pourcentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Le pourcentage doit être compris entre 0 et 100."),
];