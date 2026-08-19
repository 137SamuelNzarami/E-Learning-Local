import pool from "../config/database.js";

class ConversationParticipantRepository {
  /**
   * Récupérer tous les participants
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                pc.id_participant,

                pc.id_conversation,
                c.sujet,

                pc.id_utilisateur,
                u.nom,
                u.prenom,
                u.email

            FROM participant_conversations pc

            INNER JOIN conversations c
                ON pc.id_conversation = c.id_conversation

            INNER JOIN utilisateurs u
                ON pc.id_utilisateur = u.id_utilisateur

            ORDER BY pc.id_participant DESC
        `);

    return rows;
  }
  /**
   * Récupérer un participant par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                pc.id_participant,

                pc.id_conversation,
                c.sujet,

                pc.id_utilisateur,
                u.nom,
                u.prenom,
                u.email

            FROM participant_conversations pc

            INNER JOIN conversations c
                ON pc.id_conversation = c.id_conversation

            INNER JOIN utilisateurs u
                ON pc.id_utilisateur = u.id_utilisateur

            WHERE pc.id_participant = ?
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Récupérer les participants d'une conversation
   */
  async findByConversationId(id_conversation) {
    const [rows] = await pool.query(
      `
            SELECT
                pc.id_participant,

                pc.id_conversation,
                c.sujet,

                pc.id_utilisateur,
                u.nom,
                u.prenom,
                u.email

            FROM participant_conversations pc

            INNER JOIN conversations c
                ON pc.id_conversation = c.id_conversation

            INNER JOIN utilisateurs u
                ON pc.id_utilisateur = u.id_utilisateur

            WHERE pc.id_conversation = ?

            ORDER BY pc.id_participant ASC
            `,
      [id_conversation],
    );

    return rows;
  }
  /**
   * Récupérer les conversations d'un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                pc.id_participant,

                pc.id_conversation,
                c.sujet,

                pc.id_utilisateur,

                (
                    SELECT CONCAT(u2.prenom, ' ', u2.nom)
                    FROM participant_conversations pc2
                    INNER JOIN utilisateurs u2
                        ON pc2.id_utilisateur = u2.id_utilisateur
                    WHERE pc2.id_conversation = pc.id_conversation
                      AND pc2.id_utilisateur != pc.id_utilisateur
                    LIMIT 1
                ) AS other_name

            FROM participant_conversations pc

            INNER JOIN conversations c
                ON pc.id_conversation = c.id_conversation

            WHERE pc.id_utilisateur = ?

            ORDER BY pc.id_participant DESC
            `,
      [id_utilisateur],
    );

    return rows;
  }
  /**
   * Vérifier si un utilisateur participe
   * déjà à une conversation
   */
  async findByUserAndConversation(id_utilisateur, id_conversation) {
    const [rows] = await pool.query(
      `
            SELECT
                id_participant,
                id_conversation,
                id_utilisateur

            FROM participant_conversations

            WHERE id_utilisateur = ?
              AND id_conversation = ?
            `,
      [id_utilisateur, id_conversation],
    );

    return rows[0] || null;
  }
  /**
   * Trouver une conversation partagée par deux utilisateurs
   * (utile pour ne pas dupliquer une conversation formateur/étudiant)
   */
  async findSharedByUsers(id_utilisateur_a, id_utilisateur_b) {
    const [rows] = await pool.query(
      `
            SELECT
                pcA.id_conversation

            FROM participant_conversations pcA

            INNER JOIN participant_conversations pcB
                ON pcA.id_conversation = pcB.id_conversation

            WHERE pcA.id_utilisateur = ?
              AND pcB.id_utilisateur = ?

            LIMIT 1
            `,
      [id_utilisateur_a, id_utilisateur_b],
    );

    return rows[0] || null;
  }

  /**
   * Trouver une conversation partagée par deux utilisateurs dont le
   * sujet commence par un préfixe donné.
   *
   * Permet de dédoublonner les conversations automatiques par FORMATION :
   * un étudiant et un formateur partageant deux formations distinctes
   * obtiennent deux conversations distinctes (une par formation).
   *
   * Le préfixe doit déjà avoir ses caractères génériques LIKE échappés.
   */
  async findSharedByUsersAndSubjectPrefix(
    id_utilisateur_a,
    id_utilisateur_b,
    prefix,
  ) {
    const [rows] = await pool.query(
      `
            SELECT
                pcA.id_conversation

            FROM participant_conversations pcA

            INNER JOIN participant_conversations pcB
                ON pcA.id_conversation = pcB.id_conversation

            INNER JOIN conversations c
                ON pcA.id_conversation = c.id_conversation

            WHERE pcA.id_utilisateur = ?
              AND pcB.id_utilisateur = ?
              AND c.sujet LIKE ? ESCAPE '!'

            LIMIT 1
            `,
      [id_utilisateur_a, id_utilisateur_b, `${prefix}%`],
    );

    return rows[0] || null;
  }

  /**
   * Échapper les caractères génériques LIKE d'une chaîne (% et _).
   */
  escapeLike(value) {
    return String(value ?? "").replace(/[!%_]/g, (char) => `!${char}`);
  }
  /**
   * Ajouter un participant à une conversation
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO participant_conversations
            (
                id_conversation,
                id_utilisateur
            )
            VALUES (?, ?)
            `,
      [data.id_conversation, data.id_utilisateur],
    );

    return result.insertId;
  }
  /**
   * Supprimer un participant
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM participant_conversations
            WHERE id_participant = ?
            `,
      [id],
    );
    return result.affectedRows;
  }
}

export default new ConversationParticipantRepository();