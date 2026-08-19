import { body } from "express-validator";

const categoryValidator = [
  body("nom_categorie")
    .trim()
    .notEmpty()
    .withMessage("Le nom de la catégorie est obligatoire.")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Le nom de la catégorie doit contenir entre 2 et 100 caractères.",
    ),
];

export default categoryValidator;
