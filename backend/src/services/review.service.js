import ReviewRepository from "../repositories/review.repository.js";
import UserRepository from "../repositories/user.repository.js";
import FormationRepository from "../repositories/formation.repository.js";
import EnrollmentRepository from "../repositories/enrollment.repository.js";
import NotificationRepository from "../repositories/notification.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertPersonalAccess,
  imposeOwnership,
  scopeToUser,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
} from "../utils/app-errors.js";

class ReviewService {
  /**
   * Récupérer tous les avis
   */
  async getAllReviews() {
    return await ReviewRepository.findAll();
  }
  /**
   * Récupérer un avis par son ID
   */
  async getReviewById(id, user) {
    const review = await ReviewRepository.findById(id);

    if (!review) {
      throw new NotFoundError("Avis introuvable.");
    }

    // IDOR : un non-admin ne peut lire que ses propres avis
    assertPersonalAccess(user, review.id_utilisateur);

    return review;
  }

  /**
   * Récupérer les avis d'une formation
   */
  async getReviewsByFormation(id_formation) {
    const formation = await FormationRepository.findById(id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    return await ReviewRepository.findByFormationId(id_formation);
  }

  /**
   * Récupérer les avis d'un utilisateur
   */
  async getReviewsByUser(id_utilisateur, user) {
    // L'identité est imposée par le token, sauf pour l'administrateur
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await ReviewRepository.findByUserId(idCible);
  }

  /**
   * Vérifier que l'utilisateur est inscrit à la formation
   * avant de pouvoir y laisser un avis.
   */
  async assertEnrolled(id_utilisateur, id_formation) {
    const enrollment = await EnrollmentRepository.findByUserAndFormation(
      id_utilisateur,
      id_formation,
    );

    if (!enrollment) {
      throw new AccessDeniedError(
        "Vous devez être inscrit à cette formation pour laisser un avis.",
      );
    }
  }

  /**
   * Créer un avis
   */
  async createReview(data, user) {
    // L'auteur de l'avis est imposé par le token
    imposeOwnership(data, user);

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const formation = await FormationRepository.findById(data.id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    // Seuls les utilisateurs inscrits peuvent donner un avis
    await this.assertEnrolled(data.id_utilisateur, data.id_formation);

    const existing = await ReviewRepository.findByUserAndFormation(
      data.id_utilisateur,
      data.id_formation,
    );

    if (existing) {
      throw new ConflictError(
        "Cet utilisateur a déjà donné un avis pour cette formation.",
      );
    }

    try {
      const id = await ReviewRepository.create(data);

      this._notifyFormateurNewReview(formation, utilisateur).catch(() => {});

      return id;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async _notifyFormateurNewReview(formation, auteur) {
    try {
      const idFormateur = Number(formation.id_formateur);
      if (!idFormateur) return;

      await NotificationRepository.create({
        id_utilisateur: idFormateur,
        titre: "Nouvel avis",
        contenu: `${auteur.prenom ?? ""} ${auteur.nom ?? ""} a laissé un avis sur votre formation « ${formation.titre} ».`,
      });
    } catch (_) {}
  }

  /**
   * Modifier un avis
   */
  async updateReview(id, data, user) {
    const review = await ReviewRepository.findById(id);

    if (!review) {
      throw new NotFoundError("Avis introuvable.");
    }

    // IDOR : un non-admin ne peut modifier que ses propres avis
    assertPersonalAccess(user, review.id_utilisateur);

    imposeOwnership(data, user);

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const formation = await FormationRepository.findById(data.id_formation);

    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    // Si l'avis est déplacé vers une autre formation, le nouvel
    // auteur (imposé) doit y être inscrit.
    await this.assertEnrolled(data.id_utilisateur, data.id_formation);

    const existing = await ReviewRepository.findByUserAndFormation(
      data.id_utilisateur,
      data.id_formation,
    );

    if (existing && existing.id_avis !== Number(id)) {
      throw new ConflictError(
        "Cet utilisateur a déjà donné un avis pour cette formation.",
      );
    }

    try {
      await ReviewRepository.update(id, data);

      return await ReviewRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Supprimer un avis
   */
  async deleteReview(id, user) {
    const review = await ReviewRepository.findById(id);

    if (!review) {
      throw new NotFoundError("Avis introuvable.");
    }

    // IDOR : un non-admin ne peut supprimer que ses propres avis
    assertPersonalAccess(user, review.id_utilisateur);

    try {
      return await ReviewRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new ReviewService();
