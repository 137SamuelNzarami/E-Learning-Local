import pool from "../config/database.js";

class QuizRepository {
  /**
   * Récupérer tous les quiz
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                q.id_quiz,
                q.id_chapitre,
                q.titre,
                q.score_reussite,

                c.id_formation,
                c.titre AS chapitre,

                f.titre AS formation

            FROM quiz q

            INNER JOIN chapitres c
                ON q.id_chapitre = c.id_chapitre

            INNER JOIN formations f
                ON c.id_formation = f.id_formation

            ORDER BY q.titre ASC
        `);

    return rows;
  }
  /**
   * Récupérer un quiz par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                q.id_quiz,
                q.id_chapitre,
                q.titre,
                q.score_reussite,

                c.id_formation,
                c.ordre AS chapitre_ordre,
                c.titre AS chapitre,

                f.titre AS formation

            FROM quiz q

            INNER JOIN chapitres c
                ON q.id_chapitre = c.id_chapitre

            INNER JOIN formations f
                ON c.id_formation = f.id_formation

            WHERE q.id_quiz = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Quiz d'un chapitre (règle métier : un quiz par chapitre)
   */
  async findByChapter(id_chapitre) {
    const [rows] = await pool.query(
      `
            SELECT
                q.id_quiz,
                q.id_chapitre,
                q.titre,
                q.score_reussite
            FROM quiz q
            WHERE q.id_chapitre = ?
            ORDER BY q.id_quiz ASC
            `,
      [id_chapitre],
    );

    return rows;
  }
  /**
   * Créer un quiz
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO quiz
            (
                id_chapitre,
                titre,
                score_reussite
            )
            VALUES (?, ?, ?)
            `,
      [data.id_chapitre, data.titre, data.score_reussite ?? 50],
    );

    return result.insertId;
  }
  /**
   * Modifier un quiz
   */
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.titre !== undefined) {
      fields.push("titre = ?");
      params.push(data.titre);
    }
    if (data.score_reussite !== undefined) {
      fields.push("score_reussite = ?");
      params.push(data.score_reussite);
    }

    if (fields.length === 0) {
      return 0;
    }

    params.push(id);

    const [result] = await pool.query(
      `UPDATE quiz SET ${fields.join(", ")} WHERE id_quiz = ?`,
      params,
    );

    return result.affectedRows;
  }
  /**
   * Supprimer un quiz
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM quiz
            WHERE id_quiz = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new QuizRepository();
