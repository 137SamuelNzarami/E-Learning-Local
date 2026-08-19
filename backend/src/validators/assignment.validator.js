import { body } from "express-validator";

export const createAssignmentValidator = [
  body("id_lecon")
    .notEmpty()
    .withMessage("La leçon est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la leçon est invalide."),

  body("titre")
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

  body("instructions")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Les instructions ne peuvent pas dépasser 5000 caractères."),
];

export const updateAssignmentValidator = createAssignmentValidator;