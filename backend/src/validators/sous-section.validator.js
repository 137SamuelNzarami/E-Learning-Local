import { body } from "express-validator";

/**
 * Sous-section = unité de contenu pédagogique (RICH TEXT).
 *
 * `contenu` accepte le HTML produit par le Rich Text Editor du frontend
 * (titres, paragraphes, listes, citations, tableaux, images intégrées...).
 * Il est stocké en LONGTEXT et restitué tel quel au frontend autorisé.
 */
export const createSousSectionValidator = [
  body("id_section")
    .notEmpty().withMessage("La section est obligatoire.")
    .isInt({ min: 1 }).withMessage("La section doit être un identifiant valide."),
  body("titre")
    .optional({ values: "falsy" })
    .isString().withMessage("Le titre doit être une chaîne de caractères.")
    .isLength({ max: 200 }).withMessage("Le titre ne peut pas dépasser 200 caractères."),
  body("contenu")
    .optional({ values: "null" })
    .isString().withMessage("Le contenu doit être une chaîne de caractères (HTML rich text).")
    .isLength({ max: 2_000_000 }).withMessage("Le contenu est trop long (2 Mo maximum)."),
  body("ordre")
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif."),
];

export const updateSousSectionValidator = [
  body("titre")
    .optional()
    .isString().withMessage("Le titre doit être une chaîne de caractères.")
    .isLength({ max: 200 }).withMessage("Le titre ne peut pas dépasser 200 caractères."),
  body("contenu")
    .optional({ values: "null" })
    .isString().withMessage("Le contenu doit être une chaîne de caractères (HTML rich text).")
    .isLength({ max: 2_000_000 }).withMessage("Le contenu est trop long (2 Mo maximum)."),
  body("ordre")
    .optional()
    .isInt({ min: 0 }).withMessage("L'ordre doit être un entier positif."),
];
