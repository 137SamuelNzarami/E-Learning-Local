import pool from "../config/database.js";

class SectionRepository {
  /**
   * Récupérer toutes les sections
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                s.id_section,
                s.id_chapitre,
                s.titre,
                s.description,
                s.ordre,
                c.titre AS chapitre,
                c.id_formation
            FROM sections s
            INNER JOIN chapitres c
                ON s.id_chapitre = c.id_chapitre
            ORDER BY c.id_formation ASC, c.ordre ASC, s.ordre ASC, s.id_section ASC
        `);
    return rows;
  }
  /**
   * Récupérer une section par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                s.id_section,
                s.id_chapitre,
                s.titre,
                s.description,
                s.ordre,
                c.titre AS chapitre,
                c.id_formation
            FROM sections s
            INNER JOIN chapitres c
                ON s.id_chapitre = c.id_chapitre
            WHERE s.id_section = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Sections d'un chapitre (ordre pédagogique)
   */
  async findByChapter(id_chapitre) {
    const [rows] = await pool.query(
      `
            SELECT
                id_section,
                id_chapitre,
                titre,
                description,
                ordre
            FROM sections
            WHERE id_chapitre = ?
            ORDER BY ordre ASC, id_section ASC
            `,
      [id_chapitre],
    );
    return rows;
  }
  /**
   * Prochain ordre disponible dans un chapitre
   */
  async nextOrder(id_chapitre) {
    const [rows] = await pool.query(
      "SELECT COALESCE(MAX(ordre), 0) + 1 AS next FROM sections WHERE id_chapitre = ?",
      [id_chapitre],
    );
    return rows[0].next;
  }
  /**
   * Créer une section
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO sections
            (
                id_chapitre,
                titre,
                description,
                ordre
            )
            VALUES (?, ?, ?, ?)
            `,
      [
        data.id_chapitre,
        data.titre ?? null,
        data.description ?? null,
        data.ordre ?? null,
      ],
    );
    return result.insertId;
  }
  /**
   * Modifier une section (partiel)
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.titre !== undefined) {
      sets.push("titre = ?");
      values.push(data.titre);
    }
    if (data.description !== undefined) {
      sets.push("description = ?");
      values.push(data.description);
    }
    if (data.ordre !== undefined) {
      sets.push("ordre = ?");
      values.push(data.ordre);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      "UPDATE sections SET " + sets.join(", ") + " WHERE id_section = ?",
      values,
    );
    return result.affectedRows;
  }
  /**
   * Réordonner les sections d'un chapitre (transactionnel)
   */
  async reorder(id_chapitre, orderedIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query(
          "UPDATE sections SET ordre = ? WHERE id_section = ? AND id_chapitre = ?",
          [i + 1, orderedIds[i], id_chapitre],
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
  /**
   * Supprimer une section (les sous-sections partent en CASCADE)
   */
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM sections WHERE id_section = ?",
      [id],
    );
    return result.affectedRows;
  }
}

export default new SectionRepository();
