import StudentAnswerRepository from "../repositories/student-answer.repository.js";

import AttemptRepository from "../repositories/attempt.repository.js";

import QuestionRepository from "../repositories/question.repository.js";

import AnswerRepository from "../repositories/answer.repository.js";

import UserRepository from "../repositories/user.repository.js";

import ProgressionLeconService from "./progression-lecon.service.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertPersonalAccess,
  canSeeCorrection,
  isAdmin,
  resolveFormation,
  scopePersonalRowsByFormation,
  scopeToUser,
  stripCorrectionField,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
} from "../utils/app-errors.js";

class StudentAnswerService {
  async getAllStudentAnswers() {
    return await StudentAnswerRepository.findAll();
  }

  /**
   * Retire le champ `est_correcte` (le corrigé) des lignes lorsqu'elles
   * sont renvoyées à un utilisateur qui n'est ni administrateur ni
   * formateur propriétaire de la formation de la question.
   *
   * @param {Object|Array<Object>} rows - réponses d'étudiant (avec est_correcte)
   * @param {Object} user - utilisateur authentifié
   * @returns {Promise<Object|Array<Object>>}
   */
  async exposeCorrection(rows, user) {
    if (isAdmin(user)) {
      return rows;
    }

    const liste = Array.isArray(rows) ? rows : [rows];
    const cacheFormations = {};
    const resultat = [];

    for (const row of liste) {
      if (!row) {
        continue;
      }

      const idQuestion = row.id_question;

      if (!cacheFormations[idQuestion]) {
        cacheFormations[idQuestion] = await resolveFormation(
          "question",
          idQuestion,
        );
      }

      const formation = cacheFormations[idQuestion];

      if (canSeeCorrection(user, formation)) {
        resultat.push(row);
      } else {
        resultat.push(stripCorrectionField(row));
      }
    }

    return Array.isArray(rows) ? resultat : resultat[0];
  }

  /**
   * Récupérer une réponse étudiant
   */
  async getStudentAnswerById(id, user) {
    const answer = await StudentAnswerRepository.findById(id);

    if (!answer) {
      throw new NotFoundError("Réponse de l'étudiant introuvable.");
    }

    // IDOR : l'appartenance passe par la tentative (t.id_utilisateur)
    assertPersonalAccess(user, answer.id_utilisateur);

    return await this.exposeCorrection(answer, user);
  }

  /**
   * Récupérer les réponses d'une tentative
   */
  async getByAttempt(id_tentative, user) {
    const attempt = await AttemptRepository.findById(id_tentative);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    // Un non-admin ne peut lire que les réponses de SES tentatives
    assertPersonalAccess(user, attempt.id_utilisateur);

    const rows = await StudentAnswerRepository.findByAttemptId(id_tentative);

    return await this.exposeCorrection(rows, user);
  }

  /**
   * Récupérer les réponses données à une question
   */
  async getByQuestion(id_question, user) {
    const question = await QuestionRepository.findById(id_question);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    const rows = await StudentAnswerRepository.findByQuestionId(id_question);

    // Un étudiant ne voit que ses propres réponses ; un formateur qui
    // possède la formation de la question voit toutes les réponses.
    const formation = await resolveFormation("question", id_question);

    const autorisees = scopePersonalRowsByFormation(rows, user, formation);

    return await this.exposeCorrection(autorisees, user);
  }

  /**
   * Récupérer les réponses d'un utilisateur
   */
  async getByUser(id_utilisateur, user) {
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    const rows = await StudentAnswerRepository.findByUserId(idCible);

    return await this.exposeCorrection(rows, user);
  }

  /**
   * Vérifier qu'une question appartient
   * au quiz de la tentative
   */
  async validateQuestionForAttempt(id_tentative, id_question, user) {
    const attempt = await AttemptRepository.findById(id_tentative);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    // La tentative doit appartenir à l'utilisateur (sauf admin)
    assertPersonalAccess(user, attempt.id_utilisateur);

    const question = await QuestionRepository.findById(id_question);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    if (Number(question.id_quiz) !== Number(attempt.id_quiz)) {
      throw new ConflictError(
        "Cette question n'appartient pas au quiz de cette tentative.",
      );
    }

    return {
      attempt,
      question,
    };
  }

  /**
   * Vérifier qu'une réponse appartient
   * à une question
   */
  async validateAnswerForQuestion(id_reponse, id_question) {
    const answer = await AnswerRepository.findById(id_reponse);

    if (!answer) {
      throw new NotFoundError("Réponse introuvable.");
    }

    if (Number(answer.id_question) !== Number(id_question)) {
      throw new ConflictError("Cette réponse n'appartient pas à cette question.");
    }

    return answer;
  }

  /**
   * Notation automatique d'une tentative à partir des réponses
   * réellement soumises (et de leur champ est_correcte).
   *
   * La note est recalculée côté serveur et n'est jamais dérivée
   * d'une valeur envoyée par le client.
   */
  async recomputeAttemptNote(id_tentative) {
    const attempt = await AttemptRepository.findById(id_tentative);

    if (!attempt) {
      return;
    }

    const questions = await QuestionRepository.findByQuizId(attempt.id_quiz);

    const total = questions.length;

    if (total === 0) {
      await AttemptRepository.updateNote(id_tentative, null);
      return;
    }

    const reponses = await StudentAnswerRepository.findByAttemptId(id_tentative);

    const correctes = reponses.filter(
      (reponse) => reponse.est_correcte,
    ).length;

    const note = Math.round((correctes / total) * 10000) / 100;

    await AttemptRepository.updateNote(id_tentative, note);
  }

  /**
   * Recalcule la progression globale de l'étudiant dans la formation du
   * quiz après une soumission de réponses (un quiz réussi à 50 % ou plus
   * participe à la progression).
   */
  async _recomputeProgression(attempt) {
    if (!attempt) {
      return;
    }

    const formation = await resolveFormation("quiz", attempt.id_quiz);

    if (formation) {
      await ProgressionLeconService.recomputeForUserAndFormation(
        attempt.id_utilisateur,
        formation.id_formation,
      );
    }
  }

  /**
   * Créer une réponse étudiant
   */
  async createStudentAnswer(data, user) {
    const { id_tentative, id_question, id_reponse } = data;

    /**
     * Vérifier la tentative (et son appartenance), puis la question
     */
    const { attempt } = await this.validateQuestionForAttempt(
      id_tentative,
      id_question,
      user,
    );

    /**
     * Vérifier que la réponse appartient
     * à la question
     */
    await this.validateAnswerForQuestion(id_reponse, id_question);

    try {
      const id = await StudentAnswerRepository.create(data);

      // Notation automatique recalculée à partir des réponses soumises
      await this.recomputeAttemptNote(id_tentative);

      // Progression événementielle : le quiz réussi (note >= 50) compte
      // dans la progression globale de la formation.
      await this._recomputeProgression(attempt);

      return id;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Modifier une réponse étudiant
   */
  async updateStudentAnswer(id, data, user) {
    const existingAnswer = await StudentAnswerRepository.findById(id);

    if (!existingAnswer) {
      throw new NotFoundError("Réponse de l'étudiant introuvable.");
    }

    // IDOR : on ne peut modifier que ses propres réponses
    assertPersonalAccess(user, existingAnswer.id_utilisateur);

    /**
     * Vérifier la nouvelle tentative
     * et la nouvelle question
     */
    await this.validateQuestionForAttempt(
      data.id_tentative,
      data.id_question,
      user,
    );

    /**
     * Vérifier la nouvelle réponse
     */
    await this.validateAnswerForQuestion(data.id_reponse, data.id_question);

    try {
      await StudentAnswerRepository.update(id, data);

      // Recalcule la note de la tentative affectée
      await this.recomputeAttemptNote(data.id_tentative);

      // Si la tentative a changé, on recalcule aussi l'ancienne
      if (Number(data.id_tentative) !== Number(existingAnswer.id_tentative)) {
        await this.recomputeAttemptNote(existingAnswer.id_tentative);
      }

      // Progression événementielle sur la (ou les) formation(s) concernée(s)
      await this._recomputeProgression(
        await AttemptRepository.findById(data.id_tentative),
      );

      if (Number(data.id_tentative) !== Number(existingAnswer.id_tentative)) {
        await this._recomputeProgression(
          await AttemptRepository.findById(existingAnswer.id_tentative),
        );
      }

      const updated = await StudentAnswerRepository.findById(id);

      return await this.exposeCorrection(updated, user);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Supprimer une réponse étudiant
   */
  async deleteStudentAnswer(id, user) {
    const answer = await StudentAnswerRepository.findById(id);

    if (!answer) {
      throw new NotFoundError("Réponse de l'étudiant introuvable.");
    }

    // IDOR : on ne peut supprimer que ses propres réponses
    assertPersonalAccess(user, answer.id_utilisateur);

    try {
      const resultat = await StudentAnswerRepository.delete(id);

      // La note de la tentative doit refléter la suppression
      await this.recomputeAttemptNote(answer.id_tentative);

      // Progression événementielle : la note du quiz peut repasser sous 50
      await this._recomputeProgression(
        await AttemptRepository.findById(answer.id_tentative),
      );

      return resultat;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

export default new StudentAnswerService();
