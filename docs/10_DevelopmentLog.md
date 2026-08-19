# 10 - Development Log

Projet : E-Learning Universitaire Locale

Version : 1.0

---

# Objectif

Ce document sert de journal de développement du projet.

Il permet à tout développeur ou agent IA (Codex, ChatGPT, GitHub Copilot, Cursor AI, etc.) de reprendre le développement sans avoir à réanalyser entièrement le projet.

Après chaque module terminé, ce document doit être mis à jour.

---

# État actuel du projet

Version actuelle :

1.0.0

Statut :

🟢 Backend finalisé (sécurité, tests, uploads). Frontend à construire.

Date de création :

À compléter

---

# Base de données

Nom :

elearning

Statut :

✅ Terminée (une migration appliquée)

Nombre de tables :

23

Modification autorisée :

⚠️ Oui, via des scripts de migration versionnés
(`database/migrations/`), jamais à la main.

Migrations appliquées :

- `001_notifications_lu.sql` : ajout de la colonne `lu` sur `notifications`
  (notifications « marquer comme lue »).

---

# Architecture

Backend :

Express.js

Frontend :

React + Vite

Base de données :

MySQL (PHPMyAdmin)

Architecture :

MVC

API :

REST

Authentification :

JWT + bcrypt

---

# Modules de la Roadmap

| Module | Description | Statut |
|---------|-------------|--------|
| 01 | Initialisation du projet | ✅ Terminé |
| 02 | Connexion à la base de données | ✅ Terminé |
| 03 | Authentification | ✅ Terminé (JWT + bcrypt, changement de mot de passe) |
| 04 | Gestion des utilisateurs | ✅ Terminé |
| 05 | Gestion des catégories | ✅ Terminé |
| 06 | Gestion des formations | ✅ Terminé |
| 07 | Modules | ✅ Terminé |
| 08 | Chapitres | ✅ Terminé |
| 09 | Leçons | ✅ Terminé |
| 10 | Uploads | ✅ Terminé (Multer, vidéos + documents) |
| 11 | Inscriptions | ✅ Terminé |
| 12 | Progression | ✅ Terminé (lecture étudiante, gestion admin/formateur) |
| 13 | Quiz | ✅ Terminé |
| 14 | Devoirs | ✅ Terminé |
| 15 | Messagerie | ✅ Terminé |
| 16 | Notifications | ✅ Terminé (dont « marquer comme lue ») |
| 17 | Tableau de bord | ⏳ À faire (frontend) |
| 18 | Optimisation | ✅ Terminé (rate limiting, pagination, CORS par env) |
| 19 | Documentation | 🔄 À compléter |
| 20 | Livraison | ⏳ À faire |

---

# Dernière étape terminée

Finalisation du backend (Phase A) : sécurité, contrats d'erreur unifiés,
pagination, uploads, tests d'intégration — 225 assertions vertes.

---

# Étape en cours

Construction du frontend (React + Vite + Tailwind) sur les API finalisées.

---

# Prochaine étape

Frontend : authentification, navigation par rôles, CRUD des ressources et
écrans du tableau de bord.

---

# Historique des développements

## Session 1

Date :

...

Travaux réalisés :

- Analyse complète du projet.
- Vérification de la documentation, du SQL et des Skills.
- Initialisation de l'architecture Backend Express MVC.
- Initialisation du Frontend React + Vite + Tailwind CSS.
- Ajout des configurations ESLint, Prettier et des exemples de variables d'environnement.
- Ajout du pool MySQL réutilisable et du script de vérification en lecture seule.
- Ajout des middlewares techniques communs et des layouts React structurels.

Fichiers créés :

- Infrastructure `backend/` et `frontend/`.
- Configurations de dépendances, linting, formatage et variables d'environnement.
- Script `backend/src/scripts/checkDatabase.js`.

Fichiers modifiés :

- `.gitignore`
- `docs/10_DevelopmentLog.md`

Tests effectués :

- `npm run lint` et `npm run format:check` sur le Backend.
- `npm run lint`, `npm run build` et `npm run format:check` sur le Frontend.
- Démarrage temporaire du Backend, réponse HTTP 200 de `/api/health`.
- Démarrage temporaire du Frontend, réponse HTTP 200.
- `npm run db:check`, connexion MySQL réussie et 23 tables vérifiées en lecture seule.

Résultat :

Infrastructure prête. Les démarrages locaux et la connexion à `elearning_db` ont été vérifiés.

---

## Session 2

Travaux réalisés :

- Centralisation du pool MySQL réutilisable dans `backend/src/config/database.js`.
- Ajout de validations de ports dans la configuration d'environnement.
- Vérification en lecture seule de la connexion, des 23 tables et de l'accès `SELECT` à chacune d'elles.
- Harmonisation du journal avec les 20 étapes de `docs/07_Roadmap.md`.

Fichiers modifiés :

- `backend/src/config/database.js`
- `backend/src/config/env.js`
- `backend/src/scripts/checkDatabase.js`
- `docs/10_DevelopmentLog.md`

Tests effectués :

- `npm run db:check` : connexion réussie à `elearning_db` et lecture de 23 tables.
- `npm run lint` et `npm run format:check` : Backend conforme.

Résultat :

Connexion MySQL validée et prête pour les modules suivants, sans modification du schéma.

---

## Session 3

Travaux réalisés :

- Ajout de la connexion sécurisée avec bcrypt et JWT.
- Ajout des middlewares d'authentification, d'autorisation par rôle et de validation.
- Ajout des routes protégées `POST /api/auth/logout` et `GET /api/auth/profile`.
- Ajout d'un test transactionnel avec annulation systématique du compte de test.

Fichiers créés :

- `backend/src/controllers/auth.controller.js`
- `backend/src/middlewares/auth.middleware.js`
- `backend/src/middlewares/validation.middleware.js`
- `backend/src/models/user.model.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/services/auth.service.js`
- `backend/src/utils/AppError.js`
- `backend/src/utils/token.js`
- `backend/src/validators/auth.validator.js`
- `backend/src/scripts/testAuthentication.js`

Fichiers modifiés :

- `backend/package.json`
- `backend/src/app.js`
- `backend/src/config/env.js`
- `backend/src/middlewares/error.middleware.js`
- `docs/10_DevelopmentLog.md`

Tests effectués :

- À compléter après les tests finaux du module.

Résultat :

Authentification JWT et contrôle des rôles prêts, sans modification du schéma.

---

## Phase A — Finalisation du backend

Travaux réalisés :

- Sécurité :
  - Rate limiting sur `/api/auth/login` et `/api/auth/register`
    (`express-rate-limit`, 10 requêtes / 15 min).
  - CORS piloté par variable d'environnement `CORS_ORIGIN`.
  - Limite de payload JSON/urlencoded (1 Mo) + service statique des uploads.
  - Middleware d'authentification durci (Bearer + `jwtConfig` centralisé).
  - Retrait de l'écriture de la progression pour le rôle Étudiant
    (la progression est une donnée calculée ; l'étudiant la consulte).
- Notifications « marquer comme lue » :
  - Migration `001_notifications_lu.sql` + mise à jour de `elearning_db.sql`.
  - `PATCH /api/notifications/:id/lu` (IDOR : propriétaire ou admin),
    `GET /api/notifications/unread`, `GET /api/notifications/count-unread`.
- Pagination rétro-compatible (`?page&limit`) sur utilisateurs,
  notifications et messages (`src/utils/pagination.js`).
- Uploads Multer (vidéos et documents) :
  - `src/config/upload.js` (filtres MIME, 100 Mo max).
  - Routes vidéo/document en `multipart/form-data`, champ `fichier`.
  - Le fichier est obligatoire à la création (422 sinon).
- Nettoyage :
  - Suppression de fichiers morts (`utils/jwt.js`, `constants/routes.js`,
    dossier `helpers/`).
  - Suppression de 25 scripts de test obsolètes (dumps console sans assertions).
  - Suppression de l'ancien `validation.middleware.js` au profit du
    contrat 422 unifié `[{ field, message }]`.
- Changement de mot de passe : `PUT /api/auth/password` (contrôle de
  l'ancien mot de passe, `mot_de_passe` normalisé sur toute la stack).

Fichiers créés :

- `backend/src/middlewares/rateLimiter.js`
- `backend/src/utils/pagination.js`
- `backend/src/config/upload.js`
- `backend/tests/features.test.js`
- `database/migrations/001_notifications_lu.sql`

Fichiers modifiés :

- `backend/src/app.js`, `backend/src/config/cors.js`,
  `backend/src/config/env.js`, `backend/src/routes/auth.route.js`,
  `backend/src/routes/notification.routes.js`,
  `backend/src/routes/progression.routes.js`,
  `backend/src/routes/video.routes.js`, `backend/src/routes/document.routes.js`,
  `backend/src/controllers/{notification,video,document,user,message}.controller.js`,
  `backend/src/services/{notification,video,document}.service.js`,
  `backend/src/repositories/notification.repository.js`,
  `backend/src/validators/{video,document}.validator.js`,
  `backend/src/utils/api-response.js`, `backend/tests/run-all.js`,
  `backend/.env`, `backend/.env.example`, `database/elearning_db.sql`,
  `docs/10_DevelopmentLog.md`.

Tests effectués :

- `npm test` (6 harnais, 225 PASS / 0 FAIL) : ownership/anti-IDOR,
  services, contrat d'erreur, rôles, routes HTTP, fonctionnalités
  (validation 422, pagination, notifications `lu`, mot de passe, rate limit).

Résultat :

Backend vert et stable. Le frontend peut consommer l'API sans modification.

---

# Décisions techniques

- Format d'erreur unifié : `422` + `{ success, message, errors: [{ field, message }] }`.
- Pagination en mémoire (listes locales) : aucune clé `pagination` si les
  paramètres `page`/`limit` sont absents (rétro-compatible).
- Les schémas de base de données évoluent uniquement via des migrations
  versionnées dans `database/migrations/`.
- Les fichiers uploadés sont servis publiquement sous `/uploads`.

---

# Problèmes rencontrés

- La route `PATCH /api/notifications/:id/lu` référençait une méthode de
  contrôleur absente (import d'app en échec) : corrigé en implémentant
  complètement la fonctionnalité (repository → service → contrôleur).
- Les modifications SQL doivent être appliquées à la base existante
  (colonne `lu`) : migration `001` fournie et déjà exécutée en local.

---

# Suggestions proposées

Aucune.

---

# Notes importantes

- Toute évolution du schéma passe par `database/migrations/` (migration
  versionnée), jamais par modification directe de la base.
- `npm test` (backend) doit rester vert avant d'entamer le frontend.
- CORS : renseigner `CORS_ORIGIN` dans `backend/.env` pour le domaine
  du frontend (plusieurs origines possibles, séparées par des virgules).

---

# Instructions de reprise

Avant de reprendre le développement :

1. Lire ce document.
2. Identifier le dernier module terminé.
3. Reprendre directement au module suivant.
4. Ne pas relire toute la documentation si celle-ci n'a pas changé.
5. Mettre à jour ce document à la fin de chaque module.

---

# Fin du document
