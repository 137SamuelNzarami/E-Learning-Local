import pool from "../config/database.js";

class ChapterRepository {
  /**
   * Récupérer tous les chapitres
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                c.id_chapitre,
                c.id_formation,
                c.titre,
                c.description,
                c.ordre,
                f.titre AS formation
            FROM chapitres c
            INNER JOIN formations f
                ON c.id_formation = f.id_formation
            ORDER BY f.id_formation ASC, c.ordre ASC, c.id_chapitre ASC
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
                c.id_formation,
                c.titre,
                c.description,
                c.ordre,
                f.titre AS formation
            FROM chapitres c
            INNER JOIN formations f
                ON c.id_formation = f.id_formation
            WHERE c.id_chapitre = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Chapitres d'une formation (ordre pédagogique)
   */
  async findByFormation(id_formation) {
    const [rows] = await pool.query(
      `
            SELECT
                id_chapitre,
                id_formation,
                titre,
                description,
                ordre
            FROM chapitres
            WHERE id_formation = ?
            ORDER BY ordre ASC, id_chapitre ASC
            `,
      [id_formation],
    );
    return rows;
  }
  /**
   * Nombre de chapitres d'une formation
   */
  async countByFormation(id_formation) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM chapitres WHERE id_formation = ?",
      [id_formation],
    );
    return rows[0].total;
  }
  /**
   * Prochain ordre disponible dans une formation
   */
  async nextOrder(id_formation) {
    const [rows] = await pool.query(
      "SELECT COALESCE(MAX(ordre), 0) + 1 AS next FROM chapitres WHERE id_formation = ?",
      [id_formation],
    );
    return rows[0].next;
  }
  /**
   * Ajouter un chapitre
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO chapitres
            (
                id_formation,
                titre,
                description,
                ordre
            )
            VALUES (?, ?, ?, ?)
            `,
      [
        data.id_formation,
        data.titre,
        data.description ?? null,
        data.ordre ?? null,
      ],
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
   * Réordonner les chapitres d'une formation (transactionnel)
   */
  async reorder(id_formation, orderedIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query(
          "UPDATE chapitres SET ordre = ? WHERE id_chapitre = ? AND id_formation = ?",
          [i + 1, orderedIds[i], id_formation],
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
