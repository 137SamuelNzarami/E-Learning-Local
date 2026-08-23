import { body } from "express-validator";

export const createQuizValidator = [
  body("id_chapitre")
    .notEmpty()
    .withMessage("Le chapitre est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant du chapitre est invalide."),

  body("titre")
    .trim()
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

  body("score_reussite")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Le score de réussite doit être compris entre 0 et 100."),
];

export const updateQuizValidator = [
  body("titre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

  body("score_reussite")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Le score de réussite doit être compris entre 0 et 100."),
];
