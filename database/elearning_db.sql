-- E-LEARNING DATABASE
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
 FOREIGN KEY(id_categorie) REFERENCES categories(id_categorie),
 FOREIGN KEY(id_formateur) REFERENCES utilisateurs(id_utilisateur)
);

CREATE TABLE modules(
 id_module INT AUTO_INCREMENT PRIMARY KEY,
 id_formation INT NOT NULL,
 titre VARCHAR(150),
 description TEXT,
 FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
);

CREATE TABLE chapitres(
 id_chapitre INT AUTO_INCREMENT PRIMARY KEY,
 id_module INT NOT NULL,
 titre VARCHAR(150),
 description TEXT,
 FOREIGN KEY(id_module) REFERENCES modules(id_module)
);

CREATE TABLE lecons(
 id_lecon INT AUTO_INCREMENT PRIMARY KEY,
 id_chapitre INT NOT NULL,
 titre VARCHAR(200),
 description TEXT,
 contenu LONGTEXT,
 FOREIGN KEY(id_chapitre) REFERENCES chapitres(id_chapitre)
);

CREATE TABLE videos(
 id_video INT AUTO_INCREMENT PRIMARY KEY,
 id_lecon INT NOT NULL,
 titre VARCHAR(200),
 chemin_video VARCHAR(255),
 FOREIGN KEY(id_lecon) REFERENCES lecons(id_lecon)
);

CREATE TABLE documents(
 id_document INT AUTO_INCREMENT PRIMARY KEY,
 id_lecon INT NOT NULL,
 titre VARCHAR(200),
 chemin_document VARCHAR(255),
 FOREIGN KEY(id_lecon) REFERENCES lecons(id_lecon)
);

CREATE TABLE inscriptions(
 id_inscription INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_formation INT NOT NULL,
 date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
);

CREATE TABLE progressions(
 id_progression INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_formation INT NOT NULL,
 pourcentage DECIMAL(5,2) DEFAULT 0,
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
);

CREATE TABLE quiz(
 id_quiz INT AUTO_INCREMENT PRIMARY KEY,
 id_lecon INT NOT NULL,
 titre VARCHAR(200),
 FOREIGN KEY(id_lecon) REFERENCES lecons(id_lecon)
);

CREATE TABLE questions(
 id_question INT AUTO_INCREMENT PRIMARY KEY,
 id_quiz INT NOT NULL,
 enonce TEXT,
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
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_quiz) REFERENCES quiz(id_quiz)
);

CREATE TABLE reponses_etudiants(
 id_reponse_etudiant INT AUTO_INCREMENT PRIMARY KEY,
 id_tentative INT NOT NULL,
 id_question INT NOT NULL,
 id_reponse INT NOT NULL,
 FOREIGN KEY(id_tentative) REFERENCES tentatives(id_tentative),
 FOREIGN KEY(id_question) REFERENCES questions(id_question),
 FOREIGN KEY(id_reponse) REFERENCES reponses(id_reponse)
);

CREATE TABLE devoirs(
 id_devoir INT AUTO_INCREMENT PRIMARY KEY,
 id_lecon INT NOT NULL,
 titre VARCHAR(200),
 instructions TEXT,
 fichier_consignes VARCHAR(255),
 FOREIGN KEY(id_lecon) REFERENCES lecons(id_lecon)
);

CREATE TABLE soumissions(
 id_soumission INT AUTO_INCREMENT PRIMARY KEY,
 id_devoir INT NOT NULL,
 id_utilisateur INT NOT NULL,
 fichier VARCHAR(255),
 note DECIMAL(5,2),
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_devoir) REFERENCES devoirs(id_devoir),
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

CREATE TABLE progression_lecons(
 id_progression_lecon INT AUTO_INCREMENT PRIMARY KEY,
 id_utilisateur INT NOT NULL,
 id_lecon INT NOT NULL,
 completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_progression_lecon (id_utilisateur, id_lecon),
 FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
 FOREIGN KEY(id_lecon) REFERENCES lecons(id_lecon)
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
