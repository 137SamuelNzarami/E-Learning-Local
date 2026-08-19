import { body } from "express-validator";

export const createLessonValidator = [
  body("id_chapitre")
    .notEmpty()
    .withMessage("Le chapitre est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("Le chapitre est invalide."),

  body("titre")
    .trim()
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

  body("contenu").trim().notEmpty().withMessage("Le contenu est obligatoire."),

  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La description ne peut pas dépasser 2000 caractères."),
];

export const updateLessonValidator = createLessonValidator;
