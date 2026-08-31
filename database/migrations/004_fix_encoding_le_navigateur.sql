-- ============================================================
-- Migration 004 : correction d'encodage de sous_sections.id=1
--
--  Le contenu de la première sous-section ("Le navigateur") a été
--  inséré avec un jeu de caractères latin1 : les accents (à, é)
--  ont été remplacés par le caractère de remplacement U+FFFD (�).
--  On rétablit ici le texte français correct en UTF-8.
--
-- Exécution :
--   mysql -u root --default-character-set=utf8mb4 elearningdb < database/migrations/004_fix_encoding_le_navigateur.sql
-- ============================================================

UPDATE sous_sections
SET contenu = '<h2>Le navigateur</h2><p>Un navigateur permet de demander des ressources à un serveur et de présenter les pages web à l’utilisateur.</p><p>Les navigateurs modernes interprètent notamment HTML, CSS et JavaScript.</p>'
WHERE id_sous_section = 1;