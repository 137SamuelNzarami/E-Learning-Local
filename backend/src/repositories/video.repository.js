import pool from "../config/database.js";

class VideoRepository {
  /**
   * Récupérer toutes les vidéos
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                v.id_video,
                v.titre,
                v.chemin_video,
                l.id_lecon,
                l.titre AS lecon
            FROM videos v
            INNER JOIN lecons l
                ON v.id_lecon = l.id_lecon
            ORDER BY v.titre ASC
        `);
    return rows;
  }
  /**
   * Récupérer une vidéo par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                v.id_video,
                v.id_lecon,
                v.titre,
                v.chemin_video,
                l.titre AS lecon
            FROM videos v
            INNER JOIN lecons l
                ON v.id_lecon = l.id_lecon
            WHERE v.id_video = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Rechercher une vidéo par son chemin (contrôle d'accès aux fichiers)
   */
  async findByChemin(chemin) {
    const [rows] = await pool.query(
      `
            SELECT
                v.id_video,
                v.id_lecon,
                v.titre,
                v.chemin_video,

                m.id_formation,
                f.id_formateur

            FROM videos v

            INNER JOIN lecons l
                ON v.id_lecon = l.id_lecon

            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre

            INNER JOIN modules m
                ON c.id_module = m.id_module

            INNER JOIN formations f
                ON m.id_formation = f.id_formation

            WHERE v.chemin_video = ?

            LIMIT 1
            `,
      [chemin],
    );

    return rows[0] || null;
  }

  /**
   * Rechercher une vidéo par son titre
   */
  async findByTitle(titre) {
    const [rows] = await pool.query(
      `
            SELECT *
            FROM videos
            WHERE titre = ?
            `,
      [titre],
    );
    return rows[0] || null;
  }
  /**
   * Ajouter une vidéo
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO videos
            (
                id_lecon,
                titre,
                chemin_video
            )
            VALUES (?, ?, ?)
            `,
      [data.id_lecon, data.titre, data.chemin_video],
    );
    return result.insertId;
  }
  /**
   * Modifier une vidéo
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE videos
            SET
                id_lecon = ?,
                titre = ?,
                chemin_video = ?
            WHERE id_video = ?
            `,
      [data.id_lecon, data.titre, data.chemin_video, id],
    );
    return result.affectedRows;
  }
  /**
   * Supprimer une vidéo
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM videos
            WHERE id_video = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new VideoRepository();