import pool from "../config/database.js";

class QuestionRepository {
  /**
   * Récupérer toutes les questions
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                q.id_question,
                q.id_quiz,
                q.enonce,
                z.titre AS quiz
            FROM questions q
            INNER JOIN quiz z
                ON q.id_quiz = z.id_quiz
            ORDER BY q.id_question ASC
        `);
    return rows;
  }
  /**
   * Récupérer une question par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                q.id_question,
                q.id_quiz,
                q.enonce,
                z.titre AS quiz
            FROM questions q
            INNER JOIN quiz z
                ON q.id_quiz = z.id_quiz
            WHERE q.id_question = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Récupérer les questions d'un quiz
   */
  async findByQuizId(id_quiz) {
    const [rows] = await pool.query(
      `
            SELECT
                q.id_question,
                q.id_quiz,
                q.enonce
            FROM questions q
            WHERE q.id_quiz = ?
            ORDER BY q.id_question ASC
            `,
      [id_quiz],
    );
    return rows;
  }
  /**
   * Créer une question
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO questions
            (
                id_quiz,
                enonce
            )
            VALUES (?, ?)
            `,
      [data.id_quiz, data.enonce],
    );
    return result.insertId;
  }
  /**
   * Modifier une question
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE questions
            SET
                id_quiz = ?,
                enonce = ?
            WHERE id_question = ?
            `,
      [data.id_quiz, data.enonce, id],
    );
    return result.affectedRows;
  }
  /**
   * Supprimer une question
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM questions
            WHERE id_question = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new QuestionRepository();