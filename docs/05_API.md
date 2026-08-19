# 05 - API REST

# E-Learning Universitaire Locale

Version : 1.0

---

# 1. Objectif

Ce document définit les règles de conception et de développement de l'API REST utilisée par la plateforme **E-Learning Universitaire Locale**.

L'API constitue l'unique point de communication entre :

- le Front-End React ;
- le Back-End Express ;
- la base de données MySQL.

Aucun composant React ne doit accéder directement à la base de données.

---

# 2. Architecture

```
React

↓

Axios

↓

API REST Express

↓

Services

↓

Models

↓

MySQL
```

Toutes les communications transitent par l'API.

---

# 3. Technologies

L'API est développée avec :

- Node.js
- Express.js
- JWT
- bcrypt
- Multer
- Express Validator
- MySQL

---

# 4. Format des échanges

Toutes les requêtes utilisent :

```
JSON
```

Toutes les réponses retournent du JSON.

---

# 5. URL de base

En développement :

```
http://localhost:5000/api
```

Toutes les routes commencent par :

```
/api
```

---

# 6. Authentification

L'API utilise :

JWT (JSON Web Token)

Le token est envoyé dans :

```
Authorization

Bearer TOKEN
```

Toutes les routes privées nécessitent un token valide.

---

# 7. Structure des réponses

Réussite

```json
{
    "success": true,
    "message": "Opération effectuée avec succès.",
    "data": {}
}
```

Erreur

```json
{
    "success": false,
    "message": "Une erreur est survenue."
}
```

Validation

```json
{
    "success": false,
    "errors":[]
}
```

---

# 8. Codes HTTP

| Code | Description |
|-------|-------------|
|200|Succès|
|201|Créé|
|204|Aucun contenu|
|400|Requête invalide|
|401|Non authentifié|
|403|Accès interdit|
|404|Introuvable|
|409|Conflit|
|422|Erreur de validation|
|500|Erreur serveur|

---

# 9. Authentification

## POST

```
/auth/login
```

Connexion.

---

## POST

```
/auth/register
```

Création du compte étudiant.

---

## POST

```
/auth/logout
```

Déconnexion.

---

## GET

```
/auth/profile
```

Informations utilisateur.

---

# 10. API Utilisateurs

```
GET /users

GET /users/:id

POST /users

PUT /users/:id

DELETE /users/:id
```

---

# 11. API Catégories

```
GET

POST

PUT

DELETE
```

---

# 12. API Formations

```
GET /formations

GET /formations/:id

POST /formations

PUT /formations/:id

DELETE /formations/:id
```

---

# 13. API Modules

```
GET

POST

PUT

DELETE
```

---

# 14. API Chapitres

CRUD complet.

---

# 15. API Leçons

CRUD complet.

---

# 16. API Vidéos

Fonctionnalités :

- upload
- lecture
- suppression

Les fichiers sont enregistrés dans :

```
uploads/videos/
```

---

# 17. API Documents

Fonctionnalités :

- upload
- téléchargement
- suppression

---

# 18. API Inscriptions

Permet :

- inscrire un étudiant ;
- consulter les inscriptions ;
- supprimer une inscription.

---

# 19. API Progressions

Lecture uniquement.

La progression est calculée automatiquement.

---

# 20. API Quiz

Fonctionnalités :

- création ;
- modification ;
- suppression ;
- consultation.

---

# 21. API Questions

CRUD complet.

---

# 22. API Réponses

CRUD complet.

---

# 23. API Tentatives

Création d'une tentative.

Consultation des résultats.

---

# 24. API Réponses Étudiants

Enregistrement des réponses.

Correction automatique.

---

# 25. API Devoirs

Création.

Modification.

Suppression.

Consultation.

---

# 26. API Soumissions

Téléversement.

Notation.

Consultation.

---

# 27. API Avis

Création.

Modification.

Suppression.

Lecture.

---

# 28. API Conversations

Création.

Liste.

Suppression.

---

# 29. API Messages

Envoi.

Lecture.

Suppression.

---

# 30. API Notifications

Création.

Lecture.

Marquer comme lue.

Suppression.

---

# 31. Pagination

Les listes volumineuses utilisent :

```
?page=1

&limit=20
```

---

# 32. Recherche

Utiliser :

```
?q=javascript
```

---

# 33. Tri

Exemple :

```
?sort=titre

?order=asc
```

---

# 34. Filtrage

Exemple :

```
?categorie=Programmation

?niveau=Débutant
```

---

# 35. Upload

Les fichiers sont envoyés avec :

```
multipart/form-data
```

Utiliser Multer.

---

# 36. Validation

Toutes les données sont validées avant traitement.

Utiliser :

Express Validator.

---

# 37. Sécurité

Toutes les routes privées sont protégées.

Les rôles sont vérifiés.

Les mots de passe sont chiffrés.

Les injections SQL sont interdites.

---

# 38. Gestion des erreurs

Toutes les erreurs sont centralisées.

Aucune erreur SQL ne doit être renvoyée au Front-End.

---

# 39. Versionnement

Version actuelle :

```
v1
```

Les futures versions utiliseront :

```
/api/v2
```

---

# 40. Documentation

Chaque contrôleur doit être documenté.

Chaque route doit être commentée.

Les paramètres doivent être expliqués.

---

# 41. Instructions pour Codex

Avant de développer l'API :

1. Lire entièrement ce document.

2. Lire la documentation de la base de données.

3. Générer une route par ressource.

4. Générer un contrôleur par table.

5. Générer un modèle par table.

6. Respecter l'architecture MVC.

7. Respecter les conventions REST.

8. Utiliser les middlewares appropriés.

9. Ne jamais modifier la base de données.

10. Tester chaque endpoint avant de passer au suivant.

---

# 42. Conclusion

L'API REST constitue le cœur de la communication entre le Front-End React et le Back-End Express.

Toute implémentation devra respecter les conventions définies dans ce document afin de garantir une application cohérente, évolutive et maintenable.