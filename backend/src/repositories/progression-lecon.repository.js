import pool from "../config/database.js";

/**
 * Complétion unitaire des leçons (progression_lecons).
 *
 * Une ligne = une leçon marquée comme terminée par un étudiant.
 * La contrainte UNIQUE (id_utilisateur, id_lecon) garantit l'idempotence.
 */
class ProgressionLeconRepository {
  /**
   * Marquer une leçon comme terminée (idempotent).
   */
  async upsertComplete(id_utilisateur, id_lecon) {
    const [result] = await pool.query(
      `
            INSERT INTO progression_lecons
            (
                id_utilisateur,
                id_lecon
            )
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id_lecon = id_lecon
            `,
      [id_utilisateur, id_lecon],
    );

    return result.affectedRows;
  }

  /**
   * Une leçon est-elle terminée par cet utilisateur ?
   */
  async isCompleted(id_utilisateur, id_lecon) {
    const [rows] = await pool.query(
      `
            SELECT id_progression_lecon
            FROM progression_lecons
            WHERE id_utilisateur = ?
              AND id_lecon = ?
            `,
      [id_utilisateur, id_lecon],
    );

    return rows.length > 0;
  }

  /**
   * Nombre total de leçons d'une formation.
   */
  async countLessonsTotal(id_formation) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(*) AS total
            FROM lecons l
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE m.id_formation = ?
            `,
      [id_formation],
    );

    return Number(rows[0]?.total || 0);
  }

  /**
   * Nombre de leçons terminées par un utilisateur dans une formation.
   */
  async countLessonsDone(id_utilisateur, id_formation) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(*) AS total
            FROM progression_lecons pl
            INNER JOIN lecons l
                ON pl.id_lecon = l.id_lecon
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE pl.id_utilisateur = ?
              AND m.id_formation = ?
            `,
      [id_utilisateur, id_formation],
    );

    return Number(rows[0]?.total || 0);
  }

  /**
   * Nombre total de quiz d'une formation.
   */
  async countQuizTotal(id_formation) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(*) AS total
            FROM quiz q
            INNER JOIN lecons l
                ON q.id_lecon = l.id_lecon
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE m.id_formation = ?
            `,
      [id_formation],
    );

    return Number(rows[0]?.total || 0);
  }

  /**
   * Nombre de quiz réussis (note >= 50) par un utilisateur
   * dans une formation.
   */
  async countQuizDone(id_utilisateur, id_formation) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(DISTINCT t.id_quiz) AS total
            FROM tentatives t
            INNER JOIN quiz q
                ON t.id_quiz = q.id_quiz
            INNER JOIN lecons l
                ON q.id_lecon = l.id_lecon
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE t.id_utilisateur = ?
              AND m.id_formation = ?
              AND t.note >= 50
            `,
      [id_utilisateur, id_formation],
    );

    return Number(rows[0]?.total || 0);
  }

  /**
   * Nombre total de devoirs d'une formation.
   */
  async countDevoirsTotal(id_formation) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(*) AS total
            FROM devoirs d
            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE m.id_formation = ?
            `,
      [id_formation],
    );

    return Number(rows[0]?.total || 0);
  }

  /**
   * Nombre de devoirs remis par un utilisateur dans une formation.
   */
  async countDevoirsDone(id_utilisateur, id_formation) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(DISTINCT s.id_devoir) AS total
            FROM soumissions s
            INNER JOIN devoirs d
                ON s.id_devoir = d.id_devoir
            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE s.id_utilisateur = ?
              AND m.id_formation = ?
            `,
      [id_utilisateur, id_formation],
    );

    return Number(rows[0]?.total || 0);
  }
}

export default new ProgressionLeconRepository();
