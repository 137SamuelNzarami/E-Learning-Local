import pool from "../config/database.js";

class AuthRepository {
  /**
   * Récupérer l'identifiant d'un rôle par son libellé
   */
  async findRoleIdByLabel(libelle) {
    const [rows] = await pool.execute(
      `
        SELECT id_role
        FROM roles
        WHERE libelle = ?
        LIMIT 1
        `,
      [libelle],
    );

    return rows[0]?.id_role || null;
  }

  /**
   * Rechercher un utilisateur par son email
   */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      `
            SELECT
                u.id_utilisateur,
                u.id_role,
                u.nom,
                u.prenom,
                u.email,
                u.mot_de_passe,
                r.libelle AS role
            FROM utilisateurs u
            INNER JOIN roles r
                ON u.id_role = r.id_role
            WHERE u.email = ?
            LIMIT 1
            `,
      [email],
    );
    return rows[0] || null;
  }
  /**
   * Rechercher un utilisateur par son identifiant
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `
            SELECT
                u.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                r.libelle AS role
            FROM utilisateurs u
            INNER JOIN roles r
                ON u.id_role = r.id_role
            WHERE u.id_utilisateur = ?
            LIMIT 1
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Rechercher un utilisateur par son identifiant,
   * y compris le mot de passe hashé (uniquement pour la vérification).
   */
  async findByIdWithPassword(id) {
    const [rows] = await pool.execute(
      `
            SELECT
                u.id_utilisateur,
                u.mot_de_passe
            FROM utilisateurs u
            WHERE u.id_utilisateur = ?
            LIMIT 1
            `,
      [id],
    );

    return rows[0] || null;
  }
  /**
   * Mettre à jour le mot de passe hashé d'un utilisateur
   */
  async updatePassword(id, mot_de_passe) {
    const [result] = await pool.execute(
      `
            UPDATE utilisateurs
            SET mot_de_passe = ?
            WHERE id_utilisateur = ?
            `,
      [mot_de_passe, id],
    );

    return result.affectedRows;
  }
  /**
   * Vérifier qu'un email n'existe pas déjà
   */
  async emailExists(email) {
    const [rows] = await pool.execute(
      `
            SELECT id_utilisateur
            FROM utilisateurs
            WHERE email = ?
            LIMIT 1
            `,
      [email],
    );
    return rows.length > 0;
  }
  /**
   * Créer un nouvel utilisateur
   */
  async create(user) {
    const [result] = await pool.execute(
      `
            INSERT INTO utilisateurs
            (
                id_role,
                nom,
                prenom,
                email,
                mot_de_passe
            )
            VALUES (?,?,?,?,?)
            `,
      [user.id_role, user.nom, user.prenom, user.email, user.mot_de_passe],
    );
    return result.insertId;
  }
}
export default new AuthRepository();
