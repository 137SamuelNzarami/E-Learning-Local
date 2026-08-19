import bcrypt from "bcryptjs";

import UserRepository from "../repositories/user.repository.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/app-errors.js";
import { scopeToUser } from "../utils/ownership.js";

class UserService {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAllUsers() {
    return await UserRepository.findAll();
  }
  /**
   * Récupérer un utilisateur par son ID
   *
   * Un utilisateur non-admin ne peut consulter que son propre profil
   * (l'identité est imposée par le token) ; l'administrateur peut
   * consulter n'importe quel profil.
   */
  async getUserById(id, user) {
    const idCible = scopeToUser(user, id);

    const utilisateur = await UserRepository.findById(idCible);
    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }
    return utilisateur;
  }
  /**
   * Rechercher un utilisateur par email
   */
  async getUserByEmail(email) {
    const utilisateur = await UserRepository.findByEmail(email);
    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }
    return utilisateur;
  }
  /**
   * Ajouter un utilisateur
   */
  async createUser(data) {
    const existe = await UserRepository.findByEmail(data.email);

    if (existe) {
      throw new ConflictError("Cette adresse e-mail est déjà utilisée.");
    }

    const role = await UserRepository.findRoleById(data.id_role);

    if (!role) {
      throw new NotFoundError("Rôle introuvable.");
    }

    const motDePasseHash = await bcrypt.hash(data.mot_de_passe, 12);

    return await UserRepository.create({
      id_role: data.id_role,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      mot_de_passe: motDePasseHash,
    });
  }
  /**
   * Modifier un utilisateur
   */
  async updateUser(id, data) {
    // Vérifier si l'utilisateur existe
    const utilisateur = await UserRepository.findById(id);
    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    // Construire la liste des champs réellement modifiables.
    // Toute donnée envoyée par le client qui ne figure pas
    // dans cette liste (ex: `role`, `id_utilisateur`) est ignorée.
    const champs = {};

    if (data.nom !== undefined) {
      champs.nom = data.nom;
    }

    if (data.prenom !== undefined) {
      champs.prenom = data.prenom;
    }

    if (data.email !== undefined) {
      // Vérifier si l'e-mail est déjà utilisé par un autre utilisateur
      const utilisateurEmail = await UserRepository.findByEmail(data.email);
      if (utilisateurEmail && utilisateurEmail.id_utilisateur !== Number(id)) {
        throw new ConflictError("Cette adresse e-mail est déjà utilisée.");
      }
      champs.email = data.email;
    }

    if (data.id_role !== undefined) {
      // Le rôle est imposé via un identifiant existant,
      // jamais via un libellé arbitraire envoyé par le client.
      const role = await UserRepository.findRoleById(data.id_role);
      if (!role) {
        throw new NotFoundError("Rôle introuvable.");
      }
      champs.id_role = data.id_role;
    }

    if (data.mot_de_passe !== undefined) {
      // Hash systématique : le mot de passe n'est jamais stocké en clair.
      champs.mot_de_passe = await bcrypt.hash(data.mot_de_passe, 12);
    }

    if (Object.keys(champs).length === 0) {
      throw new ValidationError("Aucune donnée à modifier.");
    }

    await UserRepository.update(id, champs);

    return await UserRepository.findById(id);
  }
  /**
   * Supprimer un utilisateur
   */
  async deleteUser(id) {
    const utilisateur = await UserRepository.findById(id);
    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }
    try {
      return await UserRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer cet utilisateur car il est associé à une ou plusieurs formations.",
        );
      }
      handleDatabaseError(error);
    }
  }
}

export default new UserService();
