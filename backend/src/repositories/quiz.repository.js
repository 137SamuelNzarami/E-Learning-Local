import pool from "../config/database.js";

class QuizRepository {
  /**
   * Récupérer tous les quiz
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                q.id_quiz,
                q.titre,

                l.id_lecon,
                l.titre AS lecon,

                c.id_chapitre,
                c.titre AS chapitre,

                m.id_module,
                m.titre AS module,

                f.id_formation,
                f.titre AS formation

            FROM quiz q

            INNER JOIN lecons l
                ON q.id_lecon = l.id_lecon

            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre

            INNER JOIN modules m
                ON c.id_module = m.id_module

            INNER JOIN formations f
                ON m.id_formation = f.id_formation

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
                q.id_lecon,
                q.titre,

                l.titre AS lecon,

                c.id_chapitre,
                c.titre AS chapitre,

                m.id_module,
                m.titre AS module,

                f.id_formation,
                f.titre AS formation

            FROM quiz q

            INNER JOIN lecons l
                ON q.id_lecon = l.id_lecon

            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre

            INNER JOIN modules m
                ON c.id_module = m.id_module

            INNER JOIN formations f
                ON m.id_formation = f.id_formation

            WHERE q.id_quiz = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Rechercher un quiz par son titre
   */
  async findByTitle(titre) {
    const [rows] = await pool.query(
      `
            SELECT
                q.id_quiz,
                q.id_lecon,
                q.titre,

                l.titre AS lecon,

                c.id_chapitre,
                c.titre AS chapitre,

                m.id_module,
                m.titre AS module,

                f.id_formation,
                f.titre AS formation

            FROM quiz q

            INNER JOIN lecons l
                ON q.id_lecon = l.id_lecon

            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre

            INNER JOIN modules m
                ON c.id_module = m.id_module

            INNER JOIN formations f
                ON m.id_formation = f.id_formation

            WHERE q.titre = ?
            `,
      [titre],
    );

    return rows[0] || null;
  }
  /**
   * Créer un quiz
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO quiz
            (
                id_lecon,
                titre
            )
            VALUES (?, ?)
            `,
      [data.id_lecon, data.titre],
    );

    return result.insertId;
  }
  /**
   * Modifier un quiz
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE quiz
            SET
                id_lecon = ?,
                titre = ?
            WHERE id_quiz = ?
            `,
      [data.id_lecon, data.titre, id],
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