import { body } from "express-validator";

export const createConversationParticipantValidator = [
  body("id_conversation")
    .notEmpty()
    .withMessage("La conversation est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la conversation est invalide."),

  body("id_utilisateur")
    .notEmpty()
    .withMessage("L'utilisateur est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de l'utilisateur est invalide."),
];
