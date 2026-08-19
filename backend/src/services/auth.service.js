import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import AuthRepository from "../repositories/auth.repository.js";
import ROLES from "../constants/role.js";
import { jwtConfig } from "../config/jwt.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/app-errors.js";

class AuthService {

    /**
     * Inscription publique d'un étudiant
     */
    async register(data) {

        const {
            nom,
            prenom,
            email,
            mot_de_passe
        } = data;

        /**
         * Vérifier si l'adresse existe déjà
         */
        const emailExiste =
            await AuthRepository.emailExists(email);

        if (emailExiste) {
            throw new ConflictError(
                "Cette adresse e-mail est déjà utilisée."
            );
        }

        /**
         * Le rôle est imposé par le serveur.
         *
         * Un utilisateur qui s'inscrit publiquement
         * devient automatiquement Etudiant.
         */
        const idRole =
            await AuthRepository.findRoleIdByLabel(
                ROLES.ETUDIANT
            );

        if (!idRole) {
            throw new NotFoundError(
                "Le rôle Etudiant est introuvable dans la base de données."
            );
        }

        /**
         * Hash sécurisé du mot de passe
         */
        const motDePasseHash =
            await bcrypt.hash(mot_de_passe, 12);

        /**
         * Création du compte
         */
        const idUtilisateur =
            await AuthRepository.create({
                id_role: idRole,
                nom,
                prenom,
                email,
                mot_de_passe: motDePasseHash
            });

        /**
         * Ne jamais retourner le mot de passe
         */
        return {
            id: idUtilisateur,
            nom,
            prenom,
            email,
            role: ROLES.ETUDIANT
        };
    }

    /**
     * Connexion
     */
    async login(email, mot_de_passe) {

        const user =
            await AuthRepository.findByEmail(email);

        if (!user) {
            throw new UnauthorizedError(
                "Adresse e-mail ou mot de passe incorrect."
            );
        }

        const passwordValid =
            await bcrypt.compare(
                mot_de_passe,
                user.mot_de_passe
            );

        if (!passwordValid) {
            throw new UnauthorizedError(
                "Adresse e-mail ou mot de passe incorrect."
            );
        }

        const token = jwt.sign(
            {
                id: user.id_utilisateur,
                role: user.role,
                email: user.email
            },
            jwtConfig.secret,
            {
                expiresIn: jwtConfig.expiresIn
            }
        );

        return {
            token,

            utilisateur: {
                id: user.id_utilisateur,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role
            }
        };
    }

    /**
     * Profil de l'utilisateur connecté.
     *
     * L'identité provient exclusivement du token (req.user.id),
     * jamais de données envoyées par le client.
     */
    async getCurrentUser(id) {
        const utilisateur =
            await AuthRepository.findById(id);

        if (!utilisateur) {
            throw new NotFoundError("Utilisateur introuvable.");
        }

        return {
            id: utilisateur.id_utilisateur,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            role: utilisateur.role
        };
    }

    /**
     * Changement du mot de passe par l'utilisateur connecté.
     *
     * Le mot de passe actuel doit être vérifié avant toute
     * modification. Le nouveau mot de passe est toujours hashé.
     */
    async changePassword(id, mot_de_passe_actuel, mot_de_passe) {
        const utilisateur = await AuthRepository.findByIdWithPassword(id);

        if (!utilisateur) {
            throw new NotFoundError("Utilisateur introuvable.");
        }

        const passwordValide = await bcrypt.compare(
            mot_de_passe_actuel,
            utilisateur.mot_de_passe
        );

        if (!passwordValide) {
            throw new ValidationError(
                "Le mot de passe actuel est incorrect.",
                [{ field: "mot_de_passe_actuel", message: "Le mot de passe actuel est incorrect." }]
            );
        }

        if (mot_de_passe === mot_de_passe_actuel) {
            throw new ValidationError(
                "Le nouveau mot de passe doit être différent de l'actuel.",
                [{ field: "mot_de_passe", message: "Le nouveau mot de passe doit être différent de l'actuel." }]
            );
        }

        const motDePasseHash = await bcrypt.hash(mot_de_passe, 12);

        await AuthRepository.updatePassword(id, motDePasseHash);

        return { id };
    }
}

export default new AuthService();