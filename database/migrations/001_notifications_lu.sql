-- ============================================================
-- Migration 001 : Notifications « marquer comme lue »
--
-- Ajoute la colonne `lu` à la table `notifications`.
-- Valeur par défaut : 0 (non lue).
--
-- Exécution :
--   mysql -u root elearningdb < database/migrations/001_notifications_lu.sql
-- ============================================================

ALTER TABLE notifications
  ADD COLUMN lu TINYINT(1) NOT NULL DEFAULT 0;
