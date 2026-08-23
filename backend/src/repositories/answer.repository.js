import pool from "../config/database.js";

class AnswerRepository {
  /**
   * Récupérer toutes les réponses
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                r.id_reponse,
                r.id_question,
                r.contenu,
                r.est_correcte,
                q.enonce AS question
            FROM reponses r
            INNER JOIN questions q
                ON r.id_question = q.id_question
            ORDER BY r.id_reponse ASC
        `);
    return rows;
  }
  /**
   * Récupérer une réponse par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                r.id_reponse,
                r.id_question,
                r.contenu,
                r.est_correcte,
                q.enonce AS question
            FROM reponses r
            INNER JOIN questions q
                ON r.id_question = q.id_question
            WHERE r.id_reponse = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Récupérer les réponses d'une question
   */
  async findByQuestionId(id_question) {
    const [rows] = await pool.query(
      `
            SELECT
                id_reponse,
                id_question,
                contenu,
                est_correcte
            FROM reponses
            WHERE id_question = ?
            ORDER BY id_reponse ASC
            `,
      [id_question],
    );
    return rows;
  }
  /**
   * Créer une réponse (QCM uniquement : une question LIBRE n'a pas de choix)
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO reponses
            (
                id_question,
                contenu,
                est_correcte
            )
            VALUES (?, ?, ?)
            `,
      [data.id_question, data.contenu, data.est_correcte ?? false],
    );
    return result.insertId;
  }
  /**
   * Modifier une réponse (partiel)
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.contenu !== undefined) {
      sets.push("contenu = ?");
      values.push(data.contenu);
    }
    if (data.est_correcte !== undefined) {
      sets.push("est_correcte = ?");
      values.push(data.est_correcte ? 1 : 0);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      "UPDATE reponses SET " + sets.join(", ") + " WHERE id_reponse = ?",
      values,
    );
    return result.affectedRows;
  }
  /**
   * Supprimer une réponse
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM reponses
            WHERE id_reponse = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new AnswerRepository();
