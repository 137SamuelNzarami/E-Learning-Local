import pool from "../config/database.js";

class ModuleRepository {
  /**
   * Récupérer tous les modules
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                m.id_module,
                m.titre,
                m.description,
                f.id_formation,
                f.titre AS formation
            FROM modules m
            INNER JOIN formations f
                ON m.id_formation = f.id_formation
            ORDER BY m.titre ASC
        `);

    return rows;
  }
  /**
   * Récupérer un module par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                m.id_module,
                m.id_formation,
                m.titre,
                m.description,
                f.titre AS formation
            FROM modules m
            INNER JOIN formations f
                ON m.id_formation = f.id_formation
            WHERE m.id_module = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Rechercher un module par son titre
   */
  async findByTitle(titre) {
    const [rows] = await pool.query(
      `
            SELECT *
            FROM modules
            WHERE titre = ?
            `,
      [titre],
    );
    return rows[0] || null;
  }
  /**
   * Créer un module
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO modules
            (
                id_formation,
                titre,
                description
            )
            VALUES (?, ?, ?)
            `,
      [data.id_formation, data.titre, data.description ?? null],
    );
    return result.insertId;
  }
  /**
   * Modifier un module
   *
   * Mise à jour partielle : seuls les champs fournis sont modifiés.
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.id_formation !== undefined) {
      sets.push("id_formation = ?");
      values.push(data.id_formation);
    }
    if (data.titre !== undefined) {
      sets.push("titre = ?");
      values.push(data.titre);
    }
    if (data.description !== undefined) {
      sets.push("description = ?");
      values.push(data.description);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      `
            UPDATE modules
            SET ${sets.join(", ")}
            WHERE id_module = ?
            `,
      values,
    );
    return result.affectedRows;
  }
  /**
   * Supprimer un module
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM modules
            WHERE id_module = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new ModuleRepository();
