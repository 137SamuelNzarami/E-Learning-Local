import pool from "../config/database.js";
import LessonRepository from "../repositories/lesson.repository.js";
import EnrollmentRepository from "../repositories/enrollment.repository.js";
import ProgressionLeconRepository from "../repositories/progression-lecon.repository.js";
import ProgressionRepository from "../repositories/progression.repository.js";
import { NotFoundError, AccessDeniedError } from "../utils/app-errors.js";

/**
 * Service de complétion des leçons (progression événementielle).
 *
 * - Un étudiant inscrit marque une leçon comme terminée.
 * - La progression globale de la formation est recalculée à partir des
 *   leçons terminées, des quiz réussis (note >= 50) et des devoirs remis.
 * - Un étudiant ne peut marquer que les leçons d'une formation à laquelle
 *   il est inscrit.
 */
class ProgressionLeconService {
  /**
   * Marquer une leçon comme terminée (idempotent) et recalculer la
   * progression globale de l'étudiant dans la formation.
   */
  async completeLesson(id_lecon, user) {
    const lesson = await LessonRepository.findById(id_lecon);

    if (!lesson) {
      throw new NotFoundError("Leçon introuvable.");
    }

    const idFormation = await this._findFormationIdForLesson(lesson);

    if (!idFormation) {
      throw new NotFoundError("Impossible de déterminer la formation de cette leçon.");
    }

    const enrollment = await EnrollmentRepository.findByUserAndFormation(
      user.id,
      idFormation,
    );

    if (!enrollment) {
      throw new AccessDeniedError(
        "Vous devez être inscrit à cette formation pour marquer la leçon comme terminée.",
      );
    }

    await ProgressionLeconRepository.upsertComplete(user.id, lesson.id_lecon);

    const pourcentage = await this.recomputeForUserAndFormation(user.id, idFormation);

    return {
      completed: true,
      pourcentage,
      lecons_total: await ProgressionLeconRepository.countLessonsTotal(idFormation),
      lecons_faites: await ProgressionLeconRepository.countLessonsDone(user.id, idFormation),
    };
  }

  /**
   * État de complétion d'une leçon pour l'utilisateur courant.
   */
  async getLessonStatus(id_lecon, user) {
    const lesson = await LessonRepository.findById(id_lecon);

    if (!lesson) {
      throw new NotFoundError("Leçon introuvable.");
    }

    const idFormation = await this._findFormationIdForLesson(lesson);

    const completed = await ProgressionLeconRepository.isCompleted(user.id, id_lecon);

    if (!idFormation) {
      return { completed, pourcentage: null, lecons_total: 0, lecons_faites: 0 };
    }

    return {
      completed,
      pourcentage: await this.computeForUserAndFormation(user.id, idFormation),
      lecons_total: await ProgressionLeconRepository.countLessonsTotal(idFormation),
      lecons_faites: await ProgressionLeconRepository.countLessonsDone(user.id, idFormation),
    };
  }

  /**
   * Recalculer la progression d'un étudiant dans une formation et
   * persister la valeur (créée à 0 % si absente, ex. inscription).
   */
  async recomputeForUserAndFormation(id_utilisateur, id_formation) {
    const pourcentage = await this.computeForUserAndFormation(id_utilisateur, id_formation);

    let progression = await ProgressionRepository.findByUserAndFormation(
      id_utilisateur,
      id_formation,
    );

    if (!progression) {
      await ProgressionRepository.create({
        id_utilisateur,
        id_formation,
        pourcentage,
      });
    } else if (Number(progression.pourcentage) !== pourcentage) {
      await ProgressionRepository.update(progression.id_progression, { pourcentage });
    }

    return pourcentage;
  }

  /**
   * Calcul (sans écriture) de la progression d'un étudiant dans une
   * formation : (leçons terminées + quiz réussis + devoirs remis)
   * / (leçons + quiz + devoirs) * 100, arrondi à 1 décimale.
   */
  async computeForUserAndFormation(id_utilisateur, id_formation) {
    const [lessonsTotal, quizTotal, devoirsTotal] = await Promise.all([
      ProgressionLeconRepository.countLessonsTotal(id_formation),
      ProgressionLeconRepository.countQuizTotal(id_formation),
      ProgressionLeconRepository.countDevoirsTotal(id_formation),
    ]);

    const total = lessonsTotal + quizTotal + devoirsTotal;

    if (total === 0) {
      return 0;
    }

    const [lessonsDone, quizDone, devoirsDone] = await Promise.all([
      ProgressionLeconRepository.countLessonsDone(id_utilisateur, id_formation),
      ProgressionLeconRepository.countQuizDone(id_utilisateur, id_formation),
      ProgressionLeconRepository.countDevoirsDone(id_utilisateur, id_formation),
    ]);

    const done = lessonsDone + quizDone + devoirsDone;

    return Math.round((done / total) * 1000) / 10;
  }

  /**
   * Remonter l'identifiant de la formation d'une leçon.
   */
  async _findFormationIdForLesson(lesson) {
    const [rows] = await pool.query(
      `
            SELECT m.id_formation
            FROM lecons l
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE l.id_lecon = ?
            `,
      [lesson.id_lecon],
    );

    return rows[0]?.id_formation ?? null;
  }
}

export default new ProgressionLeconService();
