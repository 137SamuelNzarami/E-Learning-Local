import { body } from "express-validator";

export const createSubmissionValidator = [
  body("id_devoir")
    .notEmpty()
    .withMessage("Le devoir est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant du devoir est invalide."),

  body("id_utilisateur")
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'utilisateur est invalide."),

  body("fichier")
    .optional({ values: "falsy" })
    .isLength({ max: 255 })
    .withMessage("Le nom du fichier ne peut pas dépasser 255 caractères."),

  body("note")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("La note doit être comprise entre 0 et 100."),
];

export const updateSubmissionValidator = [
  body("id_devoir")
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'identifiant du devoir est invalide."),

  body("id_utilisateur")
    .optional()
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'utilisateur est invalide."),

  body("fichier")
    .optional({ values: "falsy" })
    .isLength({ max: 255 })
    .withMessage("Le nom du fichier ne peut pas dépasser 255 caractères."),

  body("note")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("La note doit être comprise entre 0 et 100."),
];
