import pool from "../config/database.js";

class SousSectionRepository {
  /**
   * Récupérer toutes les sous-sections
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                ss.id_sous_section,
                ss.id_section,
                ss.titre,
                ss.contenu,
                ss.ordre,
                s.id_chapitre,
                c.id_formation
            FROM sous_sections ss
            INNER JOIN sections s
                ON ss.id_section = s.id_section
            INNER JOIN chapitres c
                ON s.id_chapitre = c.id_chapitre
            ORDER BY c.id_formation ASC, c.ordre ASC, ss.ordre ASC, ss.id_sous_section ASC
        `);
    return rows;
  }
  /**
   * Récupérer une sous-section par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                ss.id_sous_section,
                ss.id_section,
                ss.titre,
                ss.contenu,
                ss.ordre,
                s.id_chapitre,
                c.id_formation
            FROM sous_sections ss
            INNER JOIN sections s
                ON ss.id_section = s.id_section
            INNER JOIN chapitres c
                ON s.id_chapitre = c.id_chapitre
            WHERE ss.id_sous_section = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Sous-sections d'une section (sans le contenu, pour les listes)
   */
  async findBySection(id_section) {
    const [rows] = await pool.query(
      `
            SELECT
                id_sous_section,
                id_section,
                titre,
                ordre
            FROM sous_sections
            WHERE id_section = ?
            ORDER BY ordre ASC, id_sous_section ASC
            `,
      [id_section],
    );
    return rows;
  }
  /**
   * Prochain ordre disponible dans une section
   */
  async nextOrder(id_section) {
    const [rows] = await pool.query(
      "SELECT COALESCE(MAX(ordre), 0) + 1 AS next FROM sous_sections WHERE id_section = ?",
      [id_section],
    );
    return rows[0].next;
  }
  /**
   * Créer une sous-section (contenu rich text)
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO sous_sections
            (
                id_section,
                titre,
                contenu,
                ordre
            )
            VALUES (?, ?, ?, ?)
            `,
      [
        data.id_section,
        data.titre ?? null,
        data.contenu ?? null,
        data.ordre ?? null,
      ],
    );
    return result.insertId;
  }
  /**
   * Modifier une sous-section (partiel : titre / contenu rich text / ordre)
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.titre !== undefined) {
      sets.push("titre = ?");
      values.push(data.titre);
    }
    if (data.contenu !== undefined) {
      sets.push("contenu = ?");
      values.push(data.contenu);
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
      "UPDATE sous_sections SET " + sets.join(", ") + " WHERE id_sous_section = ?",
      values,
    );
    return result.affectedRows;
  }
  /**
   * Réordonner les sous-sections d'une section (transactionnel)
   */
  async reorder(id_section, orderedIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query(
          "UPDATE sous_sections SET ordre = ? WHERE id_sous_section = ? AND id_section = ?",
          [i + 1, orderedIds[i], id_section],
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
   * Supprimer une sous-section
   */
  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM sous_sections WHERE id_sous_section = ?",
      [id],
    );
    return result.affectedRows;
  }
  /**
   * Retrouver la formation qui référence un fichier uploadé
   * dans le contenu rich text d'une sous-section.
   *
   * Le contenu HTML contient des URL du type `/api/files/<nom>`.
   */
  async findFormationIdByFileChemin(chemin) {
    const [rows] = await pool.query(
      `
            SELECT c.id_formation
            FROM sous_sections ss
            INNER JOIN sections s
                ON ss.id_section = s.id_section
            INNER JOIN chapitres c
                ON s.id_chapitre = c.id_chapitre
            WHERE ss.contenu LIKE ?
            ORDER BY ss.id_sous_section ASC
            LIMIT 1
            `,
      [`%${chemin}%`],
    );
    return rows[0] || null;
  }
}

export default new SousSectionRepository();
