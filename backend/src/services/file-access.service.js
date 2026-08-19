import path from "node:path";

import ROLES from "../constants/role.js";
import VideoRepository from "../repositories/video.repository.js";
import DocumentRepository from "../repositories/document.repository.js";
import SubmissionRepository from "../repositories/submission.repository.js";
import AssignmentRepository from "../repositories/assignment.repository.js";
import EnrollmentRepository from "../repositories/enrollment.repository.js";
import { canAccessFormation, isAdmin } from "../utils/ownership.js";
import { uploadDir } from "../config/upload.js";

/**
 * Contrôle d'accès aux fichiers uploadés (vidéos, documents,
 * soumissions, consignes de devoir).
 *
 * Les fichiers ne sont plus servis publiquement : le serveur les résout
 * via la base de données (chemin `/uploads/<nom>`) puis vérifie que
 * l'utilisateur a le droit d'y accéder.
 *
 * Règles :
 *  - Administrateur : accès global.
 *  - Vidéo / Document / Consignes : formateur propriétaire de la
 *    formation, ou étudiant inscrit à la formation.
 *  - Soumission : son propriétaire, le formateur propriétaire de la
 *    formation du devoir, ou l'administrateur.
 */
class FileAccessService {
  /**
   * Résoudre le type de ressource associé à un chemin et déterminer
   * si l'utilisateur peut y accéder.
   */
  async resolveAccess(filename, user) {
    const chemin = `/uploads/${filename}`;

    const video = await VideoRepository.findByChemin(chemin);
    if (video) {
      return {
        allowed: await this._canAccessPedagogic(video, user),
        type: "video",
      };
    }

    const document = await DocumentRepository.findByChemin(chemin);
    if (document) {
      return {
        allowed: await this._canAccessPedagogic(document, user),
        type: "document",
      };
    }

    const submission = await SubmissionRepository.findByChemin(chemin);
    if (submission) {
      const allowed =
        isAdmin(user) ||
        Number(submission.id_utilisateur) === Number(user.id) ||
        canAccessFormation(
          { id_formateur: submission.id_formateur },
          user,
        );
      return { allowed, type: "soumission" };
    }

    const consignes = await AssignmentRepository.findByConsignesChemin(chemin);
    if (consignes) {
      return {
        allowed: await this._canAccessPedagogic(consignes, user),
        type: "consignes",
      };
    }

    return { allowed: false, type: null };
  }

  /**
   * Chemin absolu sûr sur disque pour un nom de fichier.
   * Rejette tout chemin qui sortirait du dossier d'upload.
   */
  resolveAbsolutePath(filename) {
    const basename = path.basename(filename);

    if (basename !== filename) {
      return null;
    }

    const root = path.resolve(uploadDir);
    const absolute = path.resolve(root, basename);

    if (!absolute.startsWith(`${root}${path.sep}`)) {
      return null;
    }

    return absolute;
  }

  /**
   * Accès à une ressource pédagogique (vidéo, document, consignes).
   */
  async _canAccessPedagogic(row, user) {
    if (isAdmin(user)) {
      return true;
    }

    if (canAccessFormation({ id_formateur: row.id_formateur }, user)) {
      return true;
    }

    if (user.role === ROLES.ETUDIANT) {
      const enrollment = await EnrollmentRepository.findByUserAndFormation(
        user.id,
        row.id_formation,
      );

      return Boolean(enrollment);
    }

    return false;
  }
}

export default new FileAccessService();
