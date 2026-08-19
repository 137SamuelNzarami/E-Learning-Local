import { body } from "express-validator";

export const createConversationValidator = [
  body("sujet")
    .optional()
    .isString()
    .withMessage("Le sujet doit être une chaîne de caractères.")
    .isLength({ max: 200 })
    .withMessage("Le sujet ne peut pas dépasser 200 caractères."),

  body("participants")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Les participants doivent être une liste d'identifiants."),

  body("participants.*")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Un participant est invalide."),
];

export const updateConversationValidator = [
  body("sujet")
    .optional()
    .isString()
    .withMessage("Le sujet doit être une chaîne de caractères.")
    .isLength({ max: 200 })
    .withMessage("Le sujet ne peut pas dépasser 200 caractères."),
];