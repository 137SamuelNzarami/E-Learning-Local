import { body } from "express-validator";

export const createStudentAnswerValidator = [
  body("id_tentative")
    .notEmpty()
    .withMessage("La tentative est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la tentative est invalide."),

  body("id_question")
    .notEmpty()
    .withMessage("La question est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la question est invalide."),

  body("id_reponse")
    .notEmpty()
    .withMessage("La réponse est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la réponse est invalide."),
];

export const updateStudentAnswerValidator = [
  body("id_tentative")
    .notEmpty()
    .withMessage("La tentative est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la tentative est invalide."),

  body("id_question")
    .notEmpty()
    .withMessage("La question est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la question est invalide."),

  body("id_reponse")
    .notEmpty()
    .withMessage("La réponse est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant de la réponse est invalide."),
];
