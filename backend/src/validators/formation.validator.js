import { body } from "express-validator";
/**
 * Validation de la création d'une formation
 */
export const createFormationValidator = [

    body("id_categorie")
        .notEmpty()
        .withMessage("La catégorie est obligatoire.")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la catégorie est invalide."),

    body("id_formateur")
        .optional()
        .isInt({ min: 1 })
        .withMessage("L'identifiant du formateur est invalide."),

    body("titre")
        .trim()
        .notEmpty()
        .withMessage("Le titre est obligatoire.")
        .isLength({ min: 3, max: 200 })
        .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage("La description est trop longue.")

];
/**
 * Validation de la mise à jour d'une formation
 */
export const updateFormationValidator = [

    body("id_categorie")
        .notEmpty()
        .withMessage("La catégorie est obligatoire.")
        .isInt({ min: 1 })
        .withMessage("L'identifiant de la catégorie est invalide."),

    body("id_formateur")
        .optional()
        .isInt({ min: 1 })
        .withMessage("L'identifiant du formateur est invalide."),

    body("titre")
        .trim()
        .notEmpty()
        .withMessage("Le titre est obligatoire.")
        .isLength({ min: 3, max: 200 })
        .withMessage("Le titre doit contenir entre 3 et 200 caractères."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage("La description est trop longue.")
];