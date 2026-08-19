import pool from "../config/database.js";

class CategoryRepository {
  /**
   * Récupérer toutes les catégories
   */
  async findAll() {
    const [rows] = await pool.query(`
            SELECT
                id_categorie,
                nom_categorie
            FROM categories
            ORDER BY nom_categorie ASC
        `);
    return rows;
  }
  /**
   * Récupérer une catégorie par son ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT
                id_categorie,
                nom_categorie
            FROM categories
            WHERE id_categorie = ?
            `,
      [id],
    );
    return rows[0] || null;
  }
  /**
   * Rechercher une catégorie par son nom
   */
  async findByName(nom) {
    const [rows] = await pool.query(
      `
            SELECT *
            FROM categories
            WHERE nom_categorie = ?
            `,
      [nom],
    );
    return rows[0] || null;
  }
  /**
   * Créer une catégorie
   */
  async create(data) {
    const [result] = await pool.query(
      `
            INSERT INTO categories
            (nom_categorie)
            VALUES (?)
            `,
      [data.nom_categorie],
    );
    return result.insertId;
  }
  /**
   * Modifier une catégorie
   */
  async update(id, data) {
    await pool.query(
      `
        UPDATE categories
        SET
            nom_categorie = ?
        WHERE id_categorie = ?
        `,
      [data.nom_categorie, id],
    );

    return true;
  }
  /**
   * Supprimer une catégorie
   */
  async delete(id) {
    await pool.query(
      `
            DELETE FROM categories
            WHERE id_categorie = ?
            `,
      [id],
    );
    return true;
  }
}

export default new CategoryRepository();
