import pool from "../config/database.js";

class FormationRepository {
    /**
     * Toutes les formations
     */
    async findAll() {
        const [rows] = await pool.query(`
            SELECT
                f.id_formation,
                f.titre,
                f.description,
                c.nom_categorie,
                u.nom,
                u.prenom
            FROM formations f
            INNER JOIN categories c
                ON f.id_categorie = c.id_categorie
            INNER JOIN utilisateurs u
                ON f.id_formateur = u.id_utilisateur
            ORDER BY f.id_formation DESC
        `);
        return rows;
    }
    /**
     * Formation par ID
     */
    async findById(id) {
        const [rows] = await pool.query(
            `
            SELECT
                f.id_formation,
                f.id_categorie,
                f.id_formateur,
                f.titre,
                f.description,
                c.nom_categorie,
                u.nom,
                u.prenom
            FROM formations f
            INNER JOIN categories c
                ON f.id_categorie = c.id_categorie
            INNER JOIN utilisateurs u
                ON f.id_formateur = u.id_utilisateur
            WHERE f.id_formation = ?
            `,
            [id]
        );
        return rows[0] || null;
    }
    /**
     * Rechercher par titre
     */
    async findByTitle(titre) {
        const [rows] = await pool.query(
            `
            SELECT *
            FROM formations
            WHERE titre = ?
            `,
            [titre]
        );
        return rows[0] || null;
    }
    /**
     * Création
     */
    async create(data) {
        const [result] = await pool.query(
            `
            INSERT INTO formations
            (
                id_categorie,
                id_formateur,
                titre,
                description
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                data.id_categorie,
                data.id_formateur,
                data.titre,
                data.description
            ]
        );
        return result.insertId;
    }
    /**
     * Mise à jour
     */
    async update(id, data) {

        const [result] = await pool.query(
            `
            UPDATE formations
            SET
                id_categorie = ?,
                id_formateur = ?,
                titre = ?,
                description = ?
            WHERE id_formation = ?
            `,
            [
                data.id_categorie,
                data.id_formateur,
                data.titre,
                data.description,
                id
            ]
        );
        return result.affectedRows;
    }
    /**
     * Suppression
     */
    async delete(id) {
        const [result] = await pool.query(
            `
            DELETE FROM formations
            WHERE id_formation = ?
            `,
            [id]
        );
        return result.affectedRows;
    }

}

export default new FormationRepository();