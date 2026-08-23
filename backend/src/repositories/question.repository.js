import pool from "../config/database.js";

const FIELDS = "q.id_question, q.id_quiz, q.enonce, q.type, q.points";

class QuestionRepository {
  /**
   * Récupérer toutes les questions
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                ${FIELDS},
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
                ${FIELDS},
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
   * Récupérer les questions d'un quiz (avec type + points)
   */
  async findByQuizId(id_quiz) {
    const [rows] = await pool.query(
      `
            SELECT
                ${FIELDS}
            FROM questions q
            WHERE q.id_quiz = ?
            ORDER BY q.id_question ASC
            `,
      [id_quiz],
    );
    return rows;
  }
  /**
   * Créer une question (QCM ou LIBRE)
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO questions
            (
                id_quiz,
                enonce,
                type,
                points
            )
            VALUES (?, ?, ?, ?)
            `,
      [
        data.id_quiz,
        data.enonce,
        data.type ?? "QCM",
        data.points ?? 1,
      ],
    );
    return result.insertId;
  }
  /**
   * Modifier une question (partiel)
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.enonce !== undefined) {
      sets.push("enonce = ?");
      values.push(data.enonce);
    }
    if (data.type !== undefined) {
      sets.push("type = ?");
      values.push(data.type);
    }
    if (data.points !== undefined) {
      sets.push("points = ?");
      values.push(data.points);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      "UPDATE questions SET " + sets.join(", ") + " WHERE id_question = ?",
      values,
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
