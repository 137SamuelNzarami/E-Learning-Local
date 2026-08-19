import { body } from "express-validator";

export const createAttemptValidator = [
  body("id_utilisateur")
    .notEmpty()
    .withMessage("L'utilisateur est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'utilisateur est invalide."),

  body("id_quiz")
    .notEmpty()
    .withMessage("Le quiz est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant du quiz est invalide."),

  body("note")
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage("La note doit être comprise entre 0 et 100."),
];

export const updateAttemptValidator = createAttemptValidator;
