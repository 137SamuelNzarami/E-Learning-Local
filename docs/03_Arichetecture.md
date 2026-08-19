# 03 - Architecture Logicielle

# E-Learning Universitaire Locale

Version : 1.0

---

# 1. Objectif

Ce document définit l'architecture logicielle officielle du projet **E-Learning Universitaire Locale**.

Il précise l'organisation du projet, les responsabilités de chaque couche, les conventions de développement ainsi que les règles d'implémentation.

Toutes les implémentations réalisées par Codex ou tout autre développeur devront respecter cette architecture.

---

# 2. Architecture Générale

Le projet adopte une architecture **Client / Serveur** reposant sur les technologies suivantes :

```
+---------------------+
|    React.js Client  |
+----------+----------+
           |
           | HTTP / REST API
           |
+----------v----------+
|   Express.js API    |
+----------+----------+
           |
           |
+----------v----------+
|      MySQL          |
|   elearning_db      |
+---------------------+
```

Le Frontend ne communique jamais directement avec la base de données.

Toutes les opérations transitent par l'API REST Express.

---

# 3. Technologies

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
- JWT
- bcrypt
- Multer
- Express Validator
- dotenv

---

## Base de données

- MySQL
- PHPMyAdmin

---

# 4. Organisation du projet

```
Tutore/

backend/

frontend/

database/

docs/

.agents/

README.md
```

---

# 5. Architecture Backend

Le Backend suit une architecture MVC.

```
backend/

config/

controllers/

middlewares/

models/

routes/

services/

validators/

uploads/

utils/

server.js
```

---

# 6. Description des dossiers Backend

## config/

Configuration :

- connexion MySQL
- variables d'environnement
- JWT
- paramètres globaux

---

## controllers/

Les contrôleurs contiennent uniquement la logique métier.

Ils :

- reçoivent les requêtes
- appellent les services
- renvoient les réponses JSON

---

## models/

Les modèles représentent les tables MySQL.

Un modèle par table.

Exemple :

```
Utilisateur.js

Formation.js

Module.js

Quiz.js
```

---

## routes/

Déclaration des routes REST.

Exemple :

```
GET

POST

PUT

DELETE
```

---

## services/

Toute la logique métier complexe est placée ici.

Les contrôleurs restent légers.

---

## validators/

Validation des données.

Utilisation :

Express Validator.

---

## middlewares/

Gestion :

- JWT
- Authentification
- Autorisation
- Upload
- Gestion des erreurs

---

## uploads/

Contient :

- vidéos
- documents
- devoirs

Organisation :

```
uploads/

videos/

documents/

devoirs/
```

---

## utils/

Fonctions utilitaires :

- génération de code
- date
- pagination
- helpers

---

# 7. Architecture Frontend

```
frontend/

src/

assets/

components/

layouts/

pages/

routes/

services/

hooks/

context/

styles/

utils/

App.jsx

main.jsx
```

---

# 8. Description des dossiers Frontend

## assets

Images

Icônes

Polices

Logos

---

## components

Composants réutilisables.

Exemple :

```
Navbar

Sidebar

Footer

Card

Button

Input

Modal
```

---

## layouts

Organisation générale des pages.

Exemple :

```
AdminLayout

TeacherLayout

StudentLayout

AuthLayout
```

---

## pages

Toutes les pages du projet.

---

## routes

Gestion du routage React Router.

---

## services

Toutes les communications Axios.

Aucune requête HTTP ne devra être écrite directement dans les composants.

---

## hooks

Hooks personnalisés.

---

## context

Gestion de l'état global.

---

## styles

Styles globaux.

---

## utils

Fonctions utilitaires.

---

# 9. API REST

Chaque table possède :

- un modèle
- un contrôleur
- un routeur

Exemple :

```
utilisateurs

↓

UtilisateurModel

↓

UtilisateurController

↓

UtilisateurRoutes
```

---

# 10. Structure d'une requête

Client

↓

React

↓

Axios

↓

Express Route

↓

Controller

↓

Service

↓

Model

↓

MySQL

---

# 11. Authentification

Le système utilise :

JWT

bcrypt

Toutes les routes sensibles sont protégées.

Les rôles sont vérifiés avant toute opération.

---

# 12. Gestion des rôles

Trois rôles sont définis.

Administrateur

Formateur

Étudiant

Chaque rôle possède des permissions spécifiques.

---

# 13. Gestion des erreurs

Toutes les erreurs sont centralisées.

Format JSON :

```
{
   "success": false,
   "message": "Erreur..."
}
```

Les erreurs SQL ne doivent jamais être affichées directement.

---

# 14. Gestion des fichiers

Les vidéos sont stockées dans :

```
uploads/videos/
```

Les documents :

```
uploads/documents/
```

Les devoirs :

```
uploads/devoirs/
```

Les chemins sont enregistrés dans MySQL.

Jamais les fichiers eux-mêmes.

---

# 15. Variables d'environnement

Toutes les informations sensibles doivent être placées dans :

```
.env
```

Exemple :

```
PORT=

DB_HOST=

DB_USER=

DB_PASSWORD=

DB_NAME=

JWT_SECRET=
```

---

# 16. Sécurité

Toutes les données sont validées.

Les mots de passe sont chiffrés.

Les injections SQL doivent être évitées.

Les fichiers uploadés doivent être vérifiés.

Les routes sensibles nécessitent une authentification.

---

# 17. Performance

Les bonnes pratiques suivantes sont appliquées :

- Pagination
- Lazy Loading
- Compression HTTP
- Mise en cache lorsque nécessaire
- Optimisation des requêtes SQL

---

# 18. Architecture des composants React

Les composants doivent être :

- petits
- réutilisables
- indépendants
- documentés

Ils ne doivent pas contenir la logique métier.

---

# 19. Organisation des contrôleurs

Un contrôleur ne doit jamais :

- écrire directement du SQL complexe ;
- contenir la logique métier ;
- dépasser une taille raisonnable.

Les traitements complexes sont délégués aux services.

---

# 20. Organisation des modèles

Un modèle représente une table.

Aucun modèle ne représente plusieurs tables.

Les relations sont gérées par les clés étrangères existantes.

---

# 21. Journalisation (Logs)

Le Backend doit prévoir un système de journalisation pour :

- les erreurs ;
- les connexions ;
- les actions importantes.

---

# 22. Tests

Chaque fonctionnalité développée doit être testée.

Les principaux scénarios :

- authentification ;
- inscription ;
- création de formation ;
- passage d'un quiz ;
- dépôt d'un devoir ;
- messagerie.

---

# 23. Instructions pour Codex

Avant toute implémentation :

1. Lire ce document.

2. Respecter l'architecture MVC.

3. Respecter la séparation Frontend / Backend.

4. Créer des composants React réutilisables.

5. Utiliser uniquement la base de données officielle.

6. Ne jamais modifier la structure SQL.

7. Produire un code propre et documenté.

8. Utiliser les Skills présents dans `.agents/skills`.

---

# 24. Principes de développement

Le projet applique les principes suivants :

- SOLID
- DRY
- KISS
- Clean Architecture
- Separation of Concerns
- Single Responsibility Principle

---

# 25. Conclusion

Cette architecture constitue la référence officielle du développement.

Toutes les décisions techniques devront être compatibles avec ce document.

En cas de conflit entre une implémentation et cette architecture, l'architecture prévaut.