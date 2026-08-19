import pool from "../config/database.js";

class DocumentRepository {
  /**
   * Récupérer tous les documents
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                d.id_document,
                d.titre,
                d.chemin_document,
                l.id_lecon,
                l.titre AS lecon
            FROM documents d
            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon
            ORDER BY d.titre ASC
        `);
    return rows;
  }
  /**
   * Récupérer un document par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                d.id_document,
                d.id_lecon,
                d.titre,
                d.chemin_document,
                l.titre AS lecon
            FROM documents d
            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon
            WHERE d.id_document = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Rechercher un document par son chemin (contrôle d'accès aux fichiers)
   */
  async findByChemin(chemin) {
    const [rows] = await pool.query(
      `
            SELECT
                d.id_document,
                d.id_lecon,
                d.titre,
                d.chemin_document,

                m.id_formation,
                f.id_formateur

            FROM documents d

            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon

            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre

            INNER JOIN modules m
                ON c.id_module = m.id_module

            INNER JOIN formations f
                ON m.id_formation = f.id_formation

            WHERE d.chemin_document = ?

            LIMIT 1
            `,
      [chemin],
    );

    return rows[0] || null;
  }

  /**
   * Rechercher un document par son titre
   */
  async findByTitle(titre) {
    const [rows] = await pool.query(
      `
            SELECT *
            FROM documents
            WHERE titre = ?
            `,
      [titre],
    );
    return rows[0] || null;
  }
  /**
   * Ajouter un document
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO documents
            (
                id_lecon,
                titre,
                chemin_document
            )
            VALUES (?, ?, ?)
            `,
      [data.id_lecon, data.titre, data.chemin_document],
    );
    return result.insertId;
  }
  /**
   * Modifier un document
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE documents
            SET
                id_lecon = ?,
                titre = ?,
                chemin_document = ?
            WHERE id_document = ?
            `,
      [data.id_lecon, data.titre, data.chemin_document, id],
    );
    return result.affectedRows;
  }
  /**
   * Supprimer un document
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM documents
            WHERE id_document = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new DocumentRepository();
