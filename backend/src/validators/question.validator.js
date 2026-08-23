import { body } from "express-validator";

export const createQuestionValidator = [
  body("id_quiz")
    .notEmpty()
    .withMessage("Le quiz est obligatoire.")
    .isInt({ min: 1 })
    .withMessage("L'identifiant du quiz est invalide."),

  body("enonce")
    .trim()
    .notEmpty()
    .withMessage("L'énoncé de la question est obligatoire.")
    .isLength({ min: 3 })
    .withMessage("L'énoncé doit contenir au moins 3 caractères."),

  body("type")
    .optional()
    .isIn(["QCM", "LIBRE"])
    .withMessage("Le type doit être QCM ou LIBRE."),

  body("points")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Les points doivent être un entier >= 1."),
];

export const updateQuestionValidator = [
  body("enonce")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("L'énoncé de la question est obligatoire.")
    .isLength({ min: 3 })
    .withMessage("L'énoncé doit contenir au moins 3 caractères."),

  body("type")
    .optional()
    .custom(() => {
      // le type ne change jamais : règle appliquée aussi dans le service
      throw new Error("Le type d'une question ne peut pas être modifié.");
    }),

  body("points")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Les points doivent être un entier >= 1."),
];
