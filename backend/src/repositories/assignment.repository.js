import pool from "../config/database.js";

class AssignmentRepository {
  /**
   * Récupérer tous les devoirs
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                d.id_devoir,
                d.titre,
                d.instructions,
                d.fichier_consignes,

                l.id_lecon,
                l.titre AS lecon

            FROM devoirs d

            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon

            ORDER BY d.titre ASC
        `);

    return rows;
  }

  /**
   * Récupérer un devoir par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                d.id_devoir,
                d.id_lecon,
                d.titre,
                d.instructions,
                d.fichier_consignes,

                l.titre AS lecon

            FROM devoirs d

            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon

            WHERE d.id_devoir = ?
            `,
      [id],
    );

    return rows[0] || null;
  }

  /**
   * Rechercher un devoir par son titre
   */
  async findByTitle(titre) {
    const [rows] = await pool.query(
      `
            SELECT
                d.id_devoir,
                d.id_lecon,
                d.titre,
                d.instructions,
                d.fichier_consignes,

                l.titre AS lecon

            FROM devoirs d

            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon

            WHERE d.titre = ?
            `,
      [titre],
    );

    return rows[0] || null;
  }

  /**
   * Rechercher un devoir par le chemin de son fichier de consignes
   */
  async findByConsignesChemin(chemin) {
    const [rows] = await pool.query(
      `
            SELECT
                d.id_devoir,
                d.id_lecon,
                d.titre,
                d.instructions,
                d.fichier_consignes,

                l.titre AS lecon,

                m.id_formation,
                f.id_formateur

            FROM devoirs d

            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon

            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre

            INNER JOIN modules m
                ON c.id_module = m.id_module

            INNER JOIN formations f
                ON m.id_formation = f.id_formation

            WHERE d.fichier_consignes = ?
            `,
      [chemin],
    );

    return rows[0] || null;
  }

  /**
   * Créer un devoir
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO devoirs
            (
                id_lecon,
                titre,
                instructions,
                fichier_consignes
            )
            VALUES (?, ?, ?, ?)
            `,
      [data.id_lecon, data.titre, data.instructions ?? null, data.fichier_consignes ?? null],
    );

    return result.insertId;
  }

  /**
   * Modifier un devoir
   *
   * Mise à jour partielle : seuls les champs fournis sont modifiés.
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.id_lecon !== undefined) {
      sets.push("id_lecon = ?");
      values.push(data.id_lecon);
    }
    if (data.titre !== undefined) {
      sets.push("titre = ?");
      values.push(data.titre);
    }
    if (data.instructions !== undefined) {
      sets.push("instructions = ?");
      values.push(data.instructions);
    }
    if (data.fichier_consignes !== undefined) {
      sets.push("fichier_consignes = ?");
      values.push(data.fichier_consignes);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      `
            UPDATE devoirs
            SET ${sets.join(", ")}
            WHERE id_devoir = ?
            `,
      values,
    );

    return result.affectedRows;
  }

  /**
   * Supprimer un devoir
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM devoirs
            WHERE id_devoir = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new AssignmentRepository();
