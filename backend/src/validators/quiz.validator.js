import { body } from "express-validator";

export const createQuizValidator = [
  body("id_lecon")
    .notEmpty()
    .withMessage("La leçon est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la leçon est invalide."),

  body("titre")
    .trim()
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères."),
];

export const updateQuizValidator = createQuizValidator;
