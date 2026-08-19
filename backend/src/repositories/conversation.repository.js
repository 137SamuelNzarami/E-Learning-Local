import pool from "../config/database.js";

class ConversationRepository {
  /**
   * Récupérer toutes les conversations
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                id_conversation,
                sujet,
                created_at
            FROM conversations
            ORDER BY id_conversation DESC
        `);

    return rows;
  }

  /**
   * Récupérer une conversation par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                id_conversation,
                sujet,
                created_at
            FROM conversations
            WHERE id_conversation = ?
            `,
      [id],
    );

    return rows[0] || null;
  }

  /**
   * Rechercher une conversation par son sujet
   */
  async findBySubject(sujet) {
    const [rows] = await pool.query(
      `
            SELECT
                id_conversation,
                sujet,
                created_at
            FROM conversations
            WHERE sujet = ?
            `,
      [sujet],
    );

    return rows[0] || null;
  }

  /**
   * Créer une conversation
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO conversations
            (
                sujet
            )
            VALUES (?)
            `,
      [data.sujet],
    );

    return result.insertId;
  }

  /**
   * Créer une conversation et ses participants dans une transaction.
   *
   * Garantit qu'une conversation n'est jamais créée sans participant
   * (aucune conversation orpheline) et que l'ensemble est atomique.
   */
  async createWithParticipants(sujet, participantIds) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `
                INSERT INTO conversations
                (
                    sujet
                )
                VALUES (?)
                `,
        [sujet],
      );

      const idConversation = result.insertId;

      for (const idUtilisateur of participantIds) {
        await connection.query(
          `
                    INSERT INTO participant_conversations
                    (
                        id_conversation,
                        id_utilisateur
                    )
                    VALUES (?, ?)
                    `,
          [idConversation, idUtilisateur],
        );
      }

      await connection.commit();

      return idConversation;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Modifier une conversation
   */
  async update(id, data) {
    const [result] = await pool.query(
      `
            UPDATE conversations
            SET
                sujet = ?
            WHERE id_conversation = ?
            `,
      [data.sujet, id],
    );

    return result.affectedRows;
  }

  /**
   * Supprimer une conversation
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM conversations
            WHERE id_conversation = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new ConversationRepository();
