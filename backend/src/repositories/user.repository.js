import pool from "../config/database.js";

class UserRepository {
    /**
     * Récupérer tous les utilisateurs
     */
    async findAll() {
        const [rows] = await pool.query(`
            SELECT
                u.id_utilisateur,
                u.nom,
                u.prenom,
                u.email,
                r.libelle AS role
            FROM utilisateurs u
            INNER JOIN roles r
                ON u.id_role = r.id_role
            ORDER BY u.id_utilisateur ASC
        `);
        return rows;
    }
    /**
     * Rechercher un utilisateur par son ID
     */
    async findById(id) {
        const [rows] = await pool.query(
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
            `,
            [id]
        );
        return rows[0] || null;
    }
    /**
     * Rechercher un utilisateur par email
     */
    async findByEmail(email) {
        const [rows] = await pool.query(
            `
            SELECT
                u.*,
                r.libelle AS role
            FROM utilisateurs u
            INNER JOIN roles r
                ON u.id_role = r.id_role
            WHERE u.email = ?
            `,
            [email]
        );

        return rows[0] || null;
    }
    /**
     * Ajouter un utilisateur
     */
    async create(data) {
        const [result] = await pool.query(
            `
            INSERT INTO utilisateurs
            (
                id_role,
                nom,
                prenom,
                email,
                mot_de_passe
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                data.id_role,
                data.nom,
                data.prenom,
                data.email,
                data.mot_de_passe
            ]
        );
        return result.insertId;
    }

    /**
     * Modifier un utilisateur (mise à jour partielle)
     *
     * Seules les colonnes fournies sont modifiées.
     * Le champ `mot_de_passe` doit être hashé avant cet appel.
     */
    async update(id, data) {
        const champsAutorises = ["id_role", "nom", "prenom", "email", "mot_de_passe"];
        const setClause = [];
        const valeurs = [];

        for (const champ of champsAutorises) {
            if (data[champ] !== undefined) {
                setClause.push(`${champ} = ?`);
                valeurs.push(data[champ]);
            }
        }

        if (setClause.length === 0) {
            return 0;
        }

        valeurs.push(id);

        const [result] = await pool.query(
            `
            UPDATE utilisateurs
            SET ${setClause.join(", ")}
            WHERE id_utilisateur = ?
            `,
            valeurs
        );

        return result.affectedRows;
    }

    /**
     * Rechercher un rôle par son identifiant
     */
    async findRoleById(id) {
        const [rows] = await pool.query(
            `
            SELECT id_role, libelle
            FROM roles
            WHERE id_role = ?
            `,
            [id]
        );
        return rows[0] || null;
    }
    /**
     * Supprimer un utilisateur
     */
    async delete(id) {
        const [result] = await pool.query(
            `
            DELETE FROM utilisateurs
            WHERE id_utilisateur = ?
            `,
            [id]
        );
        return result.affectedRows;
    }

}

export default new UserRepository();