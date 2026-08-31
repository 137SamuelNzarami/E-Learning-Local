-- ============================================================
-- Migration 003 : NOUVELLE ARCHITECTURE PÉDAGOGIQUE
--
-- Ancien modèle : Formation → Module → Chapitre → Leçon
--                 (+ Vidéos/Documents/Quiz/Devoirs sur la leçon)
-- Nouveau modèle : Formation → Chapitre → Section → Sous-section
--                 (contenu pédagogique = rich text en base)
--                 Quiz de fin de chapitre (QCM auto-corrigé
--                 + questions libres corrigées par le formateur)
--
-- Contenu :
--   1. formations.statut (BROUILLON / PUBLIEE) + created_at
--   2. chapitres reparentés aux formations (id_module supprimé, ordre)
--   3. sections + sous_sections (rich text) + migration des leçons
--   4. quiz rattaché au chapitre + score_reussite configurable
--   5. questions.type (QCM / LIBRE) + points
--   6. tentatives.statut + date_soumission + date_correction
--   7. reponses_etudiants.contenu (réponses libres), id_reponse nullable
--   8. progression_chapitres (complétion des chapitres sans quiz)
--
-- Tables devenues OBSOLÈTES mais CONSERVÉES temporairement
-- (données historiques / fichiers uploadés existants) :
--   modules, lecons, videos, documents, devoirs, soumissions,
--   progression_lecons.
-- Elles ne sont plus exposées par l'API et ne reçoivent plus
-- d'écritures. Suppression prévue après validation complète.
--
-- Exécution :
--   mysql -u root elearningdb < database/migrations/003_nouvelle_architecture_pedagogique.sql
--
-- NB : les FOREIGN KEYS restent actives pendant toute la migration.
-- ============================================================

USE elearningdb;

-- ------------------------------------------------------------
-- 1) FORMATIONS : statut de publication
-- ------------------------------------------------------------
ALTER TABLE formations
  ADD COLUMN statut ENUM('BROUILLON','PUBLIEE') NOT NULL DEFAULT 'PUBLIEE' AFTER description,
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER statut;

-- Les formations existantes restent publiées (comportement antérieur conservé).

-- ------------------------------------------------------------
-- 2) CHAPITRES : rattachement direct à la formation
-- ------------------------------------------------------------
ALTER TABLE chapitres
  ADD COLUMN id_formation INT NULL AFTER id_chapitre,
  ADD COLUMN ordre INT NOT NULL DEFAULT 0 AFTER description;

UPDATE chapitres c
INNER JOIN modules m ON m.id_module = c.id_module
SET c.id_formation = m.id_formation;

-- Ordre initial : position du chapitre dans sa formation
UPDATE chapitres c
INNER JOIN (
    SELECT id_chapitre,
           ROW_NUMBER() OVER (PARTITION BY id_formation ORDER BY id_chapitre) AS rn
    FROM chapitres
) t ON t.id_chapitre = c.id_chapitre
SET c.ordre = t.rn;

-- Toutes les lignes ont un module valide (FK) => id_formation renseignée
ALTER TABLE chapitres MODIFY id_formation INT NOT NULL;

ALTER TABLE chapitres DROP FOREIGN KEY chapitres_ibfk_1;
ALTER TABLE chapitres DROP COLUMN id_module;
ALTER TABLE chapitres
  ADD CONSTRAINT fk_chapitres_formation
  FOREIGN KEY (id_formation) REFERENCES formations(id_formation),
  ADD INDEX idx_chapitres_formation_ordre (id_formation, ordre);

-- ------------------------------------------------------------
-- 3) SECTIONS + SOUS-SECTIONS (rich text) + reprise des leçons
-- ------------------------------------------------------------
CREATE TABLE sections(
  id_section INT AUTO_INCREMENT PRIMARY KEY,
  id_chapitre INT NOT NULL,
  titre VARCHAR(200) NULL,
  description TEXT NULL,
  ordre INT NOT NULL DEFAULT 0,
  INDEX idx_sections_chapitre (id_chapitre, ordre),
  CONSTRAINT fk_sections_chapitre
    FOREIGN KEY (id_chapitre) REFERENCES chapitres(id_chapitre)
    ON DELETE CASCADE
);

CREATE TABLE sous_sections(
  id_sous_section INT AUTO_INCREMENT PRIMARY KEY,
  id_section INT NOT NULL,
  titre VARCHAR(200) NULL,
  contenu LONGTEXT NULL,
  ordre INT NOT NULL DEFAULT 0,
  INDEX idx_sous_sections_section (id_section, ordre),
  CONSTRAINT fk_sous_sections_section
    FOREIGN KEY (id_section) REFERENCES sections(id_section)
    ON DELETE CASCADE
);

-- Reprise des leçons existantes :
--   lecon -> section (titre conservé, ordre relatif au chapitre)
--   lecon avec contenu -> sous-section "Contenu" (rich text migré)
INSERT INTO sections (id_chapitre, titre, description, ordre)
SELECT l.id_chapitre, l.titre, l.description,
       ROW_NUMBER() OVER (PARTITION BY l.id_chapitre ORDER BY l.id_lecon)
FROM lecons l;

INSERT INTO sous_sections (id_section, titre, contenu, ordre)
SELECT s.id_section, 'Contenu', l.contenu, 1
FROM lecons l
INNER JOIN sections s ON s.id_chapitre = l.id_chapitre AND s.titre <=> l.titre
WHERE l.contenu IS NOT NULL AND l.contenu <> '';

-- ------------------------------------------------------------
-- 4) QUIZ : évaluation de FIN DE CHAPITRE
-- ------------------------------------------------------------
ALTER TABLE quiz
  ADD COLUMN id_chapitre INT NULL AFTER id_quiz,
  ADD COLUMN score_reussite DECIMAL(5,2) NOT NULL DEFAULT 50 AFTER titre;

UPDATE quiz q
INNER JOIN lecons l ON l.id_lecon = q.id_lecon
SET q.id_chapitre = l.id_chapitre;

ALTER TABLE quiz MODIFY id_chapitre INT NOT NULL;

ALTER TABLE quiz DROP FOREIGN KEY quiz_ibfk_1;
ALTER TABLE quiz DROP COLUMN id_lecon;
ALTER TABLE quiz
  ADD CONSTRAINT fk_quiz_chapitre
  FOREIGN KEY (id_chapitre) REFERENCES chapitres(id_chapitre);

-- NB unicité : la règle « un quiz par chapitre » est appliquée au niveau
-- du service (QuizService.createQuiz). Aucune contrainte UNIQUE en base :
-- des doublons hérités de l'ancien modèle (1 leçon = 1 quiz) existent
-- dans les données historiques et ne doivent pas être détruits.

-- ------------------------------------------------------------
-- 5) QUESTIONS : QCM uniquement (auto-corrigé)
-- ------------------------------------------------------------
ALTER TABLE questions
  ADD COLUMN type ENUM('QCM') NOT NULL DEFAULT 'QCM' AFTER enonce,
  ADD COLUMN points INT NOT NULL DEFAULT 1 AFTER type;

-- ------------------------------------------------------------
-- 6) TENTATIVES : cycle de vie complet
-- ------------------------------------------------------------
ALTER TABLE tentatives
  ADD COLUMN statut ENUM('EN_COURS','SOUMISE','REUSSIE','ECHOUEE')
    NOT NULL DEFAULT 'EN_COURS' AFTER note,
  ADD COLUMN date_soumission DATETIME NULL AFTER statut;

-- Migration des tentatives historiques (note unique >= 50 dans l'ancien modèle)
UPDATE tentatives
SET statut = CASE
        WHEN note IS NULL THEN 'EN_COURS'
        WHEN note >= 50 THEN 'REUSSIE'
        ELSE 'ECHOUEE'
     END,
     date_soumission = created_at;

-- ------------------------------------------------------------
-- 7) RÉPONSES ÉTUDIANTS : QCM uniquement
-- ------------------------------------------------------------
-- id_reponse nullable pour compatibilité (aucune question libre en produit).
ALTER TABLE reponses_etudiants MODIFY id_reponse INT NULL DEFAULT NULL;
ALTER TABLE reponses_etudiants ADD INDEX idx_reponses_etu_tentative_question (id_tentative, id_question);

-- ------------------------------------------------------------
-- 8) PROGRESSION DES CHAPITRES (source de vérité parcours)
-- ------------------------------------------------------------
CREATE TABLE progression_chapitres(
  id_progression_chapitre INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_chapitre INT NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progression_chapitre (id_utilisateur, id_chapitre),
  CONSTRAINT fk_prog_chap_utilisateur
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
  CONSTRAINT fk_prog_chap_chapitre
    FOREIGN KEY (id_chapitre) REFERENCES chapitres(id_chapitre)
    ON DELETE CASCADE
);
