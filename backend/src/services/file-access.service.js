import path from "node:path";

import ROLES from "../constants/role.js";
import SousSectionRepository from "../repositories/sous-section.repository.js";
import SectionRepository from "../repositories/section.repository.js";
import EnrollmentRepository from "../repositories/enrollment.repository.js";
import FormationRepository from "../repositories/formation.repository.js";
import { canAccessFormation, isAdmin } from "../utils/ownership.js";
import { uploadDir } from "../config/upload.js";

/**
 * Contrôle d'accès aux fichiers uploadés.
 *
 * Dans la nouvelle architecture pédagogique, les fichiers (vidéos,
 * documents, images...) sont insérés dans le contenu RICH TEXT des
 * SECTIONS et des SOUS-SECTIONS via l'éditeur. Le HTML référence les
 * fichiers avec une URL `/api/files/<nom>` ; le serveur retrouve la
 * formation propriétaire puis applique les règles d'accès.
 *
 * Règles :
 *  - Administrateur : accès global.
 *  - Formateur propriétaire de la formation : accès.
 *  - Étudiant inscrit à une formation PUBLIÉE : accès.
 */
class FileAccessService {
  /**
   * Résoudre la formation propriétaire d'un fichier et déterminer
   * si l'utilisateur peut y accéder.
   *
   * Un fichier peut être référencé par `sections.contenu` (rich text de
   * section) OU `sous_sections.contenu` (rich text de sous-section) :
   * les deux tables sont interrogées.
   */
  async resolveAccess(filename, user) {
    const chemin = `/api/files/${filename}`;

    const [sousRow, sectionRow] = await Promise.all([
      SousSectionRepository.findFormationIdByFileChemin(chemin),
      SectionRepository.findFormationIdByFileChemin(chemin),
    ]);

    const row = sousRow || sectionRow;

    if (!row) {
      // Prévisualisation immédiate après upload : le fichier n'est pas
      // encore référencé dans une section/sous-section (pas encore
      // sauvegardée). Seul SON propriétaire — l'id authentifié encodé en
      // préfixe du nom `{id}-{timestamp}-{nom}` — peut y accéder.
      const own = this._isOwnUpload(filename, user);
      return { allowed: own, type: own ? "upload" : null };
    }

    const allowed = await this._canAccessFormation(row.id_formation, user);
    return { allowed, type: sousRow ? "sous-section" : "section" };
  }

  /**
   * Un fichier non référencé est-il une création de l'utilisateur ?
   * Le préfixe `{id}-` est posé par multer au moment de l'upload sous
   * authentification ; aucun autre utilisateur ne peut le reproduire.
   * Les anciens noms (`{timestamp}-...`) ne matchent pas et restent
   * inaccessibles tant qu'ils ne sont pas référencés en base.
   */
  _isOwnUpload(filename, user) {
    if (!user?.id) return false;
    const prefix = String(filename ?? "").split("-")[0] || "";
    if (!/^\d{1,8}$/.test(prefix)) return false;
    return Number(prefix) === user.id;
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

  async _canAccessFormation(id_formation, user) {
    if (isAdmin(user)) {
      return true;
    }

    const formation = await FormationRepository.findById(id_formation);

    if (!formation) {
      return false;
    }

    if (canAccessFormation(formation, user)) {
      return true;
    }

    if (user.role === ROLES.ETUDIANT) {
      // Une formation non publiée n'accepte aucun accès étudiant.
      if (formation.statut !== "PUBLIEE") {
        return false;
      }

      const enrollment = await EnrollmentRepository.findByUserAndFormation(
        user.id,
        id_formation,
      );

      return Boolean(enrollment);
    }

    return false;
  }
}

export default new FileAccessService();
