import { body } from "express-validator";

/**
 * Démarrage d'une tentative : aucun champ requis,
 * l'utilisateur et le quiz viennent des params / du token.
 */
export const startAttemptValidator = [];

/**
 * Soumission d'une tentative :
 * {
 *   reponses: [
 *     { id_question, id_reponses: [10, 11] }   // QCM uniquement
 *   ]
 * }
 */
export const submitAttemptValidator = [
  body("reponses")
    .exists({ checkFalsy: false })
    .withMessage("Le champ reponses est obligatoire.")
    .isArray()
    .withMessage("reponses doit être un tableau."),

  body("reponses.*.id_question")
    .notEmpty()
    .withMessage("Chaque réponse doit référencer une question.")
    .isInt({ min: 1 })
    .withMessage("id_question invalide."),

  body("reponses.*.id_reponses")
    .optional({ values: "null" })
    .isArray()
    .withMessage("id_reponses doit être un tableau d'identifiants."),

  body("reponses.*.id_reponses.*")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Chaque identifiant de réponse doit être un entier."),
];
