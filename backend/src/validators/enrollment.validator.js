import { body } from "express-validator";

export const createEnrollmentValidator = [
  body("id_utilisateur")
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'utilisateur est invalide."),

  body("id_formation")
    .notEmpty()
    .withMessage("La formation est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la formation est invalide."),
];