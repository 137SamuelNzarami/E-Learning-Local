import pool from "../config/database.js";

class FormationRepository {
    /**
     * Toutes les formations
     */
    async findAll() {
        const [rows] = await pool.query(`
            SELECT
                f.id_formation,
                f.id_categorie,
                f.id_formateur,
                f.titre,
                f.description,
                f.statut,
                f.created_at,
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
                f.statut,
                f.created_at,
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
                description,
                statut
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                data.id_categorie,
                data.id_formateur,
                data.titre,
                data.description,
                data.statut ?? "BROUILLON"
            ]
        );
        return result.insertId;
    }
    /**
     * Publier / dépublier une formation
     */
    async updateStatut(id, statut) {
        const [result] = await pool.query(
            "UPDATE formations SET statut = ? WHERE id_formation = ?",
            [statut, id]
        );
        return result.affectedRows;
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

    /**
     * Suppression en cascade (transactionnel).
     *
     * Les clés étrangères sont en RESTRICT : on supprime donc explicitement
     * tous les descendants, du plus profond au plus proche :
     *
     * Chaîne pédagogique : reponses_etudiants -> tentatives -> reponses ->
     * questions -> quiz -> sous_sections -> sections -> chapitres.
     * Données étudiantes : progression_chapitres -> avis -> progressions ->
     * inscriptions. Puis la formation elle-même.
     */
    async deleteCascade(id) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            await conn.query(
                `DELETE re FROM reponses_etudiants re
                 JOIN tentatives t ON t.id_tentative = re.id_tentative
                 JOIN quiz q ON q.id_quiz = t.id_quiz
                 JOIN chapitres c ON c.id_chapitre = q.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query(
                `DELETE t FROM tentatives t
                 JOIN quiz q ON q.id_quiz = t.id_quiz
                 JOIN chapitres c ON c.id_chapitre = q.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query(
                `DELETE r FROM reponses r
                 JOIN questions qu ON qu.id_question = r.id_question
                 JOIN quiz q ON q.id_quiz = qu.id_quiz
                 JOIN chapitres c ON c.id_chapitre = q.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query(
                `DELETE qu FROM questions qu
                 JOIN quiz q ON q.id_quiz = qu.id_quiz
                 JOIN chapitres c ON c.id_chapitre = q.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query(
                `DELETE q FROM quiz q
                 JOIN chapitres c ON c.id_chapitre = q.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query(
                `DELETE ss FROM sous_sections ss
                 JOIN sections s ON s.id_section = ss.id_section
                 JOIN chapitres c ON c.id_chapitre = s.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query(
                `DELETE s FROM sections s
                 JOIN chapitres c ON c.id_chapitre = s.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query(
                `DELETE pc FROM progression_chapitres pc
                 JOIN chapitres c ON c.id_chapitre = pc.id_chapitre
                 WHERE c.id_formation = ?`,
                [id]
            );

            await conn.query("DELETE FROM chapitres WHERE id_formation = ?", [id]);

            await conn.query("DELETE FROM avis WHERE id_formation = ?", [id]);
            await conn.query("DELETE FROM progressions WHERE id_formation = ?", [id]);
            await conn.query("DELETE FROM inscriptions WHERE id_formation = ?", [id]);
            await conn.query("DELETE FROM formations WHERE id_formation = ?", [id]);

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

}

export default new FormationRepository();