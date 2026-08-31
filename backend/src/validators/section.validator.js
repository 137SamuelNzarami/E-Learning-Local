import { body } from "express-validator";

export const createSectionValidator = [
  body("id_chapitre")
    .notEmpty().withMessage("Le chapitre est obligatoire.")
    .isInt({ min: 1 }).withMessage("Le chapitre doit être un identifiant valide."),
  body("titre")
    .optional({ values: "falsy" })
    .isString().withMessage("Le titre doit être une chaîne de caractères.")
    .isLength({ max: 200 }).withMessage("Le titre ne peut pas dépasser 200 caractères."),
  body("description")
    .optional({ values: "falsy" })
    .isString().withMessage("La description doit être une chaîne de caractères.")
    .isLength({ max: 2000 }).withMessage("La description ne peut pas dépasser 2000 caractères."),
  body("contenu")
    .optional({ values: "falsy" })
    .isString().withMessage("Le contenu de section doit être une chaîne de caractères.")
    .isLength({ max: 2000000 }).withMessage("Le contenu de section ne peut pas dépasser 2 000 000 caractères."),
  body("ordre")
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif."),
];

export const updateSectionValidator = [
  body("titre")
    .optional()
    .isString().withMessage("Le titre doit être une chaîne de caractères.")
    .isLength({ max: 200 }).withMessage("Le titre ne peut pas dépasser 200 caractères."),
  body("description")
    .optional({ values: "falsy" })
    .isString().withMessage("La description doit être une chaîne de caractères.")
    .isLength({ max: 2000 }).withMessage("La description ne peut pas dépasser 2000 caractères."),
  body("contenu")
    .optional({ values: "falsy" })
    .isString().withMessage("Le contenu de section doit être une chaîne de caractères.")
    .isLength({ max: 2000000 }).withMessage("Le contenu de section ne peut pas dépasser 2 000 000 caractères."),
  body("ordre")
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif."),
];
