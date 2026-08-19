# 🎓 E-Learning Universitaire Locale

> Plateforme d'apprentissage en ligne fonctionnant sur le réseau local (LAN) d'une université.

---

# Présentation

**E-Learning Universitaire Locale** est une plateforme numérique développée dans le cadre d'un Travail de Fin de Cycle (TFC). Elle vise à améliorer l'enseignement universitaire en mettant à la disposition des enseignants et des étudiants un environnement numérique d'apprentissage inspiré des grandes plateformes internationales telles que **OpenClassrooms**, **Moodle**, **Coursera** et **Udemy**, tout en étant adaptée aux réalités des établissements universitaires de la République Démocratique du Congo.

Contrairement aux plateformes classiques fonctionnant exclusivement sur Internet, cette application est conçue pour fonctionner principalement sur un **réseau local (LAN)** afin de permettre aux étudiants et aux enseignants d'accéder aux ressources pédagogiques même en l'absence d'une connexion Internet.

---

# Objectifs du projet

Le projet poursuit les objectifs suivants :

- Numériser la gestion des enseignements universitaires.
- Centraliser les ressources pédagogiques.
- Faciliter la communication entre enseignants et étudiants.
- Assurer le suivi de la progression des apprenants.
- Organiser les évaluations en ligne.
- Permettre le dépôt et la correction des devoirs.
- Offrir un environnement moderne d'apprentissage.
- Réduire la dépendance à Internet grâce au fonctionnement sur réseau local.

---

# Technologies utilisées

## Front-End

- React.js
- React Router
- Axios
- Context API
- Tailwind CSS
- HTML5
- CSS3
- JavaScript ES6+

---

## Back-End

- Node.js
- Express.js
- JWT Authentication
- bcrypt
- Multer
- Express Validator

---

## Base de données

- MySQL
- PHPMyAdmin

La base de données utilisée est :

```
elearning_db
```

Elle constitue la référence officielle du projet.

---

# Architecture générale

Le projet est organisé selon une architecture Client / Serveur.

```
React
      │
      │ HTTP / REST API
      ▼
Express.js
      │
      ▼
MySQL
```

---

# Structure du projet

```
Tutore/

│
├── backend/
│
├── frontend/
│
├── database/
│     └── elearning_db.sql
│
├── docs/
│     ├── 01_ProjectVision.md
│     ├── 02_DataBaseRules.md
│     ├── 03_Architecture.md
│     ├── 04_UI_UX.md
│     ├── 05_API.md
│     ├── 06_CodingStandards.md
│     ├── 07_Roadmap.md
│     ├── 08_ProjectRules.md
│     └── 09_PromptTemplates.md
│
├── .agents/
│
├── README.md
│
└── skills-lock.json
```

---

# Fonctionnalités principales

## Administrateur

- Authentification
- Gestion des utilisateurs
- Gestion des rôles
- Gestion des catégories
- Gestion des notifications
- Consultation des statistiques

---

## Formateur

- Création des formations
- Création des modules
- Création des chapitres
- Création des leçons
- Téléversement des vidéos
- Téléversement des documents
- Création des quiz
- Création des devoirs
- Correction des travaux
- Consultation des progressions

---

## Étudiant

- Création du compte
- Authentification
- Consultation des formations
- Inscription
- Lecture des leçons
- Visionnage des vidéos
- Téléchargement des documents
- Passage des quiz
- Dépôt des devoirs
- Consultation des notes
- Consultation de la progression
- Messagerie
- Notifications
- Avis sur les formations

---

# Base de données

Le projet utilise une base MySQL nommée :

```
elearning_db
```

Elle contient les tables suivantes :

- roles
- utilisateurs
- categories
- formations
- modules
- chapitres
- lecons
- videos
- documents
- inscriptions
- progressions
- quiz
- questions
- reponses
- tentatives
- reponses_etudiants
- devoirs
- soumissions
- avis
- conversations
- participant_conversations
- messages
- notifications

⚠ Cette base constitue la seule référence officielle du projet.

Aucune modification structurelle ne doit être réalisée sans validation explicite.

---

# Principes d'architecture

Le développement suit les principes suivants :

- Architecture MVC
- API REST
- Clean Architecture
- SOLID
- DRY
- KISS
- Séparation Front / Back
- Composants réutilisables
- Responsive Design

---

# Organisation de la documentation

Toute la documentation technique du projet est regroupée dans le dossier :

```
docs/
```

Chaque document décrit un aspect particulier du projet :

| Document | Description |
|----------|-------------|
| 01_ProjectVision | Vision générale |
| 02_DataBaseRules | Règles de la base de données |
| 03_Architecture | Architecture logicielle |
| 04_UI_UX | Règles UX/UI |
| 05_API | Documentation API REST |
| 06_CodingStandards | Standards de développement |
| 07_Roadmap | Planning du projet |
| 08_ProjectRules | Règles générales |
| 09_PromptTemplates | Prompts destinés à Codex |

---

# Développement

Le projet sera développé progressivement selon les étapes suivantes :

1. Configuration du Backend
2. Configuration du Frontend
3. Connexion MySQL
4. Authentification
5. Gestion des utilisateurs
6. Gestion des formations
7. Gestion des contenus
8. Gestion des quiz
9. Gestion des devoirs
10. Messagerie
11. Notifications
12. Tableau de bord
13. Statistiques
14. Optimisations
15. Déploiement

---

# Instructions importantes

Avant toute implémentation :

- Lire entièrement la documentation du dossier `docs`.
- Respecter la structure de la base de données.
- Utiliser les Skills présents dans `.agents/skills`.
- Respecter les conventions définies dans `CODEX_PROJECT_GUIDE.md`.
- Produire un code propre, documenté et maintenable.

---

# Public cible

Cette plateforme est destinée :

- aux universités,
- aux instituts supérieurs,
- aux enseignants,
- aux étudiants,
- aux administrateurs des établissements.

---

# Auteur

Projet réalisé dans le cadre d'un Travail de Fin de Cycle (TFC).

Titre :

**Conception et réalisation d'une plateforme E-Learning Universitaire Locale basée sur les technologies Web modernes.**

---

# Licence

Projet académique.

Tous les droits sont réservés à l'auteur dans le cadre de son Travail de Fin de Cycle.