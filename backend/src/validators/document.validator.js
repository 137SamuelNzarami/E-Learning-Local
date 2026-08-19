import { body } from "express-validator";

export const createDocumentValidator = [
  body("id_lecon")
    .notEmpty()
    .withMessage("La leçon est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("La leçon est invalide."),

  body("titre")
    .trim()
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

  // Le chemin provient du fichier uploadé (req.file) ;
  // il peut néanmoins être fourni explicitement.
  body("chemin_document")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Le chemin est trop long."),
];

export const updateDocumentValidator = [
  body("id_lecon")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La leçon est invalide."),

  body("titre")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

  body("chemin_document")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Le chemin est trop long."),
];
