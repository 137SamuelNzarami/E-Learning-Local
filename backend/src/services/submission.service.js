import SubmissionRepository from "../repositories/submission.repository.js";
import AssignmentRepository from "../repositories/assignment.repository.js";
import UserRepository from "../repositories/user.repository.js";
import NotificationRepository from "../repositories/notification.repository.js";

import ProgressionLeconService from "./progression-lecon.service.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertPersonalAccess,
  canAccessFormation,
  canGrade,
  imposeOwnership,
  isAdmin,
  resolveFormation,
  scopePersonalRowsByFormation,
  scopeToUser,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/app-errors.js";

class SubmissionService {
  /**
   * Récupérer toutes les soumissions
   */
  async getAllSubmissions() {
    return await SubmissionRepository.findAll();
  }
  /**
   * Récupérer une soumission par son ID
   *
   * - Propriétaire de la soumission : oui.
   * - Formateur propriétaire de la formation du devoir : oui (correction).
   * - Administrateur : oui.
   * - Tout autre utilisateur : refus (403).
   */
  async getSubmissionById(id, user) {
    const submission = await SubmissionRepository.findById(id);

    if (!submission) {
      throw new NotFoundError("Soumission introuvable.");
    }

    if (!isAdmin(user)) {
      const formation = await resolveFormation("assignment", submission.id_devoir);
      const estProprietaire =
        Number(submission.id_utilisateur) === Number(user.id);
      const estFormateurProprietaire = canAccessFormation(formation, user);

      if (!estProprietaire && !estFormateurProprietaire) {
        throw new AccessDeniedError(
          "Accès interdit. Cette ressource ne vous appartient pas.",
        );
      }
    }

    return submission;
  }
  /**
   * Récupérer les soumissions d'un devoir
   */
  async getSubmissionsByAssignment(id_devoir, user) {
    const assignment = await AssignmentRepository.findById(id_devoir);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    const rows = await SubmissionRepository.findByAssignmentId(id_devoir);

    // Un étudiant ne voit que ses propres soumissions ; un formateur qui
    // possède la formation du devoir voit toutes les soumissions.
    const formation = await resolveFormation("assignment", id_devoir);

    return scopePersonalRowsByFormation(rows, user, formation);
  }
  /**
   * Récupérer les soumissions d'un utilisateur
   */
  async getSubmissionsByUser(id_utilisateur, user) {
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await SubmissionRepository.findByUserId(idCible);
  }
  /**
   * Un étudiant soumet son devoir ; la note ne peut jamais être
   * définie par l'étudiant (elle est ignorée). Seul un formateur
   * propriétaire ou un administrateur peut la fournir.
   */
  async createSubmission(data, user) {
    imposeOwnership(data, user);
    if (!data.fichier) {
      throw new ValidationError("Le fichier de soumission est obligatoire.", [{ field: "fichier", message: "Le fichier de soumission est obligatoire." }]);
    }

    const assignment = await AssignmentRepository.findById(data.id_devoir);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    // Protection de la note
    const formation = await resolveFormation("assignment", data.id_devoir);

    if (data.note !== undefined && data.note !== null) {
      if (!canGrade(user, formation)) {
        delete data.note;
      }
    }

    const existing = await SubmissionRepository.findByUserAndAssignment(
      data.id_utilisateur,
      data.id_devoir,
    );

    if (existing) {
      throw new ConflictError("Cet utilisateur a déjà soumis ce devoir.");
    }

    try {
      const id = await SubmissionRepository.create(data);

      // Progression événementielle : la remise du devoir participe au calcul
      await ProgressionLeconService.recomputeForUserAndFormation(
        data.id_utilisateur,
        formation.id_formation,
      );

      this._notifyFormateurNewSubmission(formation, utilisateur, assignment).catch(() => {});

      return id;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async _notifyFormateurNewSubmission(formation, etudiant, assignment) {
    try {
      const idFormateur = Number(formation.id_formateur);
      if (!idFormateur) return;

      await NotificationRepository.create({
        id_utilisateur: idFormateur,
        titre: "Devoir soumis",
        contenu: `${etudiant.prenom ?? ""} ${etudiant.nom ?? ""} a soumis le devoir « ${assignment.titre} ».`,
      });
    } catch (_) {}
  }
  /**
   * Modifier une soumission
   *
   * - Un étudiant peut modifier sa propre soumission (fichier) mais
   *   jamais la note : elle est ignorée.
   * - Un formateur propriétaire de la formation du devoir peut noter
   *   n'importe quelle soumission de ce devoir.
   * - L'administrateur conserve un accès global.
   */
  async updateSubmission(id, data, user) {
    const submission = await SubmissionRepository.findById(id);

    if (!submission) {
      throw new NotFoundError("Soumission introuvable.");
    }

    const formation = await resolveFormation("assignment", submission.id_devoir);

    // Un correcteur peut noter sans resoumettre le devoir : les champs
    // non fournis restent inchangés (cf. update partielle du dépôt).
    if (data.id_devoir === undefined) {
      data.id_devoir = submission.id_devoir;
    }
    if (data.id_utilisateur === undefined) {
      data.id_utilisateur = submission.id_utilisateur;
    }

    const estProprietaire =
      Number(submission.id_utilisateur) === Number(user.id);
    const peutNoter = canGrade(user, formation);

    // IDOR : un non-admin n'accède qu'à ses propres soumissions,
    // sauf le formateur propriétaire de la formation (correction).
    if (!isAdmin(user) && !peutNoter && !estProprietaire) {
      throw new AccessDeniedError(
        "Accès interdit. Cette ressource ne vous appartient pas.",
      );
    }

    // L'identité du propriétaire d'une soumission est figée :
    // ni l'étudiant ni le formateur ne peuvent la transférer.
    if (
      data.id_utilisateur !== undefined &&
      Number(data.id_utilisateur) !== Number(submission.id_utilisateur) &&
      !isAdmin(user)
    ) {
      throw new AccessDeniedError(
        "Le propriétaire d'une soumission ne peut pas être modifié.",
      );
    }

    // Un étudiant ne peut jamais écrire la note ; un formateur
    // propriétaire (ou un admin) le peut.
    if (data.note !== undefined && data.note !== null) {
      if (!peutNoter) {
        delete data.note;
      }
    }

    if (data.note === null) {
      // Une note volontairement remise à null reste acceptée
      // uniquement par un correcteur autorisé.
      if (!peutNoter) {
        delete data.note;
      }
    }

    const assignment = await AssignmentRepository.findById(data.id_devoir);

    if (!assignment) {
      throw new NotFoundError("Devoir introuvable.");
    }

    // Un étudiant ne peut pas déplacer sa soumission vers un devoir
    // qui ne lui appartient pas (pas de transfert de correction).
    if (!isAdmin(user) && !peutNoter) {
      if (Number(data.id_devoir) !== Number(submission.id_devoir)) {
        throw new AccessDeniedError(
          "Vous ne pouvez pas déplacer une soumission vers un autre devoir.",
        );
      }
    }

    const existing = await SubmissionRepository.findByUserAndAssignment(
      submission.id_utilisateur,
      data.id_devoir,
    );

    if (existing && existing.id_soumission !== Number(id)) {
      throw new ConflictError("Cet utilisateur a déjà soumis ce devoir.");
    }

    try {
      await SubmissionRepository.update(id, data);

      // Progression événementielle : recalcul sur l'ancienne et la
      // nouvelle formation du devoir (idempotent).
      await ProgressionLeconService.recomputeForUserAndFormation(
        data.id_utilisateur,
        formation.id_formation,
      );

      if (Number(data.id_devoir) !== Number(submission.id_devoir)) {
        const ancienneFormation = await resolveFormation(
          "assignment",
          submission.id_devoir,
        );

        if (ancienneFormation) {
          await ProgressionLeconService.recomputeForUserAndFormation(
            data.id_utilisateur,
            ancienneFormation.id_formation,
          );
        }
      }

      if (peutNoter && data.note !== undefined) {
        this._notifyStudentGraded(submission, assignment, data.note).catch(() => {});
      }

      return await SubmissionRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async _notifyStudentGraded(submission, assignment, note) {
    try {
      await NotificationRepository.create({
        id_utilisateur: submission.id_utilisateur,
        titre: "Devoir noté",
        contenu: `Votre devoir « ${assignment.titre} » a été noté : ${note}/100.`,
      });
    } catch (_) {}
  }
  /**
   * Supprimer une soumission
   */
  async deleteSubmission(id, user) {
    const submission = await SubmissionRepository.findById(id);

    if (!submission) {
      throw new NotFoundError("Soumission introuvable.");
    }

    // IDOR : un non-admin ne peut supprimer que ses propres soumissions
    assertPersonalAccess(user, submission.id_utilisateur);

    try {
      return await SubmissionRepository.delete(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new SubmissionService();
