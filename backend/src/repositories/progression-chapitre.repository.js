import pool from "../config/database.js";

/**
 * Complétion des chapitres SANS quiz (source de vérité parcours).
 *
 * Un chapitre avec quiz est validé par la réussite du quiz (tentatives).
 * Un chapitre sans quiz est validé explicitement par l'étudiant inscrit
 * (marquer comme terminé) — idempotent via UNIQUE(id_utilisateur, id_chapitre).
 */
class ProgressionChapitreRepository {
  /**
   * Marquer un chapitre comme terminé (idempotent)
   */
  async upsertComplete(id_utilisateur, id_chapitre) {
    await pool.query(
      `INSERT INTO progression_chapitres (id_utilisateur, id_chapitre)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id_chapitre = id_chapitre`,
      [id_utilisateur, id_chapitre],
    );
  }

  /**
   * Le chapitre est-il terminé pour cet utilisateur ?
   */
  async isCompleted(id_utilisateur, id_chapitre) {
    const [rows] = await pool.query(
      `SELECT 1 AS ok
       FROM progression_chapitres
       WHERE id_utilisateur = ? AND id_chapitre = ?`,
      [id_utilisateur, id_chapitre],
    );
    return rows.length > 0;
  }

  /**
   * Chapitres terminés d'un utilisateur dans une formation
   */
  async findCompletedChapterIds(id_utilisateur, id_formation) {
    const [rows] = await pool.query(
      `SELECT pc.id_chapitre
       FROM progression_chapitres pc
       INNER JOIN chapitres c ON c.id_chapitre = pc.id_chapitre
       WHERE pc.id_utilisateur = ? AND c.id_formation = ?`,
      [id_utilisateur, id_formation],
    );
    return rows.map((r) => Number(r.id_chapitre));
  }
}

export default new ProgressionChapitreRepository();
