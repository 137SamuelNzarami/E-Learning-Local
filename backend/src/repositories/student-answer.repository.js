import pool from "../config/database.js";

/**
 * Réponses réellement données par l'étudiant.
 *
 * Produit QCM uniquement : chaque réponse étudiant référence une ou
 * plusieurs réponses proposées (id_reponse). La correction est 100 %
 * automatique côté serveur (aucune correction manuelle de questions
 * libres dans le produit).
 */
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

                re.id_question,
                q.enonce AS question,
                q.type AS type_question,
                q.points AS points_question,

                re.id_reponse,
                r.contenu AS reponse_choisie,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN tentatives t
                ON re.id_tentative = t.id_tentative

            INNER JOIN questions q
                ON re.id_question = q.id_question

            LEFT JOIN reponses r
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

                re.id_question,
                q.enonce AS question,
                q.type AS type_question,
                q.points AS points_question,

                re.id_reponse,
                r.contenu AS reponse_choisie,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN tentatives t
                ON re.id_tentative = t.id_tentative

            INNER JOIN questions q
                ON re.id_question = q.id_question

            LEFT JOIN reponses r
                ON re.id_reponse = r.id_reponse

            WHERE re.id_reponse_etudiant = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Réponses d'une tentative
   */
  async findByAttemptId(id_tentative) {
    const [rows] = await pool.query(
      `
            SELECT
                re.id_reponse_etudiant,
                re.id_tentative,

                re.id_question,
                q.enonce AS question,
                q.type AS type_question,
                q.points AS points_question,

                re.id_reponse,
                r.contenu AS reponse_choisie,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN questions q
                ON re.id_question = q.id_question

            LEFT JOIN reponses r
                ON re.id_reponse = r.id_reponse

            WHERE re.id_tentative = ?

            ORDER BY re.id_reponse_etudiant ASC
            `,
      [id_tentative],
    );

    return rows;
  }
  /**
   * Réponses données à une question (vue correction formateur)
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
                r.contenu AS reponse_choisie,
                r.est_correcte

            FROM reponses_etudiants re

            INNER JOIN tentatives t
                ON re.id_tentative = t.id_tentative

            LEFT JOIN reponses r
                ON re.id_reponse = r.id_reponse

            WHERE re.id_question = ?

            ORDER BY re.id_reponse_etudiant ASC
            `,
      [id_question],
    );

    return rows;
  }
  /**
   * Créer une réponse étudiant (QCM)
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
      [
        data.id_tentative,
        data.id_question,
        data.id_reponse ?? null,
      ],
    );

    return result.insertId;
  }
  /**
   * Supprimer les réponses d'une tentative (re-soumission)
   */
  async deleteByAttemptId(id_tentative) {
    const [result] = await pool.query(
      "DELETE FROM reponses_etudiants WHERE id_tentative = ?",
      [id_tentative],
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
