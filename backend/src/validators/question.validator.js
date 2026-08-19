import { body } from "express-validator";

export const createQuestionValidator = [
  body("id_quiz")
    .notEmpty()
    .withMessage("Le quiz est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant du quiz est invalide."),

  body("enonce")
    .trim()
    .notEmpty()
    .withMessage("L'énoncé de la question est obligatoire.")
    .isLength({ min: 3 })
    .withMessage("L'énoncé doit contenir au moins 3 caractères."),
];

export const updateQuestionValidator = createQuestionValidator;