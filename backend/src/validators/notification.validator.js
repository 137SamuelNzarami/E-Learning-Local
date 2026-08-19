import { body } from "express-validator";

export const createNotificationValidator = [
  body("id_utilisateur")
    .notEmpty()
    .withMessage("L'utilisateur est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'utilisateur est invalide."),

  body("titre")
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isString()
    .withMessage("Le titre doit être une chaîne de caractères.")
    .trim()
    .notEmpty()
    .withMessage("Le titre ne peut pas être vide.")
    .isLength({ max: 150 })
    .withMessage("Le titre ne peut pas dépasser 150 caractères."),

  body("contenu")
    .notEmpty()
    .withMessage("Le contenu est obligatoire.")
    .isString()
    .withMessage("Le contenu doit être une chaîne de caractères.")
    .trim()
    .notEmpty()
    .withMessage("Le contenu ne peut pas être vide."),
];

export const updateNotificationValidator = [
  body("titre")
    .notEmpty()
    .withMessage("Le titre est obligatoire.")
    .isString()
    .withMessage("Le titre doit être une chaîne de caractères.")
    .trim()
    .notEmpty()
    .withMessage("Le titre ne peut pas être vide.")
    .isLength({ max: 150 })
    .withMessage("Le titre ne peut pas dépasser 150 caractères."),

  body("contenu")
    .notEmpty()
    .withMessage("Le contenu est obligatoire.")
    .isString()
    .withMessage("Le contenu doit être une chaîne de caractères.")
    .trim()
    .notEmpty()
    .withMessage("Le contenu ne peut pas être vide."),
];