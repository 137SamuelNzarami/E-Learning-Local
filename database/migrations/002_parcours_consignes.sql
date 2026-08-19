-- ============================================================
-- Migration 002 : descriptions de parcours + consignes de devoir
--
--  1. modules.description, chapitres.description, lecons.description
--  2. devoirs.instructions + devoirs.fichier_consignes
--  3. tentatives.created_at, soumissions.created_at (dates)
--  4. progression_lecons : complétion unitaire des leçons
--
-- Exécution :
--   mysql -u root elearning < database/migrations/002_parcours_consignes.sql
-- ============================================================

ALTER TABLE modules
  ADD COLUMN description TEXT NULL AFTER titre;

ALTER TABLE chapitres
  ADD COLUMN description TEXT NULL AFTER titre;

ALTER TABLE lecons
  ADD COLUMN description TEXT NULL AFTER titre;

ALTER TABLE devoirs
  ADD COLUMN instructions TEXT NULL AFTER titre,
  ADD COLUMN fichier_consignes VARCHAR(255) NULL AFTER instructions;

ALTER TABLE tentatives
  ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER note;

ALTER TABLE soumissions
  ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER note;

CREATE TABLE IF NOT EXISTS progression_lecons(
  id_progression_lecon INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_lecon INT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progression_lecon (id_utilisateur, id_lecon),
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
  FOREIGN KEY(id_lecon) REFERENCES lecons(id_lecon)
);
