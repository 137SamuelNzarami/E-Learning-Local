import pool from "../config/database.js";

class ReviewRepository {
  /**
   * Récupérer tous les avis
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                a.id_avis,

                a.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                a.id_formation,
                f.titre AS formation,

                a.note,
                a.commentaire

            FROM avis a

            INNER JOIN utilisateurs u
                ON a.id_utilisateur = u.id_utilisateur

            INNER JOIN formations f
                ON a.id_formation = f.id_formation

            ORDER BY a.id_avis DESC
        `);

    return rows;
  }

  /**
   * Récupérer un avis par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                a.id_avis,

                a.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                a.id_formation,
                f.titre AS formation,

                a.note,
                a.commentaire

            FROM avis a

            INNER JOIN utilisateurs u
                ON a.id_utilisateur = u.id_utilisateur

            INNER JOIN formations f
                ON a.id_formation = f.id_formation

            WHERE a.id_avis = ?
            `,
      [id],
    );

    return rows[0] || null;
  }

  /**
   * Récupérer les avis d'une formation
   */
  async findByFormationId(id_formation) {
    const [rows] = await pool.query(
      `
            SELECT
                a.id_avis,

                a.id_utilisateur,
                u.nom,
                u.prenom,

                a.id_formation,
                f.titre AS formation,

                a.note,
                a.commentaire

            FROM avis a

            INNER JOIN utilisateurs u
                ON a.id_utilisateur = u.id_utilisateur

            INNER JOIN formations f
                ON a.id_formation = f.id_formation

            WHERE a.id_formation = ?

            ORDER BY a.id_avis DESC
            `,
      [id_formation],
    );

    return rows;
  }

  /**
   * Récupérer les avis d'un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                a.id_avis,

                a.id_utilisateur,

                a.id_formation,
                f.titre AS formation,

                a.note,
                a.commentaire

            FROM avis a

            INNER JOIN formations f
                ON a.id_formation = f.id_formation

            WHERE a.id_utilisateur = ?

            ORDER BY a.id_avis DESC
            `,
      [id_utilisateur],
    );

    return rows;
  }

  /**
   * Vérifier si un utilisateur a déjà donné
   * un avis pour une formation
   */
  async findByUserAndFormation(id_utilisateur, id_formation) {
    const [rows] = await pool.query(
      `
            SELECT
                id_avis,
                id_utilisateur,
                id_formation,
                note,
                commentaire

            FROM avis

            WHERE id_utilisateur = ?
              AND id_formation = ?
            `,
      [id_utilisateur, id_formation],
    );

    return rows[0] || null;
  }

  /**
   * Créer un avis
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO avis
            (
                id_utilisateur,
                id_formation,
                note,
                commentaire
            )
            VALUES (?, ?, ?, ?)
            `,
      [
        data.id_utilisateur,
        data.id_formation,
        data.note,
        data.commentaire ?? null,
      ],
    );

    return result.insertId;
  }

  /**
   * Modifier un avis
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE avis
            SET
                id_utilisateur = ?,
                id_formation = ?,
                note = ?,
                commentaire = ?

            WHERE id_avis = ?
            `,
      [
        data.id_utilisateur,
        data.id_formation,
        data.note,
        data.commentaire ?? null,
        id,
      ],
    );

    return result.affectedRows;
  }

  /**
   * Supprimer un avis
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM avis
            WHERE id_avis = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new ReviewRepository();
