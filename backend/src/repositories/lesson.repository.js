import pool from "../config/database.js";

class LessonRepository {
  /**
   * Récupérer toutes les leçons
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                l.id_lecon,
                l.titre,
                l.description,
                l.contenu,
                c.id_chapitre,
                c.titre AS chapitre
            FROM lecons l
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            ORDER BY l.titre ASC
        `);
    return rows;
  }
  /**
   * Récupérer une leçon par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                l.id_lecon,
                l.id_chapitre,
                l.titre,
                l.description,
                l.contenu,
                c.titre AS chapitre
            FROM lecons l
            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre
            WHERE l.id_lecon = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Rechercher une leçon par son titre
   */
  async findByTitle(titre) {
    const [rows] = await pool.query(
      `
            SELECT *
            FROM lecons
            WHERE titre = ?
            `,
      [titre],
    );
    return rows[0] || null;
  }
  /**
   * Créer une leçon
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO lecons
            (
                id_chapitre,
                titre,
                description,
                contenu
            )
            VALUES (?, ?, ?, ?)
            `,
      [data.id_chapitre, data.titre, data.description ?? null, data.contenu],
    );
    return result.insertId;
  }
  /**
   * Modifier une leçon
   *
   * Mise à jour partielle : seuls les champs fournis sont modifiés.
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.id_chapitre !== undefined) {
      sets.push("id_chapitre = ?");
      values.push(data.id_chapitre);
    }
    if (data.titre !== undefined) {
      sets.push("titre = ?");
      values.push(data.titre);
    }
    if (data.description !== undefined) {
      sets.push("description = ?");
      values.push(data.description);
    }
    if (data.contenu !== undefined) {
      sets.push("contenu = ?");
      values.push(data.contenu);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      `
            UPDATE lecons
            SET ${sets.join(", ")}
            WHERE id_lecon = ?
            `,
      values,
    );
    return result.affectedRows;
  }
  /**
   * Supprimer une leçon
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM lecons
            WHERE id_lecon = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new LessonRepository();
