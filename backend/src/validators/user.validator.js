import { body } from "express-validator";

export const createUserValidator = [
    body("id_role")
        .notEmpty()
        .withMessage("Le rôle est obligatoire.")
        .isInt({ min: 1 })
        .withMessage("Le rôle est invalide."),
    body("nom")
        .trim()
        .notEmpty()
        .withMessage("Le nom est obligatoire.")
        .isLength({ min: 2, max: 100 })
        .withMessage("Le nom doit contenir entre 2 et 100 caractères."),
    body("prenom")
        .trim()
        .notEmpty()
        .withMessage("Le prénom est obligatoire.")
        .isLength({ min: 2, max: 100 })
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
        .isLength({ min: 8 })
        .withMessage("Le mot de passe doit contenir au moins 8 caractères.")

];

export const updateUserValidator = [
    body("id_role")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Le rôle est invalide."),
    body("nom")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Le nom est invalide."),
    body("prenom")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Le prénom est invalide."),
    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Adresse e-mail invalide.")
        .normalizeEmail()
];