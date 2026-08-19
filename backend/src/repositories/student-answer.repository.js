import pool from "../config/database.js";

class StudentAnswerRepository {
  /**
   * Récupérer toutes les réponses des étudiants
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                re.id_reponse_etudiant,

                re.id_tentative,
                t.id_utilisateur,
                t.id_quiz,
                t.note,

                re.id_question,
                q.enonce AS question,

                re.id_reponse,
                r.contenu AS reponse,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN tentatives t
                ON re.id_tentative = t.id_tentative

            INNER JOIN questions q
                ON re.id_question = q.id_question

            INNER JOIN reponses r
                ON re.id_reponse = r.id_reponse

            ORDER BY re.id_reponse_etudiant ASC
        `);

    return rows;
  }
  /**
   * Récupérer une réponse étudiant par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                re.id_reponse_etudiant,

                re.id_tentative,
                t.id_utilisateur,
                t.id_quiz,
                t.note,

                re.id_question,
                q.enonce AS question,

                re.id_reponse,
                r.contenu AS reponse,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN tentatives t
                ON re.id_tentative = t.id_tentative

            INNER JOIN questions q
                ON re.id_question = q.id_question

            INNER JOIN reponses r
                ON re.id_reponse = r.id_reponse

            WHERE re.id_reponse_etudiant = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Récupérer les réponses d'une tentative
   */
  async findByAttemptId(id_tentative) {
    const [rows] = await pool.query(
      `
            SELECT
                re.id_reponse_etudiant,

                re.id_tentative,

                re.id_question,
                q.enonce AS question,

                re.id_reponse,
                r.contenu AS reponse,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN questions q
                ON re.id_question = q.id_question

            INNER JOIN reponses r
                ON re.id_reponse = r.id_reponse

            WHERE re.id_tentative = ?

            ORDER BY re.id_reponse_etudiant ASC
            `,
      [id_tentative],
    );

    return rows;
  }
  /**
   * Récupérer les réponses données à une question
   */
  async findByQuestionId(id_question) {
    const [rows] = await pool.query(
      `
            SELECT
                re.id_reponse_etudiant,

                re.id_tentative,
                t.id_utilisateur,
                t.id_quiz,

                re.id_question,

                re.id_reponse,
                r.contenu AS reponse,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN tentatives t
                ON re.id_tentative = t.id_tentative

            INNER JOIN reponses r
                ON re.id_reponse = r.id_reponse

            WHERE re.id_question = ?

            ORDER BY re.id_reponse_etudiant ASC
            `,
      [id_question],
    );

    return rows;
  }
  /**
   * Récupérer les réponses choisies par un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                re.id_reponse_etudiant,

                re.id_tentative,
                t.id_utilisateur,
                t.id_quiz,

                re.id_question,
                q.enonce AS question,

                re.id_reponse,
                r.contenu AS reponse,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN tentatives t
                ON re.id_tentative = t.id_tentative

            INNER JOIN questions q
                ON re.id_question = q.id_question

            INNER JOIN reponses r
                ON re.id_reponse = r.id_reponse

            WHERE t.id_utilisateur = ?

            ORDER BY re.id_reponse_etudiant DESC
            `,
      [id_utilisateur],
    );

    return rows;
  }
  /**
   * Créer une réponse étudiant
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO reponses_etudiants
            (
                id_tentative,
                id_question,
                id_reponse
            )
            VALUES (?, ?, ?)
            `,
      [data.id_tentative, data.id_question, data.id_reponse],
    );

    return result.insertId;
  }
  /**
   * Modifier une réponse étudiant
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE reponses_etudiants
            SET
                id_tentative = ?,
                id_question = ?,
                id_reponse = ?
            WHERE id_reponse_etudiant = ?
            `,
      [data.id_tentative, data.id_question, data.id_reponse, id],
    );

    return result.affectedRows;
  }
  /**
   * Supprimer une réponse étudiant
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM reponses_etudiants
            WHERE id_reponse_etudiant = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new StudentAnswerRepository();