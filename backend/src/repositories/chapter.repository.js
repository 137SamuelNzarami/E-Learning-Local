import pool from "../config/database.js";

class ChapterRepository {
  /**
   * Récupérer tous les chapitres
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                c.id_chapitre,
                c.titre,
                c.description,
                m.id_module,
                m.titre AS module
            FROM chapitres c
            INNER JOIN modules m
                ON c.id_module = m.id_module
            ORDER BY c.titre ASC
        `);
    return rows;
  }
  /**
   * Récupérer un chapitre par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                c.id_chapitre,
                c.id_module,
                c.titre,
                c.description,
                m.titre AS module
            FROM chapitres c
            INNER JOIN modules m
                ON c.id_module = m.id_module
            WHERE c.id_chapitre = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Rechercher un chapitre par son titre
   */
  async findByTitle(titre) {
    const [rows] = await pool.query(
      `
            SELECT *
            FROM chapitres
            WHERE titre = ?
            `,
      [titre],
    );
    return rows[0] || null;
  }
  /**
   * Ajouter un chapitre
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO chapitres
            (
                id_module,
                titre,
                description
            )
            VALUES (?, ?, ?)
            `,
      [data.id_module, data.titre, data.description ?? null],
    );
    return result.insertId;
  }
  /**
   * Modifier un chapitre
   *
   * Mise à jour partielle : seuls les champs fournis sont modifiés.
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.id_module !== undefined) {
      sets.push("id_module = ?");
      values.push(data.id_module);
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
            UPDATE chapitres
            SET ${sets.join(", ")}
            WHERE id_chapitre = ?
            `,
      values,
    );
    return result.affectedRows;
  }
  /**
   * Supprimer un chapitre
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM chapitres
            WHERE id_chapitre = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new ChapterRepository();
