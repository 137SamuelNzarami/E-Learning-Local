import EnrollmentRepository from "../repositories/enrollment.repository.js";

import UserRepository from "../repositories/user.repository.js";

import FormationRepository from "../repositories/formation.repository.js";

import ConversationRepository from "../repositories/conversation.repository.js";

import ConversationParticipantRepository from "../repositories/conversation-participant.repository.js";

import ProgressionRepository from "../repositories/progression.repository.js";

import NotificationRepository from "../repositories/notification.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertPersonalAccess,
  canAccessFormation,
  imposeOwnership,
  isAdmin,
  scopePersonalRowsByFormation,
  scopeToUser,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
} from "../utils/app-errors.js";

class EnrollmentService {
  /**
   * Récupérer toutes les inscriptions
   */
  async getAllEnrollments() {
    return await EnrollmentRepository.findAll();
  }
  /**
   * Récupérer une inscription par son ID
   *
   * - Propriétaire de l'inscription : oui.
   * - Formateur propriétaire de la formation : oui (vue pédagogique).
   * - Administrateur : oui.
   */
  async getEnrollmentById(id, user) {
    const enrollment = await EnrollmentRepository.findById(id);

    if (!enrollment) {
      throw new NotFoundError("Inscription introuvable.");
    }

    if (!isAdmin(user)) {
      const estProprietaire =
        Number(enrollment.id_utilisateur) === Number(user.id);

      const formation = await FormationRepository.findById(
        enrollment.id_formation,
      );

      const estFormateurProprietaire = canAccessFormation(formation, user);

      if (!estProprietaire && !estFormateurProprietaire) {
        throw new AccessDeniedError(
          "Accès interdit. Cette ressource ne vous appartient pas.",
        );
      }
    }

    return enrollment;
  }
  /**
   * Récupérer les inscriptions d'un utilisateur
   */
  async getEnrollmentsByUser(id_utilisateur, user) {
    // L'identité est imposée par le token, sauf pour l'administrateur
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await EnrollmentRepository.findByUserId(idCible);
  }
  /**
   * Récupérer les étudiants inscrits à une formation
   */
  async getEnrollmentsByFormation(id_formation, user) {
    const formation = await FormationRepository.findById(id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    const rows = await EnrollmentRepository.findByFormationId(id_formation);

    // Un étudiant ne voit que sa propre inscription ; un formateur qui
    // possède la formation voit la liste complète de ses étudiants.
    return scopePersonalRowsByFormation(rows, user, formation);
  }
  /**
   * Créer une inscription
   */
  async createEnrollment(data, user) {
    // Pour un non-admin, le propriétaire est imposé par le token
    imposeOwnership(data, user);

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const formation = await FormationRepository.findById(data.id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    const existingEnrollment =
      await EnrollmentRepository.findByUserAndFormation(
        data.id_utilisateur,
        data.id_formation,
      );

    if (existingEnrollment) {
      throw new ConflictError(
        "Cet utilisateur est déjà inscrit à cette formation.",
      );
    }

    let id;

    try {
      id = await EnrollmentRepository.create(data);
    } catch (error) {
      handleDatabaseError(error);
    }

    await this._createFormateurConversation(formation, utilisateur);
    await this._ensureInitialProgression(utilisateur, formation);
    await this._notifyFormateurNewEnrollment(formation, utilisateur);

    return id;
  }

  async _notifyFormateurNewEnrollment(formation, etudiant) {
    try {
      const idFormateur = Number(formation.id_formateur);
      if (!idFormateur || idFormateur === Number(etudiant.id_utilisateur)) return;

      await NotificationRepository.create({
        id_utilisateur: idFormateur,
        titre: "Nouvel étudiant inscrit",
        contenu: `${etudiant.prenom ?? ""} ${etudiant.nom ?? ""} s'est inscrit(e) à votre formation « ${formation.titre} ».`,
      });
    } catch (_) {}
  }

  /**
   * Créer une progression initiale à 0 % lors de l'inscription.
   *
   * - Dédoublonnée : si une progression existe déjà, rien n'est modifié.
   * - Une erreur ici ne bloque jamais l'inscription (elle est journalisée).
   */
  async _ensureInitialProgression(etudiant, formation) {
    try {
      const existing = await ProgressionRepository.findByUserAndFormation(
        etudiant.id_utilisateur,
        formation.id_formation,
      );

      if (existing) {
        return;
      }

      await ProgressionRepository.create({
        id_utilisateur: etudiant.id_utilisateur,
        id_formation: formation.id_formation,
        pourcentage: 0,
      });
    } catch (error) {
      console.warn(
        `[enrollment] Progression initiale impossible (etudiant ${etudiant.id_utilisateur}, formation ${formation.id_formation}) :`,
        error.message,
      );
    }
  }

  /**
   * Créer automatiquement une conversation entre l'étudiant et le
   * formateur de la formation lors de l'inscription.
   *
   * - Dédoublonnée : si une conversation formateur/étudiant existe
   *   déjà, aucune nouvelle conversation n'est créée.
   * - Une erreur ici ne bloque jamais l'inscription (elle est journalisée).
   */
  async _createFormateurConversation(formation, etudiant) {
    const idFormateur = Number(formation.id_formateur);
    const idEtudiant = Number(etudiant.id_utilisateur);

    if (!idFormateur || idFormateur === idEtudiant) {
      return;
    }

    try {
      const prefix = `Formation : ${ConversationParticipantRepository.escapeLike(formation.titre)}`;

      const existing = await ConversationParticipantRepository.findSharedByUsersAndSubjectPrefix(
        idEtudiant,
        idFormateur,
        prefix,
      );

      if (existing) {
        return;
      }

      const sujet = `Formation : ${formation.titre}`;

      await ConversationRepository.createWithParticipants(sujet, [
        idEtudiant,
        idFormateur,
      ]);
    } catch (error) {
      console.warn(
        `[enrollment] Conversation automatique impossible (etudiant ${idEtudiant}, formation ${formation.id_formation}) :`,
        error.message,
      );
    }
  }
  /**
   * Supprimer une inscription
   */
  async deleteEnrollment(id, user) {
    const enrollment = await EnrollmentRepository.findById(id);

    if (!enrollment) {
      throw new NotFoundError("Inscription introuvable.");
    }

    // IDOR : un non-admin ne peut supprimer que ses propres inscriptions
    assertPersonalAccess(user, enrollment.id_utilisateur);

    try {
      return await EnrollmentRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new EnrollmentService();
