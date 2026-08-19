import { body } from "express-validator";

export const createModuleValidator = [
  body("id_formation")
    .notEmpty()
    .withMessage("La formation est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la formation est invalide."),

  body("titre")
    .trim()
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isLength({ min: 3, max: 150 })
    .withMessage("Le titre doit contenir entre 3 et 150 caractères."),

  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La description ne peut pas dépasser 2000 caractères."),
];

export const updateModuleValidator = createModuleValidator;