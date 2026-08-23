-- E-LEARNING DATABASE (schéma de référence — nouvelle architecture pédagogique)
-- Modèle : Formation → Chapitre → Section → Sous-section (rich text)
--          Quiz de fin de chapitre (QCM auto-corrigé + questions libres)
--
-- NB : les anciennes tables (modules, lecons, videos, documents,
-- devoirs, soumissions, progression_lecons) ne font plus partie du
-- schéma cible. Sur une base existante, elles restent conservées
-- temporairement par la migration 003 (données historiques).
DROP DATABASE IF EXISTS elearningdb;
CREATE DATABASE elearningdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elearningdb;

CREATE TABLE roles(
 id_role INT AUTO_INCREMENT PRIMARY KEY,
 libelle VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles(libelle) VALUES ('Administrateur'),('Formateur'),('Etudiant');

CREATE TABLE utilisateurs(
 id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
 id_role INT NOT NULL,
 nom VARCHAR(100),
 prenom VARCHAR(100),
 email VARCHAR(150) UNIQUE,
 mot_de_passe VARCHAR(255),
 FOREIGN KEY(id_role) REFERENCES roles(id_role)
);

CREATE TABLE categories(
 id_categorie INT AUTO_INCREMENT PRIMARY KEY,
 nom_categorie VARCHAR(100) UNIQUE
);

CREATE TABLE formations(
 id_formation INT AUTO_INCREMENT PRIMARY KEY,
 id_categorie INT NOT NULL,
 id_formateur INT NOT NULL,
 titre VARCHAR(200),
 description TEXT,
 statut ENUM('BROUILLON','PUBLIEE') NOT NULL DEFAULT 'PUBLIEE',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_categorie) REFERENCES categories(id_categorie),
 FOREIGN KEY(id_formateur) REFERENCES utilisateurs(id_utilisateur)
);

CREATE TABLE chapitres(
 id_chapitre INT AUTO_INCREMENT PRIMARY KEY,
 id_formation INT NOT NULL,
 titre VARCHAR(150),
 description TEXT,
 ordre INT NOT NULL DEFAULT 0,
 INDEX idx_chapitres_formation_ordre (id_formation, ordre),
 FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
);

CREATE TABLE sections(
 id_section INT AUTO_INCREMENT PRIMARY KEY,
 id_chapitre INT NOT NULL,
 titre VARCHAR(200),
 description TEXT NULL,
 ordre INT NOT NULL DEFAULT 0,
 INDEX idx_sections_chapitre (id_chapitre, ordre),
 FOREIGN KEY(id_chapitre) REFERENCES chapitres(id_chapitre) ON DELETE CASCADE
);

CREATE TABLE sous_sections(
 id_sous_section INT AUTO_INCREMENT PRIMARY KEY,
 id_section INT NOT NULL,
 titre VARCHAR(200),
 contenu LONGTEXT NULL,
 ordre INT NOT NULL DEFAULT 0,
 INDEX idx_sous_sections_section (id_section, ordre),
 FOREIGN KEY(id_section) REFERENCES sections(id_section) ON DELETE CASCADE
);

CREATE TABLE inscriptions(
 id_inscription INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_formation INT NOT NULL,
 date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_inscription (id_utilisateur, id_formation),
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
);

CREATE TABLE progressions(
 id_progression INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_formation INT NOT NULL,
 pourcentage DECIMAL(5,2) DEFAULT 0,
 UNIQUE KEY uq_progression (id_utilisateur, id_formation),
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
);

CREATE TABLE quiz(
 id_quiz INT AUTO_INCREMENT PRIMARY KEY,
 id_chapitre INT NOT NULL,
 titre VARCHAR(200),
 score_reussite DECIMAL(5,2) NOT NULL DEFAULT 50,
 FOREIGN KEY(id_chapitre) REFERENCES chapitres(id_chapitre)
);

CREATE TABLE questions(
 id_question INT AUTO_INCREMENT PRIMARY KEY,
 id_quiz INT NOT NULL,
 enonce TEXT,
 type ENUM('QCM','LIBRE') NOT NULL DEFAULT 'QCM',
 points INT NOT NULL DEFAULT 1,
 FOREIGN KEY(id_quiz) REFERENCES quiz(id_quiz)
);

CREATE TABLE reponses(
 id_reponse INT AUTO_INCREMENT PRIMARY KEY,
 id_question INT NOT NULL,
 contenu TEXT,
 est_correcte BOOLEAN DEFAULT FALSE,
 FOREIGN KEY(id_question) REFERENCES questions(id_question)
);

CREATE TABLE tentatives(
 id_tentative INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_quiz INT NOT NULL,
 note DECIMAL(5,2),
 statut ENUM('EN_COURS','SOUMISE','A_CORRIGER','REUSSIE','ECHOUEE') NOT NULL DEFAULT 'EN_COURS',
 date_soumission DATETIME NULL,
 date_correction DATETIME NULL,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_quiz) REFERENCES quiz(id_quiz)
);

CREATE TABLE reponses_etudiants(
 id_reponse_etudiant INT AUTO_INCREMENT PRIMARY KEY,
 id_tentative INT NOT NULL,
 id_question INT NOT NULL,
 id_reponse INT NULL DEFAULT NULL,
 contenu TEXT NULL,
 INDEX idx_reponses_etu_tentative_question (id_tentative, id_question),
 FOREIGN KEY(id_tentative) REFERENCES tentatives(id_tentative),
 FOREIGN KEY(id_question) REFERENCES questions(id_question),
 FOREIGN KEY(id_reponse) REFERENCES reponses(id_reponse)
);

CREATE TABLE progression_chapitres(
 id_progression_chapitre INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_chapitre INT NOT NULL,
 completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_progression_chapitre (id_utilisateur, id_chapitre),
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_chapitre) REFERENCES chapitres(id_chapitre) ON DELETE CASCADE
);

CREATE TABLE avis(
 id_avis INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_formation INT NOT NULL,
 note INT,
 commentaire TEXT,
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
);

CREATE TABLE conversations(
 id_conversation INT AUTO_INCREMENT PRIMARY KEY,
 sujet VARCHAR(200),
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participant_conversations(
 id_participant INT AUTO_INCREMENT PRIMARY KEY,
 id_conversation INT NOT NULL,
 id_utilisateur INT NOT NULL,
 FOREIGN KEY(id_conversation) REFERENCES conversations(id_conversation),
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

CREATE TABLE messages(
 id_message INT AUTO_INCREMENT PRIMARY KEY,
 id_conversation INT NOT NULL,
 id_expediteur INT NOT NULL,
 contenu TEXT,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_conversation) REFERENCES conversations(id_conversation),
 FOREIGN KEY(id_expediteur) REFERENCES utilisateurs(id_utilisateur)
);

CREATE TABLE notifications(
 id_notification INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 titre VARCHAR(150),
 contenu TEXT,
 lu TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);
