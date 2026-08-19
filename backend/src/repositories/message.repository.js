import pool from "../config/database.js";

class MessageRepository {
  /**
   * Récupérer tous les messages
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                m.id_message,

                m.id_conversation,
                c.sujet,

                m.id_expediteur,
                u.nom,
                u.prenom,
                u.email,

                m.contenu,
                m.created_at

            FROM messages m

            INNER JOIN conversations c
                ON m.id_conversation = c.id_conversation

            INNER JOIN utilisateurs u
                ON m.id_expediteur = u.id_utilisateur

            ORDER BY m.id_message DESC
        `);

    return rows;
  }
  /**
   * Récupérer un message par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                m.id_message,

                m.id_conversation,
                c.sujet,

                m.id_expediteur,
                u.nom,
                u.prenom,
                u.email,

                m.contenu,
                m.created_at

            FROM messages m

            INNER JOIN conversations c
                ON m.id_conversation = c.id_conversation

            INNER JOIN utilisateurs u
                ON m.id_expediteur = u.id_utilisateur

            WHERE m.id_message = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Récupérer les messages d'une conversation
   */
  async findByConversationId(id_conversation) {
    const [rows] = await pool.query(
      `
            SELECT
                m.id_message,

                m.id_conversation,
                c.sujet,

                m.id_expediteur,
                u.nom,
                u.prenom,
                u.email,

                m.contenu,
                m.created_at

            FROM messages m

            INNER JOIN conversations c
                ON m.id_conversation = c.id_conversation

            INNER JOIN utilisateurs u
                ON m.id_expediteur = u.id_utilisateur

            WHERE m.id_conversation = ?

            ORDER BY m.id_message ASC
            `,
      [id_conversation],
    );

    return rows;
  }
  /**
   * Récupérer les messages d'un expéditeur
   */
  async findBySenderId(id_expediteur) {
    const [rows] = await pool.query(
      `
            SELECT
                m.id_message,

                m.id_conversation,
                c.sujet,

                m.id_expediteur,
                m.contenu,
                m.created_at

            FROM messages m

            INNER JOIN conversations c
                ON m.id_conversation = c.id_conversation

            WHERE m.id_expediteur = ?

            ORDER BY m.id_message DESC
            `,
      [id_expediteur],
    );

    return rows;
  }
  /**
   * Créer un message
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO messages
            (
                id_conversation,
                id_expediteur,
                contenu
            )
            VALUES (?, ?, ?)
            `,
      [data.id_conversation, data.id_expediteur, data.contenu],
    );

    return result.insertId;
  }
  /**
   * Modifier un message
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE messages
            SET
                contenu = ?
            WHERE id_message = ?
            `,
      [data.contenu, id],
    );

    return result.affectedRows;
  }
  /**
   * Supprimer un message
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM messages
            WHERE id_message = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new MessageRepository();