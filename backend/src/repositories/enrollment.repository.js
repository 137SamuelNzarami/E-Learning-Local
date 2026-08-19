import pool from "../config/database.js";

class EnrollmentRepository {
  /**
   * Récupérer toutes les inscriptions
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                i.id_inscription,
                i.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                i.id_formation,
                f.titre AS formation,
                i.date_inscription
            FROM inscriptions i
            INNER JOIN utilisateurs u
                ON i.id_utilisateur = u.id_utilisateur
            INNER JOIN formations f
                ON i.id_formation = f.id_formation
            ORDER BY i.date_inscription DESC
        `);
    return rows;
  }
  /**
   * Récupérer une inscription par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                i.id_inscription,
                i.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                i.id_formation,
                f.titre AS formation,
                i.date_inscription
            FROM inscriptions i
            INNER JOIN utilisateurs u
                ON i.id_utilisateur = u.id_utilisateur
            INNER JOIN formations f
                ON i.id_formation = f.id_formation
            WHERE i.id_inscription = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Vérifier si un utilisateur est déjà inscrit
   * à une formation
   */
  async findByUserAndFormation(id_utilisateur, id_formation) {
    const [rows] = await pool.query(
      `
            SELECT
                id_inscription,
                id_utilisateur,
                id_formation,
                date_inscription
            FROM inscriptions
            WHERE id_utilisateur = ?
              AND id_formation = ?
            `,
      [id_utilisateur, id_formation],
    );
    return rows[0] || null;
  }
  /**
   * Récupérer les inscriptions d'un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                i.id_inscription,
                i.id_utilisateur,
                i.id_formation,
                f.titre AS formation,
                f.description,
                i.date_inscription
            FROM inscriptions i
            INNER JOIN formations f
                ON i.id_formation = f.id_formation
            WHERE i.id_utilisateur = ?
            ORDER BY i.date_inscription DESC
            `,
      [id_utilisateur],
    );
    return rows;
  }
  /**
   * Récupérer les étudiants inscrits
   * à une formation
   */
  async findByFormationId(id_formation) {
    const [rows] = await pool.query(
      `
            SELECT
                i.id_inscription,
                i.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                i.id_formation,
                i.date_inscription
            FROM inscriptions i
            INNER JOIN utilisateurs u
                ON i.id_utilisateur = u.id_utilisateur
            WHERE i.id_formation = ?
            ORDER BY i.date_inscription ASC
            `,
      [id_formation],
    );
    return rows;
  }
  /**
   * Créer une inscription
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO inscriptions
            (
                id_utilisateur,
                id_formation
            )
            VALUES (?, ?)
            `,
      [data.id_utilisateur, data.id_formation],
    );
    return result.insertId;
  }
  /**
   * Supprimer une inscription
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM inscriptions
            WHERE id_inscription = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new EnrollmentRepository();
