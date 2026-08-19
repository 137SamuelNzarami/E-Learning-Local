import AttemptRepository from "../repositories/attempt.repository.js";

import UserRepository from "../repositories/user.repository.js";

import QuizRepository from "../repositories/quiz.repository.js";

import EnrollmentRepository from "../repositories/enrollment.repository.js";

import ProgressionLeconService from "./progression-lecon.service.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertPersonalAccess,
  canGrade,
  imposeOwnership,
  resolveFormation,
  scopePersonalRowsByFormation,
  scopeToUser,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
} from "../utils/app-errors.js";

class AttemptService {
  /**
   * Récupérer toutes les tentatives
   */
  async getAllAttempts() {
    return await AttemptRepository.findAll();
  }
  /**
   * Récupérer une tentative par son ID
   */
  async getAttemptById(id, user) {
    const attempt = await AttemptRepository.findById(id);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    // IDOR : un non-admin ne peut lire que ses propres tentatives
    assertPersonalAccess(user, attempt.id_utilisateur);

    return attempt;
  }
  /**
   * Récupérer les tentatives d'un utilisateur
   */
  async getAttemptsByUser(id_utilisateur, user) {
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await AttemptRepository.findByUserId(idCible);
  }
  /**
   * Récupérer les tentatives d'un quiz
   */
  async getAttemptsByQuiz(id_quiz, user) {
    const quiz = await QuizRepository.findById(id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    const rows = await AttemptRepository.findByQuizId(id_quiz);

    // Un non-admin ne voit que ses propres tentatives, sauf si le
    // formateur possède la formation du quiz (vue de correction).
    const formation = await resolveFormation("quiz", id_quiz);

    return scopePersonalRowsByFormation(rows, user, formation);
  }
  /**
   * L'utilisateur peut-il fixer la note d'une tentative de ce quiz ?
   * (Administrateur, ou Formateur propriétaire de la formation.)
   */
  async canGradeAttempt(user, id_quiz) {
    const formation = await resolveFormation("quiz", id_quiz);

    return canGrade(user, formation);
  }
  /**
   * Créer une tentative
   */
  async createAttempt(data, user) {
    imposeOwnership(data, user);

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const quiz = await QuizRepository.findById(data.id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    const formationId = quiz.id_formation;

    if (!formationId) {
      throw new NotFoundError(
        "Impossible de déterminer la formation associée à ce quiz.",
      );
    }

    // Vérifier que l'étudiant est inscrit à la formation
    const enrollment = await EnrollmentRepository.findByUserAndFormation(
      data.id_utilisateur,
      formationId,
    );

    if (!enrollment) {
      throw new AccessDeniedError(
        "Cet utilisateur n'est pas inscrit à la formation de ce quiz.",
      );
    }

    /*
     * La note n'est jamais une donnée fiable envoyée par le client.
     * Elle n'est acceptée que de la part d'un formateur propriétaire
     * ou d'un administrateur ; pour les autres rôles elle est ignorée
     * (la note des quiz est recalculée à partir des réponses soumises).
     */
    if (data.note !== undefined && data.note !== null) {
      const peutNoter = await this.canGradeAttempt(user, data.id_quiz);

      if (peutNoter) {
        const note = Number(data.note);

        if (note < 0 || note > 100) {
          throw new ConflictError("La note doit être comprise entre 0 et 100.");
        }
      } else {
        delete data.note;
      }
    }

    try {
      const id = await AttemptRepository.create(data);

      // Progression événementielle : le quiz passé participe au calcul
      // (recalculé, enregistré pour l'étudiant dans la formation).
      await ProgressionLeconService.recomputeForUserAndFormation(
        data.id_utilisateur,
        formationId,
      );

      return id;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Modifier une tentative
   */
  async updateAttempt(id, data, user) {
    const attempt = await AttemptRepository.findById(id);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    // IDOR : un non-admin ne peut modifier que ses propres tentatives
    assertPersonalAccess(user, attempt.id_utilisateur);

    imposeOwnership(data, user);

    const utilisateur = await UserRepository.findById(data.id_utilisateur);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const quiz = await QuizRepository.findById(data.id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    // Même protection que lors de la création : la note n'est modifiable
    // que par un formateur propriétaire ou un administrateur.
    if (data.note !== undefined && data.note !== null) {
      const peutNoter = await this.canGradeAttempt(user, data.id_quiz);

      if (peutNoter) {
        const note = Number(data.note);

        if (note < 0 || note > 100) {
          throw new ConflictError("La note doit être comprise entre 0 et 100.");
        }
      } else {
        delete data.note;
      }
    }

    try {
      await AttemptRepository.update(id, data);

      // Progression événementielle : recalcul sur l'ancienne et la
      // nouvelle formation du quiz (idempotent).
      const ancienQuiz = await QuizRepository.findById(attempt.id_quiz);

      await ProgressionLeconService.recomputeForUserAndFormation(
        data.id_utilisateur,
        quiz.id_formation,
      );

      if (ancienQuiz && Number(ancienQuiz.id_formation) !== Number(quiz.id_formation)) {
        await ProgressionLeconService.recomputeForUserAndFormation(
          data.id_utilisateur,
          ancienQuiz.id_formation,
        );
      }

      return await AttemptRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  /**
   * Supprimer une tentative
   */
  async deleteAttempt(id, user) {
    const attempt = await AttemptRepository.findById(id);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    // IDOR : un non-admin ne peut supprimer que ses propres tentatives
    assertPersonalAccess(user, attempt.id_utilisateur);

    try {
      return await AttemptRepository.delete(id);
    } catch (error) {
      // Une tentative peut être référencée par reponses_etudiants
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer cette tentative car des réponses d'étudiant y sont associées.",
        );
      }
      handleDatabaseError(error);
    }
  }
}

export default new AttemptService();
