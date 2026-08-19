import pool from "../config/database.js";

class NotificationRepository {
  /**
   * Récupérer toutes les notifications
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                n.id_notification,

                n.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                n.titre,
                n.contenu,
                n.lu,
                n.created_at

            FROM notifications n

            INNER JOIN utilisateurs u
                ON n.id_utilisateur = u.id_utilisateur

            ORDER BY n.id_notification DESC
        `);

    return rows;
  }
  /**
   * Récupérer une notification par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                n.id_notification,

                n.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                n.titre,
                n.contenu,
                n.lu,
                n.created_at

            FROM notifications n

            INNER JOIN utilisateurs u
                ON n.id_utilisateur = u.id_utilisateur

            WHERE n.id_notification = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Récupérer les notifications d'un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                id_notification,
                id_utilisateur,
                titre,
                contenu,
                lu,
                created_at

            FROM notifications

            WHERE id_utilisateur = ?

            ORDER BY id_notification DESC
            `,
      [id_utilisateur],
    );

    return rows;
  }
  /**
   * Récupérer les notifications non lues d'un utilisateur
   */
  async findUnreadByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                id_notification,
                id_utilisateur,
                titre,
                contenu,
                lu,
                created_at

            FROM notifications

            WHERE id_utilisateur = ?
                AND lu = 0

            ORDER BY id_notification DESC
            `,
      [id_utilisateur],
    );

    return rows;
  }
  /**
   * Compter les notifications non lues d'un utilisateur
   */
  async countUnreadByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE id_utilisateur = ?
                AND lu = 0
            `,
      [id_utilisateur],
    );

    return rows[0]?.total || 0;
  }
  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id) {
    const [result] = await pool.query(
      `
            UPDATE notifications
            SET lu = 1
            WHERE id_notification = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
  /**
   * Créer une notification
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO notifications
            (
                id_utilisateur,
                titre,
                contenu
            )
            VALUES (?, ?, ?)
            `,
      [data.id_utilisateur, data.titre, data.contenu],
    );

    return result.insertId;
  }
  /**
   * Modifier une notification
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE notifications
            SET
                titre = ?,
                contenu = ?
            WHERE id_notification = ?
            `,
      [data.titre, data.contenu, id],
    );

    return result.affectedRows;
  }
  /**
   * Supprimer une notification
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM notifications
            WHERE id_notification = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new NotificationRepository();