import pool from "../config/database.js";

const SELECT_BASE = `
            SELECT
                t.id_tentative,
                t.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                t.id_quiz,
                q.titre AS quiz,
                q.score_reussite,
                t.note,
                t.statut,
                t.date_soumission,
                t.date_correction,
                t.created_at
`;

class AttemptRepository {
  /**
   * Récupérer toutes les tentatives
   */
  async findAll() {
    const [rows] = await pool.query(`
            ${SELECT_BASE}
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
            ${SELECT_BASE}
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
            ${SELECT_BASE}
            FROM tentatives t
            INNER JOIN utilisateurs u
                ON t.id_utilisateur = u.id_utilisateur
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
            ${SELECT_BASE}
            FROM tentatives t
            INNER JOIN utilisateurs u
                ON t.id_utilisateur = u.id_utilisateur
            INNER JOIN quiz q
                ON t.id_quiz = q.id_quiz
            WHERE t.id_quiz = ?
            ORDER BY t.id_tentative DESC
            `,
      [id_quiz],
    );

    return rows;
  }
  /**
   * Tentatives d'un utilisateur pour un quiz (règle de repassage)
   */
  async findByUserAndQuiz(id_utilisateur, id_quiz) {
    const [rows] = await pool.query(
      `
            ${SELECT_BASE}
            FROM tentatives t
            INNER JOIN utilisateurs u
                ON t.id_utilisateur = u.id_utilisateur
            INNER JOIN quiz q
                ON t.id_quiz = q.id_quiz
            WHERE t.id_utilisateur = ? AND t.id_quiz = ?
            ORDER BY t.id_tentative ASC
            `,
      [id_utilisateur, id_quiz],
    );

    return rows;
  }
  /**
   * Tentative EN_COURS existante d'un utilisateur sur un quiz
   */
  async findOpenByUserAndQuiz(id_utilisateur, id_quiz) {
    const [rows] = await pool.query(
      `
            ${SELECT_BASE}
            FROM tentatives t
            INNER JOIN utilisateurs u
                ON t.id_utilisateur = u.id_utilisateur
            INNER JOIN quiz q
                ON t.id_quiz = q.id_quiz
            WHERE t.id_utilisateur = ? AND t.id_quiz = ? AND t.statut = 'EN_COURS'
            ORDER BY t.id_tentative DESC
            LIMIT 1
            `,
      [id_utilisateur, id_quiz],
    );

    return rows[0] || null;
  }
  /**
   * Le quiz est-il réussi par cet utilisateur (au moins une tentative) ?
   */
  async hasSucceeded(id_utilisateur, id_quiz) {
    const [rows] = await pool.query(
      `SELECT 1 AS ok
       FROM tentatives
       WHERE id_utilisateur = ? AND id_quiz = ? AND statut = 'REUSSIE'
       LIMIT 1`,
      [id_utilisateur, id_quiz],
    );
    return rows.length > 0;
  }
  /**
   * Créer une tentative (EN_COURS)
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO tentatives
            (
                id_utilisateur,
                id_quiz,
                statut
            )
            VALUES (?, ?, ?)
            `,
      [data.id_utilisateur, data.id_quiz, data.statut ?? "EN_COURS"],
    );

    return result.insertId;
  }
  /**
   * Enregistrer la soumission : note + statut + date_soumission
   */
  async submit(id, { note, statut }) {
    const [result] = await pool.query(
      `
            UPDATE tentatives
            SET note = ?, statut = ?, date_soumission = NOW()
            WHERE id_tentative = ?
            `,
      [note, statut, id],
    );

    return result.affectedRows;
  }
  /**
   * Correction du formateur : note finale + statut + date_correction
   */
  async correct(id, { note, statut }) {
    const [result] = await pool.query(
      `
            UPDATE tentatives
            SET note = ?, statut = ?, date_correction = NOW()
            WHERE id_tentative = ?
            `,
      [note, statut, id],
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
