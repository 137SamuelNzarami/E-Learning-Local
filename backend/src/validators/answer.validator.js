import { body } from "express-validator";

/**
 * Une réponse appartient toujours à une question QCM.
 * `est_correcte` : une seule par question (garanti côté service).
 */
export const createAnswerValidator = [
  body("id_question")
    .notEmpty()
    .withMessage("La question est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la question est invalide."),

  body("texte")
    .trim()
    .notEmpty()
    .withMessage("Le texte de la réponse est obligatoire.")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Le texte de la réponse ne peut pas dépasser 1000 caractères."),

  body("est_correcte")
    .optional()
    .isBoolean()
    .withMessage("est_correcte doit être un booléen."),
];

export const updateAnswerValidator = [
  body("texte")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Le texte de la réponse est obligatoire.")
    .isLength({ max: 1000 })
    .withMessage("Le texte de la réponse ne peut pas dépasser 1000 caractères."),

  body("est_correcte")
    .optional()
    .isBoolean()
    .withMessage("est_correcte doit être un booléen."),
];
