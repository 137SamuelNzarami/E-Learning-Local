import { body } from "express-validator";

export const createAnswerValidator = [
  body("id_question")
    .notEmpty()
    .withMessage("La question est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la question est invalide."),

  body("contenu")
    .trim()
    .notEmpty()
    .withMessage("Le contenu de la réponse est obligatoire.")
    .isLength({ min: 1 })
    .withMessage("Le contenu de la réponse ne peut pas être vide."),

  body("est_correcte")
    .optional()
    .isBoolean()
    .withMessage("Le champ est_correcte doit être un booléen."),
];

export const updateAnswerValidator = createAnswerValidator;