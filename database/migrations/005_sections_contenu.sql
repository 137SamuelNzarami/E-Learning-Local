-- ============================================================
-- Migration 005 : contenu riche des sections (RichTextEditor)
--
--  Aligne le modèle pédagogique :
--    SOUS-SECTION → titre + contenu (rich text)
--    SECTION      → titre + contenu (rich text)
--
--  La colonne description est conservée pour compatibilité.
--
-- Exécution :
--   mysql -u root --default-character-set=utf8mb4 elearningdb < database/migrations/005_sections_contenu.sql
-- ============================================================

ALTER TABLE sections
  ADD COLUMN contenu LONGTEXT NULL AFTER description;