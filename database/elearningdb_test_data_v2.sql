-- ============================================================
-- E-LEARNING DATABASE - JEU DE DONNEES DE TEST COMPLET
-- ============================================================
-- Usage:
--   1) Ouvrir phpMyAdmin
--   2) Onglet SQL
--   3) Coller/importer ce fichier
--   4) Exécuter
--
-- IMPORTANT:
-- Ce script recrée entièrement elearningdb.
-- Aucun TRUNCATE n'est utilisé: cela évite l'erreur MySQL #1701
-- liée aux clés étrangères.
--
-- Architecture:
-- Formation -> Chapitre -> Section -> Sous-section
-- Quiz de fin de chapitre -> Tentatives -> Réponses étudiants
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS elearningdb;

CREATE DATABASE elearningdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elearningdb;

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE roles(
  id_role INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE utilisateurs(
  id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
  id_role INT NOT NULL,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  mot_de_passe VARCHAR(255),
  FOREIGN KEY(id_role) REFERENCES roles(id_role)
) ENGINE=InnoDB;

CREATE TABLE categories(
  id_categorie INT AUTO_INCREMENT PRIMARY KEY,
  nom_categorie VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE chapitres(
  id_chapitre INT AUTO_INCREMENT PRIMARY KEY,
  id_formation INT NOT NULL,
  titre VARCHAR(150),
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  INDEX idx_chapitres_formation_ordre (id_formation, ordre),
  FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
) ENGINE=InnoDB;

CREATE TABLE sections(
  id_section INT AUTO_INCREMENT PRIMARY KEY,
  id_chapitre INT NOT NULL,
  titre VARCHAR(200),
  description TEXT NULL,
  ordre INT NOT NULL DEFAULT 0,
  INDEX idx_sections_chapitre (id_chapitre, ordre),
  FOREIGN KEY(id_chapitre) REFERENCES chapitres(id_chapitre) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sous_sections(
  id_sous_section INT AUTO_INCREMENT PRIMARY KEY,
  id_section INT NOT NULL,
  titre VARCHAR(200),
  contenu LONGTEXT NULL,
  ordre INT NOT NULL DEFAULT 0,
  INDEX idx_sous_sections_section (id_section, ordre),
  FOREIGN KEY(id_section) REFERENCES sections(id_section) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inscriptions(
  id_inscription INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_formation INT NOT NULL,
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inscription (id_utilisateur, id_formation),
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
  FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
) ENGINE=InnoDB;

CREATE TABLE progressions(
  id_progression INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_formation INT NOT NULL,
  pourcentage DECIMAL(5,2) DEFAULT 0,
  UNIQUE KEY uq_progression (id_utilisateur, id_formation),
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
  FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
) ENGINE=InnoDB;

CREATE TABLE quiz(
  id_quiz INT AUTO_INCREMENT PRIMARY KEY,
  id_chapitre INT NOT NULL,
  titre VARCHAR(200),
  score_reussite DECIMAL(5,2) NOT NULL DEFAULT 50,
  FOREIGN KEY(id_chapitre) REFERENCES chapitres(id_chapitre)
) ENGINE=InnoDB;

CREATE TABLE questions(
  id_question INT AUTO_INCREMENT PRIMARY KEY,
  id_quiz INT NOT NULL,
  enonce TEXT,
  type ENUM('QCM','LIBRE') NOT NULL DEFAULT 'QCM',
  points INT NOT NULL DEFAULT 1,
  FOREIGN KEY(id_quiz) REFERENCES quiz(id_quiz)
) ENGINE=InnoDB;

CREATE TABLE reponses(
  id_reponse INT AUTO_INCREMENT PRIMARY KEY,
  id_question INT NOT NULL,
  contenu TEXT,
  est_correcte BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(id_question) REFERENCES questions(id_question)
) ENGINE=InnoDB;

CREATE TABLE tentatives(
  id_tentative INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_quiz INT NOT NULL,
  note DECIMAL(5,2),
  statut ENUM('EN_COURS','SOUMISE','A_CORRIGER','REUSSIE','ECHOUEE')
    NOT NULL DEFAULT 'EN_COURS',
  date_soumission DATETIME NULL,
  date_correction DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
  FOREIGN KEY(id_quiz) REFERENCES quiz(id_quiz)
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE progression_chapitres(
  id_progression_chapitre INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_chapitre INT NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progression_chapitre (id_utilisateur, id_chapitre),
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
  FOREIGN KEY(id_chapitre) REFERENCES chapitres(id_chapitre) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE avis(
  id_avis INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_formation INT NOT NULL,
  note INT,
  commentaire TEXT,
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
  FOREIGN KEY(id_formation) REFERENCES formations(id_formation)
) ENGINE=InnoDB;

CREATE TABLE conversations(
  id_conversation INT AUTO_INCREMENT PRIMARY KEY,
  sujet VARCHAR(200),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE participant_conversations(
  id_participant INT AUTO_INCREMENT PRIMARY KEY,
  id_conversation INT NOT NULL,
  id_utilisateur INT NOT NULL,
  FOREIGN KEY(id_conversation) REFERENCES conversations(id_conversation),
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
) ENGINE=InnoDB;

CREATE TABLE messages(
  id_message INT AUTO_INCREMENT PRIMARY KEY,
  id_conversation INT NOT NULL,
  id_expediteur INT NOT NULL,
  contenu TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(id_conversation) REFERENCES conversations(id_conversation),
  FOREIGN KEY(id_expediteur) REFERENCES utilisateurs(id_utilisateur)
) ENGINE=InnoDB;

CREATE TABLE notifications(
  id_notification INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  titre VARCHAR(150),
  contenu TEXT,
  lu TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
) ENGINE=InnoDB;

-- ============================================================
-- 2. ROLES
-- ============================================================

INSERT INTO roles (id_role, libelle) VALUES
(1, 'Administrateur'),
(2, 'Formateur'),
(3, 'Etudiant');

-- ============================================================
-- 3. UTILISATEURS
-- ============================================================
-- Les mots de passe ci-dessous sont ceux fournis pour les tests.
-- Si le backend utilise bcrypt.compare(), remplacer ces valeurs
-- par leurs hashes bcrypt avant de tester /auth/login.

INSERT INTO utilisateurs
(id_utilisateur, id_role, nom, prenom, email, mot_de_passe) VALUES
(1, 1, 'Nzarami', 'Samuel', 'samuel.nzarami@tutore.local', '$2b$10$bN.vM4ug7hqnYiCVJOV7GuNVgv23xHTppMYN3YcyXQRQK5X/tHd12'),
(2, 1, 'Kayisavirwa', 'Josué', 'josue.kayisavirwa@tutore.local', '$2b$10$bN.vM4ug7hqnYiCVJOV7GuNVgv23xHTppMYN3YcyXQRQK5X/tHd12'),
(3, 1, 'Katsuva', 'Benedicte', 'benedicte.katsuva@tutore.local', '$2b$10$bN.vM4ug7hqnYiCVJOV7GuNVgv23xHTppMYN3YcyXQRQK5X/tHd12'),
(4, 2, 'Paul', 'Jean Paul', 'jean.paul@tutore.local', '$2b$10$xmBk1PO6r.nGT6qj2voMEOD/BWrJX8wKqWI860wv.0FWFrXWSfdhG'),
(5, 2, 'Basinde', 'David', 'david.basinde@tutore.local', '$2b$10$wIcpcifxV0Mqlo7.YEKMjOAwZ/WmiOk7C.uc0JhP9M.18dWvvgdcG'),
(6, 3, 'Wayire', 'Grâce', 'grace.wayire@tutore.local', '$2b$10$ZXloAgQufUGIPCS1lEZbS.C6hkgW8u6qoYIOndwVWFxySU.mk9E2i'),
(7, 3, 'Mbogho', 'Alice', 'alice.mbogho@tutore.local', '$2b$10$9RMWP9RXgnEtICjBKrFbOeQ3Sa7Ejav21M96ZTY.u8l8lLcfOKkC6');

-- ============================================================
-- 4. CATEGORIES
-- ============================================================

INSERT INTO categories (id_categorie, nom_categorie) VALUES
(1, 'Développement Web'),
(2, 'Programmation'),
(3, 'Bases de données'),
(4, 'Outils numériques');

-- ============================================================
-- 5. FORMATIONS
-- ============================================================

INSERT INTO formations
(id_formation, id_categorie, id_formateur, titre, description, statut, created_at) VALUES
(1, 1, 4,
 'Développement Web Moderne',
 'Apprendre les fondamentaux du HTML, du CSS, de JavaScript et construire une interface web moderne.',
 'PUBLIEE', '2026-01-10 09:00:00'),

(2, 2, 4,
 'JavaScript pour débutants',
 'Découvrir les variables, fonctions, tableaux, objets et mécanismes fondamentaux de JavaScript.',
 'PUBLIEE', '2026-01-15 10:00:00'),

(3, 3, 5,
 'Bases de données SQL',
 'Comprendre les bases du modèle relationnel, les requêtes SQL, les relations et les contraintes.',
 'PUBLIEE', '2026-02-01 08:30:00'),

(4, 4, 5,
 'Introduction aux outils numériques',
 'Découvrir les bonnes pratiques pour travailler efficacement avec les outils numériques.',
 'BROUILLON', '2026-02-10 11:00:00');

-- ============================================================
-- 6. CHAPITRES
-- ============================================================

INSERT INTO chapitres
(id_chapitre, id_formation, titre, description, ordre) VALUES
(1, 1, 'Comprendre le Web', 'Introduction au fonctionnement général du Web.', 1),
(2, 1, 'HTML et structure des pages', 'Créer une structure HTML claire et sémantique.', 2),
(3, 1, 'CSS et mise en forme', 'Mettre en forme une interface avec CSS.', 3),

(4, 2, 'Premiers pas en JavaScript', 'Variables, types et expressions.', 1),
(5, 2, 'Fonctions et structures', 'Fonctions, conditions et boucles.', 2),
(6, 2, 'Tableaux et objets', 'Manipuler les principales structures de données.', 3),

(7, 3, 'Modèle relationnel', 'Comprendre tables, colonnes et relations.', 1),
(8, 3, 'Requêtes SQL', 'Lire, créer et modifier des données.', 2),
(9, 3, 'Relations et contraintes', 'Clés primaires, étrangères et intégrité.', 3),

(10, 4, 'Organisation numérique', 'Bonnes pratiques de travail numérique.', 1);

-- ============================================================
-- 7. SECTIONS
-- ============================================================

INSERT INTO sections
(id_section, id_chapitre, titre, description, ordre) VALUES
(1, 1, 'Le fonctionnement du navigateur', 'Comprendre le rôle du navigateur.', 1),
(2, 1, 'Client et serveur', 'Découvrir la communication HTTP.', 2),

(3, 2, 'Structure HTML', 'Les éléments essentiels d’une page HTML.', 1),
(4, 2, 'HTML sémantique', 'Utiliser les balises adaptées.', 2),

(5, 3, 'Sélecteurs CSS', 'Cibler les éléments HTML.', 1),
(6, 3, 'Mise en page', 'Découvrir Flexbox et les bases de la mise en page.', 2),

(7, 4, 'Variables', 'Déclarer et manipuler des variables.', 1),
(8, 4, 'Types de données', 'Les principaux types JavaScript.', 2),

(9, 5, 'Fonctions', 'Créer des fonctions réutilisables.', 1),
(10, 5, 'Conditions et boucles', 'Contrôler le déroulement d’un programme.', 2),

(11, 6, 'Tableaux', 'Créer et parcourir des tableaux.', 1),
(12, 6, 'Objets', 'Structurer les données avec des objets.', 2),

(13, 7, 'Tables relationnelles', 'Comprendre les tables SQL.', 1),
(14, 7, 'Clés et relations', 'Identifier les clés primaires et étrangères.', 2),

(15, 8, 'SELECT', 'Lire des données avec SELECT.', 1),
(16, 8, 'INSERT et UPDATE', 'Modifier les données.', 2),

(17, 9, 'Clés étrangères', 'Relier les tables entre elles.', 1),
(18, 9, 'Intégrité référentielle', 'Comprendre les contraintes.', 2),

(19, 10, 'Organisation des fichiers', 'Structurer son environnement de travail.', 1),
(20, 10, 'Sécurité numérique', 'Adopter de bonnes pratiques.', 2);

-- ============================================================
-- 8. SOUS-SECTIONS
-- ============================================================

INSERT INTO sous_sections
(id_sous_section, id_section, titre, contenu, ordre) VALUES

(1, 1, 'Le navigateur',
'<h2>Le navigateur</h2><p>Un navigateur permet de demander des ressources à un serveur et de présenter les pages web à l’utilisateur.</p><p>Les navigateurs modernes interprètent notamment HTML, CSS et JavaScript.</p>', 1),

(2, 1, 'URL et ressources',
'<h2>URL et ressources</h2><p>Une URL identifie une ressource accessible sur le réseau.</p><ul><li>Protocole</li><li>Hôte</li><li>Chemin</li></ul>', 2),

(3, 2, 'Le client',
'<h2>Le client</h2><p>Le client est généralement le navigateur qui envoie une requête HTTP au serveur.</p>', 1),

(4, 2, 'Le serveur',
'<h2>Le serveur</h2><p>Le serveur reçoit la requête, traite la demande et renvoie une réponse HTTP.</p>', 2),

(5, 3, 'Document HTML',
'<h2>Document HTML</h2><p>Une page HTML est structurée avec des éléments imbriqués.</p><pre>&lt;main&gt;Contenu&lt;/main&gt;</pre>', 1),

(6, 3, 'Titres et paragraphes',
'<h2>Titres et paragraphes</h2><p>Les titres structurent le document tandis que les paragraphes présentent les informations.</p>', 2),

(7, 4, 'Sémantique',
'<h2>HTML sémantique</h2><p>Les balises sémantiques décrivent le rôle du contenu : header, nav, main, section, article et footer.</p>', 1),

(8, 4, 'Accessibilité',
'<h2>Accessibilité</h2><p>Une structure HTML correcte facilite la navigation et l’accessibilité du contenu.</p>', 2),

(9, 5, 'Sélecteurs',
'<h2>Sélecteurs CSS</h2><p>Les sélecteurs permettent de cibler les éléments auxquels appliquer des règles CSS.</p>', 1),

(10, 5, 'Classes CSS',
'<h2>Classes</h2><p>Une classe peut être réutilisée sur plusieurs éléments.</p><pre>.card { padding: 16px; }</pre>', 2),

(11, 6, 'Flexbox',
'<h2>Flexbox</h2><p>Flexbox facilite l’alignement et la distribution des éléments dans une interface.</p>', 1),

(12, 6, 'Responsive design',
'<h2>Responsive design</h2><p>Une interface responsive adapte sa présentation aux différentes tailles d’écran.</p>', 2),

(13, 7, 'Déclarer une variable',
'<h2>Variables JavaScript</h2><p>Les mots-clés let et const permettent de déclarer des variables.</p><pre>const nom = "E-Learning";</pre>', 1),

(14, 8, 'Types primitifs',
'<h2>Types primitifs</h2><p>JavaScript possède notamment les types string, number, boolean, null et undefined.</p>', 1),

(15, 9, 'Créer une fonction',
'<h2>Fonctions</h2><p>Une fonction regroupe une logique réutilisable.</p><pre>function addition(a, b) { return a + b; }</pre>', 1),

(16, 10, 'Conditions',
'<h2>Conditions</h2><p>Une condition permet d’exécuter une partie du programme selon une situation.</p>', 1),

(17, 11, 'Tableaux JavaScript',
'<h2>Tableaux</h2><p>Un tableau contient une collection ordonnée de valeurs.</p>', 1),

(18, 12, 'Objets JavaScript',
'<h2>Objets</h2><p>Un objet regroupe des propriétés associées à des valeurs.</p>', 1),

(19, 13, 'Tables',
'<h2>Tables SQL</h2><p>Une table représente un ensemble de données structurées en lignes et colonnes.</p>', 1),

(20, 14, 'Clé primaire',
'<h2>Clé primaire</h2><p>Une clé primaire identifie de manière unique une ligne d’une table.</p>', 1),

(21, 15, 'SELECT',
'<h2>SELECT</h2><p>La commande SELECT permet de récupérer des données.</p><pre>SELECT * FROM utilisateurs;</pre>', 1),

(22, 17, 'Clé étrangère',
'<h2>Clé étrangère</h2><p>Une clé étrangère référence une clé primaire d’une autre table afin de matérialiser une relation.</p>', 1);

-- ============================================================
-- 9. INSCRIPTIONS
-- ============================================================

INSERT INTO inscriptions
(id_inscription, id_utilisateur, id_formation, date_inscription) VALUES
(1, 6, 1, '2026-03-01 09:00:00'),
(2, 6, 2, '2026-03-02 10:00:00'),
(3, 6, 3, '2026-03-03 11:00:00'),
(4, 7, 1, '2026-03-04 09:30:00'),
(5, 7, 2, '2026-03-05 14:00:00'),
(6, 7, 3, '2026-03-06 15:00:00');

-- ============================================================
-- 10. PROGRESSIONS
-- ============================================================

INSERT INTO progressions
(id_progression, id_utilisateur, id_formation, pourcentage) VALUES
(1, 6, 1, 66.67),
(2, 6, 2, 33.33),
(3, 6, 3, 0.00),
(4, 7, 1, 33.33),
(5, 7, 2, 66.67),
(6, 7, 3, 0.00);

-- ============================================================
-- 11. QUIZ
-- ============================================================

INSERT INTO quiz
(id_quiz, id_chapitre, titre, score_reussite) VALUES
(1, 1, 'Quiz - Comprendre le Web', 50),
(2, 2, 'Quiz - HTML', 60),
(3, 3, 'Quiz - CSS', 50),
(4, 4, 'Quiz - Premiers pas JavaScript', 50),
(5, 5, 'Quiz - Fonctions et structures', 60),
(6, 6, 'Quiz - Tableaux et objets', 50),
(7, 7, 'Quiz - Modèle relationnel', 50),
(8, 8, 'Quiz - Requêtes SQL', 60),
(9, 9, 'Quiz - Relations SQL', 50),
(10, 10, 'Quiz - Outils numériques', 50);

-- ============================================================
-- 12. QUESTIONS
-- ============================================================

INSERT INTO questions
(id_question, id_quiz, enonce, type, points) VALUES
(1, 1, 'Quel élément est généralement utilisé pour consulter une page web ?', 'QCM', 1),
(2, 1, 'Quel protocole est couramment utilisé pour échanger des ressources web ?', 'QCM', 1),
(3, 1, 'Expliquez en quelques mots le rôle d’un serveur web.', 'LIBRE', 2),

(4, 2, 'Quelle balise représente le titre principal d’une page ?', 'QCM', 1),
(5, 2, 'Quelle balise permet de créer un paragraphe ?', 'QCM', 1),
(6, 2, 'Pourquoi utiliser des balises HTML sémantiques ?', 'LIBRE', 2),

(7, 3, 'Quelle propriété CSS modifie la couleur du texte ?', 'QCM', 1),
(8, 3, 'Quel mécanisme CSS facilite l’alignement horizontal et vertical ?', 'QCM', 1),

(9, 4, 'Quel mot-clé permet de déclarer une constante en JavaScript ?', 'QCM', 1),
(10, 4, 'Quel type représente une valeur vraie ou fausse ?', 'QCM', 1),

(11, 5, 'Quel mot-clé permet de déclarer une fonction classique ?', 'QCM', 1),
(12, 5, 'À quoi sert une boucle ?', 'LIBRE', 2),

(13, 6, 'Quelle structure contient une collection ordonnée de valeurs ?', 'QCM', 1),
(14, 6, 'Comment accéder à une propriété d’un objet ?', 'QCM', 1),

(15, 7, 'Une table relationnelle est principalement composée de quoi ?', 'QCM', 1),
(16, 7, 'Quel élément identifie une ligne de manière unique ?', 'QCM', 1),

(17, 8, 'Quelle commande permet de lire des données SQL ?', 'QCM', 1),
(18, 8, 'Quelle commande permet d’ajouter une ligne ?', 'QCM', 1),

(19, 9, 'Quel mécanisme permet de relier deux tables ?', 'QCM', 1),
(20, 9, 'Quel est le rôle d’une clé étrangère ?', 'LIBRE', 2),

(21, 10, 'Quelle pratique améliore la sécurité d’un compte ?', 'QCM', 1),
(22, 10, 'Pourquoi organiser correctement ses fichiers ?', 'LIBRE', 2);

-- ============================================================
-- 13. REPONSES
-- ============================================================

INSERT INTO reponses
(id_reponse, id_question, contenu, est_correcte) VALUES
(1, 1, 'Un navigateur', 1),
(2, 1, 'Un éditeur d’image', 0),
(3, 1, 'Un tableur', 0),
(4, 1, 'Un compilateur C', 0),

(5, 2, 'HTTP', 1),
(6, 2, 'FTP uniquement', 0),
(7, 2, 'SMTP', 0),

(8, 4, '<h1>', 1),
(9, 4, '<title>', 0),
(10, 4, '<header1>', 0),

(11, 5, '<p>', 1),
(12, 5, '<paragraph>', 0),
(13, 5, '<text>', 0),

(14, 7, 'color', 1),
(15, 7, 'font-size', 0),
(16, 7, 'background-image', 0),

(17, 8, 'Flexbox', 1),
(18, 8, 'SMTP', 0),
(19, 8, 'SQL', 0),

(20, 9, 'const', 1),
(21, 9, 'constant', 0),
(22, 9, 'define', 0),

(23, 10, 'boolean', 1),
(24, 10, 'string', 0),
(25, 10, 'array', 0),

(26, 11, 'function', 1),
(27, 11, 'method-only', 0),
(28, 11, 'procedure', 0),

(29, 13, 'Un tableau', 1),
(30, 13, 'Une fonction', 0),
(31, 13, 'Une URL', 0),

(32, 14, 'objet.propriete', 1),
(33, 14, 'objet#propriete', 0),
(34, 14, 'objet::propriete', 0),

(35, 15, 'Lignes et colonnes', 1),
(36, 15, 'Uniquement des fichiers', 0),
(37, 15, 'Uniquement des images', 0),

(38, 16, 'Une clé primaire', 1),
(39, 16, 'Une couleur CSS', 0),
(40, 16, 'Une URL', 0),

(41, 17, 'SELECT', 1),
(42, 17, 'DISPLAY', 0),
(43, 17, 'READSQL', 0),

(44, 18, 'INSERT', 1),
(45, 18, 'ADDROW', 0),
(46, 18, 'PUSHSQL', 0),

(47, 19, 'Une relation par clé étrangère', 1),
(48, 19, 'Une classe CSS', 0),
(49, 19, 'Une balise HTML', 0),

(50, 21, 'Utiliser un mot de passe robuste', 1),
(51, 21, 'Partager son mot de passe', 0),
(52, 21, 'Désactiver toute protection', 0);

-- ============================================================
-- 14. TENTATIVES
-- ============================================================
-- Plusieurs statuts sont volontairement représentés pour tester
-- les différentes interfaces frontend.

INSERT INTO tentatives
(id_tentative, id_utilisateur, id_quiz, note, statut, date_soumission, date_correction, created_at) VALUES
(1, 6, 1, 100.00, 'REUSSIE', '2026-03-07 09:30:00', NULL, '2026-03-07 09:20:00'),
(2, 6, 2, 75.00, 'REUSSIE', '2026-03-08 10:30:00', NULL, '2026-03-08 10:20:00'),
(3, 6, 3, 40.00, 'ECHOUEE', '2026-03-09 11:30:00', NULL, '2026-03-09 11:20:00'),
(4, 7, 1, 50.00, 'REUSSIE', '2026-03-10 09:30:00', NULL, '2026-03-10 09:20:00'),
(5, 7, 4, NULL, 'A_CORRIGER', '2026-03-11 14:30:00', NULL, '2026-03-11 14:15:00'),
(6, 7, 5, NULL, 'A_CORRIGER', '2026-03-12 15:30:00', NULL, '2026-03-12 15:15:00'),
(7, 6, 4, NULL, 'EN_COURS', NULL, NULL, '2026-03-13 10:00:00');

-- ============================================================
-- 15. REPONSES ETUDIANTS
-- ============================================================

INSERT INTO reponses_etudiants
(id_reponse_etudiant, id_tentative, id_question, id_reponse, contenu) VALUES
(1, 1, 1, 1, NULL),
(2, 1, 2, 5, NULL),
(3, 1, 3, NULL, 'Le serveur reçoit les requêtes et renvoie les ressources demandées.'),

(4, 2, 4, 8, NULL),
(5, 2, 5, 11, NULL),
(6, 2, 6, NULL, 'Les balises sémantiques rendent la structure plus claire et accessible.'),

(7, 3, 7, 15, NULL),
(8, 3, 8, 17, NULL),

(9, 4, 1, 1, NULL),
(10, 4, 2, 5, NULL),

(11, 5, 9, 20, NULL),
(12, 5, 10, 23, NULL),

(13, 6, 11, 26, NULL),
(14, 6, 12, NULL, 'Une boucle permet de répéter une opération tant qu’une condition est satisfaite.'),

(15, 7, 9, 20, NULL);

-- ============================================================
-- 16. PROGRESSION DES CHAPITRES
-- ============================================================

INSERT INTO progression_chapitres
(id_progression_chapitre, id_utilisateur, id_chapitre, completed_at) VALUES
(1, 6, 1, '2026-03-07 09:45:00'),
(2, 6, 2, '2026-03-08 10:45:00'),
(3, 7, 1, '2026-03-10 09:45:00'),
(4, 7, 4, '2026-03-12 16:00:00');

-- ============================================================
-- 17. AVIS
-- ============================================================

INSERT INTO avis
(id_avis, id_utilisateur, id_formation, note, commentaire) VALUES
(1, 6, 1, 5, 'Formation très claire et progressive.'),
(2, 7, 1, 4, 'Très bonne introduction au développement web.'),
(3, 6, 2, 5, 'Les exemples JavaScript sont faciles à comprendre.'),
(4, 7, 2, 4, 'Bonne formation pour commencer.');

-- ============================================================
-- 18. CONVERSATIONS
-- ============================================================

INSERT INTO conversations
(id_conversation, sujet, created_at) VALUES
(1, 'Bienvenue dans la formation Développement Web', '2026-03-01 09:05:00'),
(2, 'Question sur JavaScript', '2026-03-05 14:10:00'),
(3, 'Question sur SQL', '2026-03-06 15:10:00'),
(4, 'Échange formateur - étudiant', '2026-03-08 16:00:00');

-- ============================================================
-- 19. PARTICIPANTS
-- ============================================================

INSERT INTO participant_conversations
(id_participant, id_conversation, id_utilisateur) VALUES
(1, 1, 4),
(2, 1, 6),

(3, 2, 4),
(4, 2, 7),

(5, 3, 5),
(6, 3, 6),

(7, 4, 5),
(8, 4, 7);

-- ============================================================
-- 20. MESSAGES
-- ============================================================

INSERT INTO messages
(id_message, id_conversation, id_expediteur, contenu, created_at) VALUES
(1, 1, 4, 'Bienvenue dans la formation Développement Web. Bon apprentissage !', '2026-03-01 09:06:00'),
(2, 1, 6, 'Merci beaucoup, je commence aujourd’hui.', '2026-03-01 09:10:00'),

(3, 2, 4, 'Bonjour Alice, quelle partie de JavaScript vous pose problème ?', '2026-03-05 14:11:00'),
(4, 2, 7, 'Bonjour, je voudrais mieux comprendre les fonctions.', '2026-03-05 14:15:00'),

(5, 3, 5, 'Bonjour Grâce, avez-vous commencé les requêtes SELECT ?', '2026-03-06 15:11:00'),
(6, 3, 6, 'Oui, je viens de commencer le chapitre SQL.', '2026-03-06 15:20:00'),

(7, 4, 5, 'N’hésitez pas à me contacter si vous avez une question.', '2026-03-08 16:01:00'),
(8, 4, 7, 'Merci pour votre disponibilité.', '2026-03-08 16:05:00');

-- ============================================================
-- 21. NOTIFICATIONS
-- ============================================================

INSERT INTO notifications
(id_notification, id_utilisateur, titre, contenu, lu, created_at) VALUES
(1, 6, 'Bienvenue', 'Bienvenue sur la plateforme E-Learning.', 1, '2026-03-01 09:00:00'),
(2, 6, 'Nouvelle inscription', 'Vous êtes inscrit à Développement Web Moderne.', 1, '2026-03-01 09:01:00'),
(3, 6, 'Quiz réussi', 'Félicitations, vous avez réussi le quiz Comprendre le Web.', 0, '2026-03-07 09:46:00'),
(4, 6, 'Nouvelle formation', 'Une nouvelle formation est disponible dans le catalogue.', 0, '2026-03-09 08:00:00'),

(5, 7, 'Bienvenue', 'Bienvenue sur la plateforme E-Learning.', 1, '2026-03-04 09:30:00'),
(6, 7, 'Quiz à corriger', 'Votre réponse libre a été envoyée au formateur pour correction.', 0, '2026-03-11 14:31:00'),
(7, 7, 'Nouveau message', 'Vous avez reçu un nouveau message de votre formateur.', 0, '2026-03-08 16:01:00'),

(8, 4, 'Nouvelle inscription', 'Un étudiant vient de rejoindre votre formation.', 0, '2026-03-01 09:02:00'),
(9, 4, 'Tentative à corriger', 'Une tentative de quiz contient une réponse libre à corriger.', 0, '2026-03-11 14:32:00'),
(10, 5, 'Nouvelle inscription', 'Un étudiant vient de rejoindre votre formation SQL.', 1, '2026-03-06 15:00:00');

-- ============================================================
-- 22. VERIFICATIONS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'roles' AS table_name, COUNT(*) AS total FROM roles
UNION ALL SELECT 'utilisateurs', COUNT(*) FROM utilisateurs
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'formations', COUNT(*) FROM formations
UNION ALL SELECT 'chapitres', COUNT(*) FROM chapitres
UNION ALL SELECT 'sections', COUNT(*) FROM sections
UNION ALL SELECT 'sous_sections', COUNT(*) FROM sous_sections
UNION ALL SELECT 'inscriptions', COUNT(*) FROM inscriptions
UNION ALL SELECT 'progressions', COUNT(*) FROM progressions
UNION ALL SELECT 'quiz', COUNT(*) FROM quiz
UNION ALL SELECT 'questions', COUNT(*) FROM questions
UNION ALL SELECT 'reponses', COUNT(*) FROM reponses
UNION ALL SELECT 'tentatives', COUNT(*) FROM tentatives
UNION ALL SELECT 'reponses_etudiants', COUNT(*) FROM reponses_etudiants
UNION ALL SELECT 'progression_chapitres', COUNT(*) FROM progression_chapitres
UNION ALL SELECT 'avis', COUNT(*) FROM avis
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'participant_conversations', COUNT(*) FROM participant_conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications;

-- Vérification des utilisateurs et rôles
SELECT
  u.id_utilisateur,
  u.prenom,
  u.nom,
  u.email,
  r.libelle AS role
FROM utilisateurs u
JOIN roles r ON r.id_role = u.id_role
ORDER BY u.id_utilisateur;

-- Vérification formations / formateurs
SELECT
  f.id_formation,
  f.titre,
  f.statut,
  CONCAT(u.prenom, ' ', u.nom) AS formateur,
  c.nom_categorie AS categorie
FROM formations f
JOIN utilisateurs u ON u.id_utilisateur = f.id_formateur
JOIN categories c ON c.id_categorie = f.id_categorie
ORDER BY f.id_formation;

-- Vérification quiz
SELECT
  q.id_quiz,
  q.titre,
  q.score_reussite,
  c.titre AS chapitre,
  f.titre AS formation
FROM quiz q
JOIN chapitres c ON c.id_chapitre = q.id_chapitre
JOIN formations f ON f.id_formation = c.id_formation
ORDER BY q.id_quiz;

-- Vérification tentatives
SELECT
  t.id_tentative,
  CONCAT(u.prenom, ' ', u.nom) AS etudiant,
  q.titre AS quiz,
  t.note,
  t.statut
FROM tentatives t
JOIN utilisateurs u ON u.id_utilisateur = t.id_utilisateur
JOIN quiz q ON q.id_quiz = t.id_quiz
ORDER BY t.id_tentative;
