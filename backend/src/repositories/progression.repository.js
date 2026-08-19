import pool from "../config/database.js";

class ProgressionRepository {
  /**
   * Récupérer toutes les progressions
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                p.id_progression,
                p.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                p.id_formation,
                f.titre AS formation,
                p.pourcentage
            FROM progressions p
            INNER JOIN utilisateurs u
                ON p.id_utilisateur = u.id_utilisateur
            INNER JOIN formations f
                ON p.id_formation = f.id_formation
            ORDER BY p.id_progression ASC
        `);
    return rows;
  }
  /**
   * Récupérer une progression par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                p.id_progression,
                p.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                p.id_formation,
                f.titre AS formation,
                p.pourcentage
            FROM progressions p
            INNER JOIN utilisateurs u
                ON p.id_utilisateur = u.id_utilisateur
            INNER JOIN formations f
                ON p.id_formation = f.id_formation
            WHERE p.id_progression = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Récupérer la progression d'un utilisateur
   * pour une formation
   */
  async findByUserAndFormation(id_utilisateur, id_formation) {
    const [rows] = await pool.query(
      `
            SELECT
                id_progression,
                id_utilisateur,
                id_formation,
                pourcentage
            FROM progressions
            WHERE id_utilisateur = ?
              AND id_formation = ?
            `,
      [id_utilisateur, id_formation],
    );
    return rows[0] || null;
  }
  /**
   * Récupérer toutes les progressions
   * d'un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                p.id_progression,
                p.id_utilisateur,
                p.id_formation,
                f.titre AS formation,
                p.pourcentage
            FROM progressions p
            INNER JOIN formations f
                ON p.id_formation = f.id_formation
            WHERE p.id_utilisateur = ?
            ORDER BY p.id_progression ASC
            `,
      [id_utilisateur],
    );
    return rows;
  }
  /**
   * Récupérer les progressions
   * d'une formation
   */
  async findByFormationId(id_formation) {
    const [rows] = await pool.query(
      `
            SELECT
                p.id_progression,
                p.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                p.id_formation,
                p.pourcentage
            FROM progressions p
            INNER JOIN utilisateurs u
                ON p.id_utilisateur = u.id_utilisateur
            WHERE p.id_formation = ?
            ORDER BY p.pourcentage DESC
            `,
      [id_formation],
    );
    return rows;
  }
  /**
   * Créer une progression
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO progressions
            (
                id_utilisateur,
                id_formation,
                pourcentage
            )
            VALUES (?, ?, ?)
            `,
      [data.id_utilisateur, data.id_formation, data.pourcentage ?? 0],
    );
    return result.insertId;
  }
  /**
   * Modifier une progression
   *
   * Mise à jour partielle : seuls les champs fournis sont modifiés,
   * un PUT ne doit jamais écraser des valeurs non mentionnées.
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.id_utilisateur !== undefined) {
      sets.push("id_utilisateur = ?");
      values.push(data.id_utilisateur);
    }
    if (data.id_formation !== undefined) {
      sets.push("id_formation = ?");
      values.push(data.id_formation);
    }
    if (data.pourcentage !== undefined) {
      sets.push("pourcentage = ?");
      values.push(data.pourcentage);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      `
            UPDATE progressions
            SET ${sets.join(", ")}
            WHERE id_progression = ?
            `,
      values,
    );
    return result.affectedRows;
  }
  /**
   * Supprimer une progression
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM progressions
            WHERE id_progression = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new ProgressionRepository();