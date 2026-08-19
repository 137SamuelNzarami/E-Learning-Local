import { body } from "express-validator";

export const createMessageValidator = [
  body("id_conversation")
    .notEmpty()
    .withMessage("La conversation est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la conversation est invalide."),

  body("id_expediteur")
    .notEmpty()
    .withMessage("L'expéditeur est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'expéditeur est invalide."),

  body("contenu")
    .notEmpty()
    .withMessage("Le contenu du message est obligatoire.")
    .isString()
    .withMessage("Le contenu du message doit être une chaîne de caractères.")
    .trim()
    .notEmpty()
    .withMessage("Le contenu du message ne peut pas être vide."),
];

export const updateMessageValidator = [
  body("contenu")
    .notEmpty()
    .withMessage("Le contenu du message est obligatoire.")
    .isString()
    .withMessage("Le contenu du message doit être une chaîne de caractères.")
    .trim()
    .notEmpty()
    .withMessage("Le contenu du message ne peut pas être vide."),
];
