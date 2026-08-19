import pool from "../config/database.js";

class SubmissionRepository {
  /**
   * Récupérer toutes les soumissions
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                s.id_soumission,
                s.id_devoir,
                d.titre AS devoir,

                s.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                s.fichier,
                s.note

            FROM soumissions s

            INNER JOIN devoirs d
                ON s.id_devoir = d.id_devoir

            INNER JOIN utilisateurs u
                ON s.id_utilisateur = u.id_utilisateur

            ORDER BY s.id_soumission DESC
        `);

    return rows;
  }

  /**
   * Récupérer une soumission par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                s.id_soumission,
                s.id_devoir,
                d.titre AS devoir,

                s.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                s.fichier,
                s.note

            FROM soumissions s

            INNER JOIN devoirs d
                ON s.id_devoir = d.id_devoir

            INNER JOIN utilisateurs u
                ON s.id_utilisateur = u.id_utilisateur

            WHERE s.id_soumission = ?
            `,
      [id],
    );

    return rows[0] || null;
  }

  /**
   * Récupérer les soumissions d'un devoir
   */
  async findByAssignmentId(id_devoir) {
    const [rows] = await pool.query(
      `
            SELECT
                s.id_soumission,
                s.id_devoir,
                d.titre AS devoir,

                s.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                s.fichier,
                s.note

            FROM soumissions s

            INNER JOIN devoirs d
                ON s.id_devoir = d.id_devoir

            INNER JOIN utilisateurs u
                ON s.id_utilisateur = u.id_utilisateur

            WHERE s.id_devoir = ?

            ORDER BY s.id_soumission DESC
            `,
      [id_devoir],
    );

    return rows;
  }

  /**
   * Récupérer les soumissions d'un utilisateur
   */
  async findByUserId(id_utilisateur) {
    const [rows] = await pool.query(
      `
            SELECT
                s.id_soumission,
                s.id_devoir,
                d.titre AS devoir,

                s.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,

                s.fichier,
                s.note

            FROM soumissions s

            INNER JOIN devoirs d
                ON s.id_devoir = d.id_devoir

            INNER JOIN utilisateurs u
                ON s.id_utilisateur = u.id_utilisateur

            WHERE s.id_utilisateur = ?

            ORDER BY s.id_soumission DESC
            `,
      [id_utilisateur],
    );

    return rows;
  }

  /**
   * Rechercher une soumission par son chemin (contrôle d'accès aux fichiers)
   */
  async findByChemin(chemin) {
    const [rows] = await pool.query(
      `
            SELECT
                s.id_soumission,
                s.id_devoir,
                s.id_utilisateur,
                s.fichier,

                m.id_formation,
                f.id_formateur

            FROM soumissions s

            INNER JOIN devoirs d
                ON s.id_devoir = d.id_devoir

            INNER JOIN lecons l
                ON d.id_lecon = l.id_lecon

            INNER JOIN chapitres c
                ON l.id_chapitre = c.id_chapitre

            INNER JOIN modules m
                ON c.id_module = m.id_module

            INNER JOIN formations f
                ON m.id_formation = f.id_formation

            WHERE s.fichier = ?

            LIMIT 1
            `,
      [chemin],
    );

    return rows[0] || null;
  }

  /**
   * Vérifier si un utilisateur a déjà soumis un devoir
   */
  async findByUserAndAssignment(id_utilisateur, id_devoir) {
    const [rows] = await pool.query(
      `
            SELECT
                id_soumission,
                id_devoir,
                id_utilisateur,
                fichier,
                note

            FROM soumissions

            WHERE id_utilisateur = ?
              AND id_devoir = ?
            `,
      [id_utilisateur, id_devoir],
    );

    return rows[0] || null;
  }

  /**
   * Créer une soumission
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO soumissions
            (
                id_devoir,
                id_utilisateur,
                fichier,
                note
            )
            VALUES (?, ?, ?, ?)
            `,
      [data.id_devoir, data.id_utilisateur, data.fichier, data.note ?? null],
    );

    return result.insertId;
  }

  /**
   * Modifier une soumission
   *
   * Seuls les champs réellement fournis sont modifiés : une mise à jour
   * partielle (ex: note uniquement) ne doit jamais écraser le fichier
   * déposé, ni la note existante.
   */
  async update(id, data) {
    const sets = [];
    const values = [];

    if (data.id_devoir !== undefined) {
      sets.push("id_devoir = ?");
      values.push(data.id_devoir);
    }
    if (data.id_utilisateur !== undefined) {
      sets.push("id_utilisateur = ?");
      values.push(data.id_utilisateur);
    }
    if (data.fichier !== undefined) {
      sets.push("fichier = ?");
      values.push(data.fichier);
    }
    if (data.note !== undefined) {
      sets.push("note = ?");
      values.push(data.note);
    }

    if (sets.length === 0) {
      return 0;
    }

    values.push(id);

    const [result] = await pool.query(
      `
            UPDATE soumissions
            SET ${sets.join(", ")}
            WHERE id_soumission = ?
            `,
      values,
    );

    return result.affectedRows;
  }

  /**
   * Supprimer une soumission
   */
  async delete(id) {
    const [result] = await pool.query(
      `
            DELETE FROM soumissions
            WHERE id_soumission = ?
            `,
      [id],
    );

    return result.affectedRows;
  }
}

export default new SubmissionRepository();