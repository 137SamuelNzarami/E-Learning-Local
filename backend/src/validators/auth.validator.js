import { body } from "express-validator";

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'adresse e-mail est obligatoire.")
    .isEmail()
    .withMessage("Adresse e-mail invalide.")
    .normalizeEmail(),

  body("mot_de_passe")
    .notEmpty()
    .withMessage("Le mot de passe est obligatoire.")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères."),
];

export const registerValidator = [
  body("nom")
    .trim()
    .notEmpty()
    .withMessage("Le nom est obligatoire.")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Le nom doit contenir entre 2 et 100 caractères."),

  body("prenom")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est obligatoire.")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Le prénom doit contenir entre 2 et 100 caractères."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'adresse e-mail est obligatoire.")
    .isEmail()
    .withMessage("Adresse e-mail invalide.")
    .normalizeEmail(),

  body("mot_de_passe")
    .notEmpty()
    .withMessage("Le mot de passe est obligatoire.")
    .isLength({
      min: 8,
    })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères."),
];

export const changePasswordValidator = [
  body("mot_de_passe_actuel")
    .notEmpty()
    .withMessage("Le mot de passe actuel est obligatoire."),

  body("mot_de_passe")
    .notEmpty()
    .withMessage("Le nouveau mot de passe est obligatoire.")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères."),
];
