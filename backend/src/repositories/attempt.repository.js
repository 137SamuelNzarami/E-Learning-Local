import pool from "../config/database.js";

class AttemptRepository {
  /**
   * Récupérer toutes les tentatives
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                t.id_tentative,
                t.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                t.id_quiz,
                q.titre AS quiz,
                t.note
            FROM tentatives t
            INNER JOIN utilisateurs u
                ON t.id_utilisateur = u.id_utilisateur
            INNER JOIN quiz q
                ON t.id_quiz = q.id_quiz
            ORDER BY t.id_tentative DESC
        `);

    return rows;
  }
  /**
   * Récupérer une tentative par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                t.id_tentative,
                t.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                t.id_quiz,
                q.titre AS quiz,
                t.note
            FROM tentatives t
            INNER JOIN utilisateurs u
                ON t.id_utilisateur = u.id_utilisateur
            INNER JOIN quiz q
                ON t.id_quiz = q.id_quiz
            WHERE t.id_tentative = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Récupérer les tentatives d'un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                t.id_tentative,
                t.id_utilisateur,
                t.id_quiz,
                q.titre AS quiz,
                t.note
            FROM tentatives t
            INNER JOIN quiz q
                ON t.id_quiz = q.id_quiz
            WHERE t.id_utilisateur = ?
            ORDER BY t.id_tentative DESC
            `,
      [id_utilisateur],
    );

    return rows;
  }
  /**
   * Récupérer les tentatives d'un quiz
   */
  async findByQuizId(id_quiz) {
    const [rows] = await pool.query(
      `
            SELECT
                t.id_tentative,
                t.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                t.id_quiz,
                t.note
            FROM tentatives t
            INNER JOIN utilisateurs u
                ON t.id_utilisateur = u.id_utilisateur
            WHERE t.id_quiz = ?
            ORDER BY t.id_tentative DESC
            `,
      [id_quiz],
    );

    return rows;
  }
  /**
   * Créer une tentative
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO tentatives
            (
                id_utilisateur,
                id_quiz,
                note
            )
            VALUES (?, ?, ?)
            `,
      [data.id_utilisateur, data.id_quiz, data.note ?? null],
    );

    return result.insertId;
  }
  /**
   * Modifier une tentative
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE tentatives
            SET
                id_utilisateur = ?,
                id_quiz = ?,
                note = ?
            WHERE id_tentative = ?
            `,
      [data.id_utilisateur, data.id_quiz, data.note, id],
    );

    return result.affectedRows;
  }
  /**
   * Modifier la note d'une tentative
   */
  async updateNote(id, note) {
    const [result] = await pool.query(
      `
            UPDATE tentatives
            SET
                note = ?
            WHERE id_tentative = ?
            `,
      [note, id],
    );
    return result.affectedRows;
  }
  /**
   * Supprimer une tentative
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM tentatives
            WHERE id_tentative = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new AttemptRepository();