# TUTORE — Documentation exhaustive de l'API REST

> Document généré à partir du code réel de `backend/src/routes` (source de vérité),
> des middlewares (`auth.middleware.js`, `role.middleware.js`, `validate.js`),
> des validateurs `express-validator` et du contrat d'erreurs `src/utils/app-errors.js`.
> Aucun endpoint fictif : seule l'API effectivement montée dans `backend/src/app.js`
> est documentée.

---

## Sommaire

1. [Conventions générales](#conventions-générales)
2. [Endpoints système](#endpoints-système)
3. [Authentification `/api/auth`](#authentification-apiauth)
4. [Utilisateurs `/api/users`](#utilisateurs-apiusers)
5. [Catégories `/api/categories`](#catégories-apicategories)
6. [Formations `/api/formations`](#formations-apiformations)
7. [Chapitres `/api/chapters`](#chapitres-apichapters)
8. [Sections `/api/sections`](#sections-apisections)
9. [Sous-sections `/api/sous-sections`](#sous-sections-apisous-sections)
10. [Quiz `/api/quizzes`](#quiz-apiquizzes)
11. [Questions `/api/questions`](#questions-apiquestions)
12. [Réponses QCM `/api/answers`](#réponses-qcm-apianswers)
13. [Tentatives `/api/attempts`](#tentatives-apiattempts)
14. [Réponses étudiants `/api/student-answers`](#réponses-étudiants-apistudent-answers)
15. [Inscriptions `/api/enrollments`](#inscriptions-apienrollments)
16. [Progressions `/api/progressions`](#progressions-apiprogressions)
17. [Avis `/api/reviews`](#avis-apireviews)
18. [Conversations `/api/conversations`](#conversations-apiconversations)
19. [Participants de conversation `/api/conversation-participants`](#participants-de-conversation-apiconversation-participants)
20. [Messages `/api/messages`](#messages-apimessages)
21. [Notifications `/api/notifications`](#notifications-apinotifications)
22. [Fichiers protégés `/api/files`](#fichiers-protégés-apifiles)

---

## Conventions générales

### Base URL

```
http://localhost:3010
```

Le port vient de `backend/.env` (`PORT=3010`). Tous les chemins ci-dessous sont
préfixés par `/api` sauf les deux endpoints système (`/` et `/api/test-db`).

### Format des réponses

**Succès** (toujours HTTP 200 sauf indication contraire) :

```json
{ "success": true, "message": "...", "data": ... }
```

`data` peut être un objet, un tableau ou `null`. Certaines listes paginées
ajoutent `pagination` (voir `GET /api/users`).

**Erreurs** — contrat unique `{ "success": false, "message": "...", "errors": ... }` :

| Code | Cause | Message type |
|------|-------|--------------|
| 400 | Requête malformée (ex. nom de fichier invalide) | message métier |
| 401 | Token manquant/invalide/expiré | « Token d'authentification manquant. » / « Token invalide ou expiré. » |
| 403 | Rôle non autorisé (`roleMiddleware`) ou accès refusé métier | « Accès interdit. Vous n'avez pas les permissions nécessaires. » ou message métier |
| 404 | Ressource introuvable | message métier (« Formation introuvable. », …) |
| 409 | Conflit métier (doublon, état invalide…) | message métier |
| 422 | Validation `express-validator` échouée | « Erreur de validation. » + `errors: [{ field, message }]` |
| 500 | Erreur technique interne | « Une erreur interne est survenue. » (jamais de détail SQL/stack) |

### Authentification

- Header : `Authorization: Bearer <JWT>` (exception : `/api/files/:filename`
  accepte aussi `?token=<JWT>`).
- Payload du JWT : `{ id, role, email }`.
- Rôles (table `roles`) : **Administrateur**, **Formateur**, **Etudiant**
  (`req.user.role`).
- L'identité utilisée par tous les services provient exclusivement du token
  (`req.user.id`) ; jamais d'un champ envoyé par le client quand il est imposé.

### Légende rôles

| Sigle | Rôle |
|-------|------|
| ADM | Administrateur |
| FOR | Formateur |
| ETD | Etudiant |

« Public » = aucun token requis.

---

## Endpoints système

### GET /

Infos de l'application. Public.

**Réponse 200**

```json
{ "application": "TUTORE", "version": "1.0.0", "status": "API opérationnelle" }
```

### GET /api/test-db

Vérifie la connexion MySQL (ping). Public.

**Réponse 200**

```json
{ "success": true, "message": "Connexion à la base de données réussie." }
```

**Réponse 500**

```json
{ "success": false, "message": "Impossible de se connecter à la base de données." }
```

---

## Authentification `/api/auth`

Source : `routes/auth.route.js`, `controllers/auth.controller.js`,
`validators/auth.validator.js`, `services/auth.service.js`.

### POST /api/auth/register

Inscription publique (rate-limitée anti brute-force). Le compte créé est
**toujours** un étudiant.

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| nom | string | requis, 2–100 caractères |
| prenom | string | requis, 2–100 caractères |
| email | string | requis, e-mail valide (normalisé) |
| mot_de_passe | string | requis, min. 8 caractères |

**Exemple requête**

```json
{ "nom": "Kabila", "prenom": "Grace", "email": "grace.kabila@example.local", "mot_de_passe": "MotDePasse123" }
```

**Réponse 201**

```json
{
  "success": true,
  "message": "Inscription réussie.",
  "data": { "id": 12, "nom": "Kabila", "prenom": "Grace", "email": "grace.kabila@example.local", "role": "Etudiant" }
}
```

**Erreurs** : 422 validation · 409 e-mail déjà utilisé.

### POST /api/auth/login

Connexion publique (rate-limitée).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| email | string | requis, e-mail valide |
| mot_de_passe | string | requis, min. 8 caractères |

**Réponse 200**

```json
{
  "success": true,
  "message": "Connexion réussie.",
  "data": {
    "token": "<JWT>",
    "utilisateur": { "id": 12, "nom": "Kabila", "prenom": "Grace", "email": "grace.kabila@example.local", "role": "Etudiant" }
  }
}
```

**Erreurs** : 401 « Adresse e-mail ou mot de passe incorrect. » · 422 validation.

### GET /api/auth/me

Profil de l'utilisateur connecté (identité déduite du token).

**Auth** : requise (tous rôles).

**Réponse 200** : `data` = objet utilisateur (sans mot de passe).

**Erreurs** : 401.

### PUT /api/auth/password

Changement du mot de passe de l'utilisateur connecté.

**Auth** : requise (tous rôles).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| mot_de_passe_actuel | string | requis |
| mot_de_passe | string | requis, min. 8 caractères |

**Réponse 200** : `{ "success": true, "message": "Mot de passe modifié avec succès.", "data": ... }`

**Erreurs** : 401 mot de passe actuel incorrect · 422 validation.

---

## Utilisateurs `/api/users`

### GET /api/users

Liste de tous les utilisateurs, paginée côté contrôleur.

**Rôles** : ADM.

**Query params** : `page` (int ≥ 1), `limit` (int ≥ 1) — optionnels.

**Réponse 200**

```json
{
  "success": true,
  "message": "Liste des utilisateurs récupérée avec succès.",
  "data": [ { "id_utilisateur": 1, "nom": "...", "prenom": "...", "email": "...", "role": "..." } ],
  "pagination": { "page": 1, "limit": 10, "totalPages": 1, "totalItems": 3 }
}
```

### GET /api/users/:id

Détail d'un utilisateur.

**Auth** : requise (tous rôles).

**Paramètres** : `id` (int) — identifiant utilisateur.

**Réponse 200** : `data` = objet utilisateur.

**Erreurs** : 404 « Utilisateur introuvable. »

### POST /api/users

Créer un utilisateur (permet de créer des comptes Formateur/Administrateur).

**Rôles** : ADM.

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_role | int | requis, ≥ 1 (1=Administrateur, 2=Formateur, 3=Etudiant) |
| nom | string | requis, 2–100 |
| prenom | string | requis, 2–100 |
| email | string | requis, e-mail valide |
| mot_de_passe | string | requis, min. 8 caractères |

**Réponse 200** : `"data": { "id": <nouvel id> }`

**Erreurs** : 409 e-mail déjà utilisé · 422 validation.

### PUT /api/users/:id

Modifier un utilisateur.

**Rôles** : ADM.

**Body** (tous optionnels) : `id_role` (int ≥ 1), `nom`, `prenom`, `email`.

**Réponse 200** : `"data"` = objet mis à jour.

**Erreurs** : 404 · 409 · 422.

### DELETE /api/users/:id

Supprimer un utilisateur.

**Rôles** : ADM.

**Réponse 200** : `{ "success": true, "message": "Utilisateur supprimé avec succès.", "data": null }`

**Erreurs** : 404 · 409 (contrainte FK si données liées).

---

## Catégories `/api/categories`

### GET /api/categories

Toutes les catégories. **Public.**

**Réponse 200**

```json
{ "success": true, "message": "...", "data": [ { "id_categorie": 1, "nom_categorie": "..." } ] }
```

### GET /api/categories/:id

Une catégorie. **Public.** — **Erreurs** : 404.

### POST /api/categories

**Rôles** : ADM. **Body** : `nom_categorie` (string requis, 2–100).

**Réponse 200** : catégorie créée. **Erreurs** : 422.

### PUT /api/categories/:id

**Rôles** : ADM. **Body** : `nom_categorie` (requis). **Réponse 200** : modification. **Erreurs** : 404 · 422.

### DELETE /api/categories/:id

**Rôles** : ADM. **Réponse 200** : suppression. **Erreurs** : 404 · 409 (FK si formations liées).

---

## Formations `/api/formations`

Table `formations` : `id_formation, id_categorie, id_formateur, titre,
description, statut ENUM('BROUILLON','PUBLIEE'), created_at`.

### GET /api/formations

Catalogue filtré par rôle :

- **ADM** : toutes les formations ;
- **FOR** : toutes + indicateur de propriété ;
- **ETD** : formations publiées (et les siennes si inscrit).

**Auth** : requise.

**Réponse 200** : `data` = tableau de formations.

### GET /api/formations/:id

Une formation. **Auth** : requise (tous rôles). **Erreurs** : 404 « Formation introuvable. »

### POST /api/formations

**Rôles** : ADM, FOR.

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_categorie | int | requis, ≥ 1 |
| titre | string | requis, 3–200 |
| description | string | optionnel, ≤ 5000 |
| id_formateur | int | optionnel (ADM seulement ; sinon imposé au token) |

> Note : une formation créée via ce endpoint démarre en statut **BROUILLON**
> (choix du service) et doit être publiée pour être visible/accessible aux étudiants.

**Exemple requête**

```json
{ "id_categorie": 1, "titre": "Algorithmique de base", "description": "Introduction aux algorithmes." }
```

**Réponse 200** : `"data": { "id": <nouvel id> }`

**Erreurs** : 404 catégorie introuvable · 422 validation.

### PUT /api/formations/:id

Modifier. **Rôles** : ADM, FOR (propriétaire uniquement — sinon 403).
Même body que POST (`id_categorie` et `titre` requis).
**Réponse 200** : `"data"` = objet mis à jour. **Erreurs** : 404 · 403.

### PATCH /api/formations/:id/publish

Publier (BROUILLON → PUBLIEE). **Rôles** : ADM, FOR propriétaire.
Pas de body. **Réponse 200**. **Erreurs** : 404 · 403.

### PATCH /api/formations/:id/unpublish

Dépublier (PUBLIEE → BROUILLON). **Rôles** : ADM, FOR propriétaire.
Pas de body. **Réponse 200**. **Erreurs** : 404 · 403.

### DELETE /api/formations/:id

Supprimer. **Rôles** : ADM, FOR propriétaire. **Réponse 200**. **Erreurs** : 404 · 403 · 409 (données liées).

---

## Chapitres `/api/chapters`

Table `chapitres` : `id_chapitre, id_formation, titre, description, ordre`.

### GET /api/chapters

Vue gestion : tous les chapitres. **Rôles** : ADM, FOR.

### GET /api/chapters/formation/:id_formation

Chapitres d'une formation — **comportement dual** :

- **ADM / FOR** : liste complète des chapitres (`data` = tableau) ;
- **ETD** : **vue PARCOURS** avec verrouillage séquentiel.

**Auth** : requise.

**Réponse 200 (étudiant)**

```json
{
  "success": true,
  "data": {
    "formation": { "id_formation": 28, "titre": "Algorithmique de base" },
    "chapitres": [
      { "id_chapitre": 51, "titre": "Chapitre 1 : Premiers pas", "description": "Les bases.", "ordre": 1, "a_quiz": true, "valide": false, "accessible": true },
      { "id_chapitre": 52, "titre": "Chapitre 2 : Approfondissement", "description": "La suite.", "ordre": 2, "a_quiz": false, "valide": false, "accessible": false }
    ],
    "progression_pourcentage": 0
  }
}
```

`accessible` = chapitres précédents tous validés ; `valide` = quiz réussi ou
chapitre sans quiz marqué terminé.

**Erreurs** : 404 formation introuvable · 403 rôle non géré.

### GET /api/chapters/:id

Un chapitre. Pour un **étudiant**, le backend vérifie inscription + chapitres
précédents validés (sinon **403**). **Auth** : requise. **Erreurs** : 404 · 403.

### POST /api/chapters

**Rôles** : ADM, FOR (propriétaire de la formation).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_formation | int | requis, ≥ 1 |
| titre | string | requis, 3–150 |
| description | string | optionnel, ≤ 2000 |
| ordre | int | optionnel, ≥ 0 (auto-calculé sinon) |

**Réponse 200** : `"data": { "id": <nouvel id> }`. **Erreurs** : 404 · 403 · 422.

### PUT /api/chapters/:id

**Rôles** : ADM, FOR propriétaire. **Body** : `titre` ?, `description` ?, `ordre` ? (tous optionnels).
**Réponse 200** : `"data"` = chapitre mis à jour. **Erreurs** : 404 · 403 · 422.

### PATCH /api/chapters/formation/:id_formation/reorder

Réordonner. **Rôles** : ADM, FOR propriétaire.

**Body** : `{ "chapitres": [<id>, <id>, ...] }` — ordre complet voulu.

**Réponse 200**. **Erreurs** : 404 · 403 · 409 (liste invalide).

### POST /api/chapters/:id/complete

Marquer comme terminé un chapitre **SANS quiz** (étudiant inscrit).

**Auth** : requise (étudiant concerné ; vérifs inscription dans le service).

**Réponse 200** : `{ "success": true, "message": "Chapitre terminé.", "data": ... }`

**Erreurs** : 404 · 403 non inscrit · 409 « Ce chapitre est validé par son quiz. Il ne peut pas être marqué manuellement. »

### DELETE /api/chapters/:id

**Rôles** : ADM, FOR propriétaire. **Réponse 200**. **Erreurs** : 404 · 403 · 409.

---

## Sections `/api/sections`

Table `sections` : `id_section, id_chapitre, titre, description, ordre`.

### GET /api/sections

Vue gestion. **Rôles** : ADM, FOR.

### GET /api/sections/chapter/:id_chapitre

Sections d'un chapitre. Étudiant : chapitre accessible uniquement
(**403** si verrouillé). **Auth** : requise. **Erreurs** : 404 · 403.

### GET /api/sections/:id

Une section. **Auth** : requise. **Erreurs** : 404.

### POST /api/sections

**Rôles** : ADM, FOR (propriétaire du chapitre).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_chapitre | int | requis, ≥ 1 |
| titre | string | optionnel, ≤ 200 |
| description | string | optionnel, ≤ 2000 |
| ordre | int | optionnel, ≥ 0 |

**Réponse 200** : `"data": { "id": <nouvel id> }`. **Erreurs** : 404 · 403 · 422.

### PUT /api/sections/:id

**Rôles** : ADM, FOR. Body : `titre` ?, `description` ?, `ordre` ?.
**Réponse 200** : `"data"` = section mise à jour. **Erreurs** : 404 · 403 · 422.

### PATCH /api/sections/chapter/:id_chapitre/reorder

**Rôles** : ADM, FOR. Body : `{ "sections": [<id>, ...] }`. **Réponse 200**.

### DELETE /api/sections/:id

Supprime la section **et ses sous-sections** (cascade applicative).
**Rôles** : ADM, FOR. **Réponse 200**. **Erreurs** : 404 · 403.

---

## Sous-sections `/api/sous-sections`

Unité de contenu pédagogique **rich text** (HTML long ≤ 2 Mo stocké en LONGTEXT,
restitué tel quel aux utilisateurs autorisés).

### GET /api/sous-sections

Vue gestion. **Rôles** : ADM, FOR.

### GET /api/sous-sections/section/:id_section

Sous-sections d'une section (liste légère). Étudiant : section accessible
uniquement (**403**). **Auth** : requise.

### GET /api/sous-sections/:id

Une sous-section **avec son contenu HTML**. Étudiant : inscrit + chapitre
accessible (**403** sinon). **Auth** : requise.

**Réponse 200 (extrait)**

```json
{
  "success": true,
  "data": {
    "id_sous_section": 9,
    "id_section": 4,
    "titre": "Sous-section 1.1.1",
    "contenu": "<h2>Bienvenue</h2><p>Voici votre <strong>première</strong> leçon.</p>",
    "ordre": 1
  }
}
```

### POST /api/sous-sections

**Rôles** : ADM, FOR (propriétaire de la section).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_section | int | requis, ≥ 1 |
| titre | string | optionnel, ≤ 200 |
| contenu | string | optionnel (peut être null), **HTML rich text ≤ 2 000 000 caractères** |
| ordre | int | optionnel, ≥ 0 |

**Réponse 200** : `"data": { "id": <nouvel id> }`. **Erreurs** : 404 · 403 · 422.

### PUT /api/sous-sections/:id

**Rôles** : ADM, FOR. Body : `titre` ?, `contenu` ?, `ordre` ?.
**Réponse 200**. **Erreurs** : 404 · 403 · 422.

### PATCH /api/sous-sections/section/:id_section/reorder

**Rôles** : ADM, FOR. Body : `{ "sous_sections": [<id>, ...] }`. **Réponse 200**.

### DELETE /api/sous-sections/:id

**Rôles** : ADM, FOR. **Réponse 200**. **Erreurs** : 404 · 403.

---

## Quiz `/api/quizzes`

Table `quiz` : `id_quiz, id_chapitre, titre, score_reussite DECIMAL(5,2) DEFAULT 50`.
**Un seul quiz par chapitre** (tentative de doublon → 409).

### GET /api/quizzes

Tous les quiz. **Rôles** : ADM, FOR.

### GET /api/quizzes/chapter/:id_chapitre

Quiz d'un chapitre. Étudiant : chapitre accessible uniquement. **Auth** : requise.

### GET /api/quizzes/:id

Un quiz. **Auth** : requise. **Erreurs** : 404.

### POST /api/quizzes

**Rôles** : ADM, FOR (propriétaire du chapitre).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_chapitre | int | requis, ≥ 1 |
| titre | string | requis, 3–200 |
| score_reussite | number | optionnel, 0–100 (défaut 50) |

**Réponse 200** : `"data": { "id": <nouvel id> }`

**Erreurs** : **409** « Un quiz existe déjà pour ce chapitre » · 404 · 403 · 422.

### PUT /api/quizzes/:id

**Rôles** : ADM, FOR. Body : `titre` ?, `score_reussite` ?. **Réponse 200** : `"data"` = quiz mis à jour.

### DELETE /api/quizzes/:id

**Rôles** : ADM, FOR. **Réponse 200**. **Erreurs** : 404 · 403 · 409 (questions/tentatives liées).

---

## Questions `/api/questions`

Table `questions` : `id_question, id_quiz, enonce, type ENUM('QCM') DEFAULT 'QCM', points INT DEFAULT 1`.
Seul le type `QCM` est accepté : `type` ne peut prendre que la valeur `QCM`, et le
type ne peut jamais être modifié après création (voir `PUT /api/questions/:id`).

### GET /api/questions/quiz/:id_quiz

Questions d'un quiz. **Étudiant autorisé** : les réponses QCM sont renvoyées
**sans** `est_correcte`. **Auth** : requise.

### GET /api/questions

Toutes les questions. **Rôles** : ADM, FOR.

### GET /api/questions/:id

Une question. Étudiant : quiz accessible requis. **Auth** : requise.

### POST /api/questions

**Rôles** : ADM, FOR (propriétaire du quiz).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_quiz | int | requis, ≥ 1 |
| enonce | string | requis, min. 3 caractères |
| type | string | optionnel : `QCM` uniquement (défaut `QCM`) — tout autre valeur est refusée (422/409) |
| points | int | optionnel, ≥ 1 (défaut 1) |

**Réponse 200** : `"data": { "id": <nouvel id> }`. **Erreurs** : 404 · 403 · 422.

### PUT /api/questions/:id

**Rôles** : ADM, FOR. Body : `enonce` ?, `points` ?.
**`type` est REFUSÉ** (422) : « Le type d'une question ne peut pas être modifié. »
(règle validateur + service). **Réponse 200** : `"data"` = question mise à jour.

### DELETE /api/questions/:id

**Rôles** : ADM, FOR. **Réponse 200**. **Erreurs** : 404 · 403 · 409.

---

## Réponses QCM `/api/answers`

Table `reponses` : `id_reponse, id_question, contenu, est_correcte BOOLEAN`.
Appartiennent toujours à une question **QCM**. Une seule réponse correcte par
question (garanti côté service).

### GET /api/answers

Toutes les réponses (avec corrigé). **Rôles** : ADM, FOR.

### GET /api/answers/question/:id_question

Choix d'une question QCM. **Étudiant autorisé : `est_correcte` JAMAIS exposé.**
**Auth** : requise.

**Réponse 200 (étudiant)**

```json
{
  "success": true,
  "data": [
    { "id_reponse": 21, "contenu": "HyperText Markup Language" },
    { "id_reponse": 22, "contenu": "Hyper Text Machine Language" }
  ]
}
```

(formateur/admin : mêmes objets + champ `est_correcte`.)

### GET /api/answers/:id

Une réponse. Étudiant : quiz accessible requis. **Auth** : requise.

### POST /api/answers

**Rôles** : ADM, FOR (propriétaire du quiz de la question).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_question | int | requis, ≥ 1 (question QCM) |
| texte | string | requis, 1–1000 (mappé sur la colonne `contenu`) |
| est_correcte | boolean | optionnel (défaut false) |

**Réponse 200** : `"data": { "id": <nouvel id> }`. **Erreurs** : 404 · 403 · 422.

### PUT /api/answers/:id

**Rôles** : ADM, FOR. Body : `texte` ?, `est_correcte` ?. **Réponse 200** : `"data"` = réponse mise à jour.

### DELETE /api/answers/:id

**Rôles** : ADM, FOR. **Réponse 200**. **Erreurs** : 404 · 403 · 409.

---

## Tentatives `/api/attempts`

Toutes les questions sont **QCM** et la correction est **100 % automatique** côté
serveur au moment de la soumission. Il n'existe aucun workflow de correction
manuelle (pas de `corriger`, pas de `A_CORRIGER`, pas de `date_correction`).

Cycle de vie : `EN_COURS` → (`SOUMISE`→)`REUSSIE`/`ECHOUEE` (QCM seuls,
auto-corrigés). La valeur `SOUMISE` existe dans l'enum mais le produit ne
transitionne jamais vers elle : la soumission passe directement de `EN_COURS`
à `REUSSIE` ou `ECHOUEE`.
Note TOUJOURS recalculée serveur : points obtenus / points totaux × 100.

### GET /api/attempts

Toutes les tentatives. **Rôles** : ADM.

**Réponse 200** : lignes `{ id_tentative, id_utilisateur, nom, prenom, email, id_quiz, quiz, score_reussite, note, statut, date_soumission, created_at }`.

### GET /api/attempts/user/:id_utilisateur

Tentatives d'un utilisateur.

**Auth** : requise — étudiant : uniquement ses propres id (sinon 403) ;
formateur : ses étudiants ; ADM : tout le monde.

**Réponse 200** : tableau (même forme que GET /).

### POST /api/attempts/quiz/:id_quiz/start

Démarrer (ou reprendre) une tentative.

**Rôles** : ETD. Conditions : inscrit + chapitre accessible + quiz non réussi.
Idempotent : renvoie la tentative EN_COURS existante.

**Réponse 200**

```json
{
  "success": true,
  "message": "Tentative démarrée avec succès.",
  "data": {
    "tentative": { "id_tentative": 34, "id_quiz": 7, "statut": "EN_COURS", "created_at": "2026-08-23T00:00:00.000Z" },
    "score_reussite": 50,
    "questions": [
      { "id_question": 13, "enonce": "HTML signifie ?", "type": "QCM", "points": 1,
        "reponses": [ { "id_reponse": 27, "contenu": "HyperText Markup Language" }, { "id_reponse": 28, "contenu": "Hyper Text Machine Language" } ] }
    ]
  }
}
```

`est_correcte` n'apparaît jamais dans `questions[].reponses[]`.

**Erreurs** : 403 non inscrit/chapitre verrouillé · 404 quiz introuvable ·
**409** « Ce quiz est déjà réussi. Le chapitre suivant est débloqué. »

### POST /api/attempts/:id/submit

Soumettre une tentative EN_COURS. **Correction automatique** (QCM uniquement).

**Rôles** : ETD (propriétaire de la tentative uniquement).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| reponses | array | requis — un élément PAR question du quiz |
| reponses[].id_question | int | requis, ≥ 1 |
| reponses[].id_reponses | array[int] | requis — ids des choix cochés pour cette question QCM |

**Exemple requête**

```json
{
  "reponses": [
    { "id_question": 13, "id_reponses": [27] }
  ]
}
```

**Comportement** :
- chaque question du quiz doit être présente dans `reponses[]` (sinon **409** « La question N n'a pas été répondue. ») ;
- toute question étrangère au quiz → 409 ;
- tout id de réponse n'appartenant pas à sa question → 409 ;
- toute question dont le type n'est pas `QCM` → 409 ;
- QCM : auto-corrigé (égalité exacte des ensembles d'ids choisis/corrects) ;
- note = points_obtenus / totalPoints × 100 (arrondi à 2 décimales) ;
- statut = `REUSSIE` si note ≥ `score_reussite`, sinon `ECHOUEE` ;
- notification étudiant immédiate (« Quiz réussi » / « Quiz échoué ») ;
- progression recalculée automatiquement.

**Réponse 200**

```json
{
  "success": true,
  "message": "Tentative soumise avec succès.",
  "data": {
    "id_tentative": 34,
    "statut": "REUSSIE",
    "note": 100,
    "score_reussite": 50,
    "message": "Quiz réussi. Le chapitre suivant est débloqué."
  }
}
```

**Erreurs** : 403 tentative d'autrui · 404 · **409** soumission incomplète /
déjà soumise (« Cette tentative a déjà été soumise… ») / question étrangère au
quiz / réponse n'appartenant pas à la question / question non QCM.

### GET /api/attempts/quiz/:id_quiz/mine

Historique de l'étudiant courant sur un quiz (quiz accessible requis).

**Rôles** : ETD.

**Réponse 200**

```json
{
  "success": true,
  "data": {
    "id_quiz": 7,
    "score_reussite": 50,
    "nb_tentatives": 2,
    "reussi": true,
    "tentative_en_cours": null,
    "peut_passer": false,
    "tentatives": [
      { "id_tentative": 33, "statut": "ECHOUEE", "note": 25, "date_soumission": "...", "created_at": "..." },
      { "id_tentative": 34, "statut": "REUSSIE", "note": 100, "date_soumission": "...", "created_at": "..." }
    ]
  }
}
```

### GET /api/attempts/:id

Détail d'une tentative (ligne enrichie : nom/prénom/email étudiant + titre quiz +
score_reussite). Propriétaire ou ADM (assertPersonalAccess). **Erreurs** : 404 · 403.

---

## Réponses étudiants `/api/student-answers`

Lecture seule. Chaque ligne :
`{ id_reponse_etudiant, id_tentative, id_utilisateur, id_quiz, id_question,
question, type_question, points_question, id_reponse, reponse_choisie,
est_correcte }`.

**Cloisonnement du corrigé** : `est_correcte` n'est visible que si l'appelant
peut voir la correction (formateur propriétaire du quiz ou ADM) ; un étudiant
voit ses propres lignes **sans** `est_correcte`. Les champs `reponse_libre` et
`note` n'existent plus (question/réponse libres retirées du produit).

### GET /api/student-answers

Toutes les réponses étudiants. **Rôles** : ADM.

### GET /api/student-answers/attempt/:id_tentative

Réponses d'une tentative.

**Rôles** : ETD (ses tentatives), FOR (tentatives de SES quiz), ADM.

**Réponse 200** : tableau des lignes décrites ci-dessus (filtrées selon droits).

**Erreurs** : 404 tentative introuvable · 403 accès refusé.

### GET /api/student-answers/:id

Une réponse étudiante. Mêmes règles de visibilité du corrigé.
**Erreurs** : 404 · 403.

---

## Inscriptions `/api/enrollments`

### GET /api/enrollments

Toutes les inscriptions. **Rôles** : ADM, FOR.

### GET /api/enrollments/user/:id_utilisateur

Inscriptions d'un utilisateur. Étudiant : les siennes uniquement (sinon 403).
**Auth** : requise.

### GET /api/enrollments/formation/:id_formation

Étudiants d'une formation. **Rôles** : ADM, FOR.

### GET /api/enrollments/:id

Une inscription. **Auth** : requise. **Erreurs** : 404.

### POST /api/enrollments

Auto-inscription d'un étudiant à une formation **PUBLIEE**.

**Rôles** : ADM, FOR, ETD.

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_formation | int | requis, ≥ 1 |
| id_utilisateur | int | optionnel — **imposé au token** pour tout non-admin |

**Effets automatiques** : conversation formateur/étudiant créée
(sujet `Formation : <titre>`), progression initiale 0 %, notification formateur.

**Réponse 200** : `"data": { "id": <nouvelle inscription> }`

**Erreurs** : **403** « Inscription impossible : cette formation n'est pas publiée. » ·
**409** « Cet utilisateur est déjà inscrit à cette formation. » · 404 · 422.

### DELETE /api/enrollments/:id

**Rôles** : ADM, FOR, ETD — un non-admin ne supprime que SA propre inscription
(assertPersonalAccess). **Réponse 200**. **Erreurs** : 404 · 403.

---

## Progressions `/api/progressions`

Lecture seule + recalcul admin. `pourcentage` = chapitres validés / total × 100
(une décimale). La valeur persistée n'est qu'un cache : elle est recalculée à
la lecture (`GET /me`).

Ligne : `{ id_progression, id_utilisateur, nom, prenom, email, id_formation, formation, pourcentage }`.

### GET /api/progressions/me

Progression de l'utilisateur connecté (toutes ses formations). **Auth** : requise.

### GET /api/progressions

Toutes les progressions. **Rôles** : ADM.

### GET /api/progressions/user/:id_utilisateur

Progressions d'un utilisateur. Étudiant : les siennes ; FOR : celles de ses
étudiants (partage d'au moins une formation) ; ADM : tout. **Sinon 403.**

### GET /api/progressions/formation/:id_formation

Progressions des inscrits d'une formation. **Rôles** : FOR propriétaire, ADM.

### POST /api/progressions/formation/:id_formation/recompute

Recalculer les progressions de tous les inscrits. **Rôles** : ADM.

**Réponse 200** : résultat du recalcul.

**Erreurs communes** : 404 formation introuvable · 403 non autorisé.

---

## Avis `/api/reviews`

### GET /api/reviews

Tous les avis. **Rôles** : ADM.

### GET /api/reviews/user/:id_utilisateur

Avis d'un utilisateur. **Auth** : requise.

### GET /api/reviews/formation/:id_formation

Avis d'une formation. **Auth** : requise.

### GET /api/reviews/:id

Un avis. **Auth** : requise. **Erreurs** : 404.

### POST /api/reviews

Laisser un avis (inscription à la formation OBLIGATOIRE ; auteur imposé par le
token ; un seul avis par utilisateur et formation).

**Auth** : requise (tous rôles — pratique : ETD).

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_formation | int | requis, ≥ 1 |
| note | int | requis, 1–5 |
| commentaire | string | optionnel |
| id_utilisateur | int | requis par le validateur mais **imposé au token** par le service |

**Réponse 200** : `"data": { "id": <nouvel avis> }` + notification formateur.

**Erreurs** : 403 « Vous devez être inscrit à cette formation pour laisser un avis. » ·
**409** « Cet utilisateur a déjà donné un avis pour cette formation. » · 404 · 422.

### PUT /api/reviews/:id

**Auth** : requise — auteur de l'avis ou ADM (sinon 403).
Body : même validation que POST. **Réponse 200** : `"data"` = avis mis à jour.

### DELETE /api/reviews/:id

**Auth** : requise — auteur ou ADM. **Réponse 200**. **Erreurs** : 404 · 403.

---

## Conversations `/api/conversations`

### GET /api/conversations

Toutes les conversations. **Rôles** : ADM.

### GET /api/conversations/:id

Une conversation. **Auth** : requise. **Erreurs** : 404.

### POST /api/conversations

**Auth** : requise.

**Body** (tout optionnel) : `sujet` (≤ 200), `participants` (array d'int ≥ 1).

**Réponse 200** : conversation créée (+ participants si fournis).

### PUT /api/conversations/:id

**Rôles** : ADM. Body : `sujet` ?. **Réponse 200**.

### DELETE /api/conversations/:id

**Rôles** : ADM. **Réponse 200**. **Erreurs** : 404.

---

## Participants de conversation `/api/conversation-participants`

### GET /api/conversation-participants

Tous les participants. **Rôles** : ADM.

### GET /api/conversation-participants/conversation/:id_conversation

Participants d'une conversation. **Auth** : requise.

### GET /api/conversation-participants/user/:id_utilisateur

Conversations d'un utilisateur. Étudiant : les siennes. **Auth** : requise.

### GET /api/conversation-participants/:id

Un participant. **Auth** : requise.

### POST /api/conversation-participants

Ajouter un participant. **Rôles** : ADM.

**Body** : `id_conversation` (int requis ≥ 1), `id_utilisateur` (int requis ≥ 1).

**Réponse 200** : participant ajouté. **Erreurs** : 404 · 422.

### DELETE /api/conversation-participants/:id

Retirer un participant. **Rôles** : ADM. **Réponse 200**. **Erreurs** : 404.

---

## Messages `/api/messages`

### GET /api/messages

Tous les messages. **Rôles** : ADM.

### GET /api/messages/conversation/:id_conversation

Messages d'une conversation. **Auth** : requise.

### GET /api/messages/sender/:id_expediteur

Messages d'un expéditeur. **Auth** : requise.

### GET /api/messages/:id

Un message. **Auth** : requise. **Erreurs** : 404.

### POST /api/messages

Envoyer un message (participation à la conversation obligatoire ;
expéditeur imposé au token pour tout non-admin).

**Auth** : requise.

**Body**

| Champ | Type | Règles |
|-------|------|--------|
| id_conversation | int | requis, ≥ 1 |
| id_expediteur | int | requis par le validateur, ≥ 1 (imposé au token si non-admin) |
| contenu | string | requis, non vide après trim |

**Effet** : notification « Nouveau message » aux autres participants.

**Réponse 200** : `"data": { "id": <nouveau message> }`

**Erreurs** : 403 « L'utilisateur n'est pas participant de cette conversation. » · 404 · 422.

### PUT /api/messages/:id

**Auth** : requise. Body : `contenu` (requis). **Réponse 200** : `"data"` = message modifié.

### DELETE /api/messages/:id

**Auth** : requise. **Réponse 200**. **Erreurs** : 404.

---

## Notifications `/api/notifications`

Notification générée automatiquement : `{ id_notification, id_utilisateur, titre, contenu, lu (0/1), created_at }`.

Déclencheurs automatiques existants : inscription formation (« Nouvel étudiant
inscrit »), message (« Nouveau message »), résultat auto-corrigé (« Quiz réussi »
/ « Quiz échoué ») — notification immédiate à l'étudiant à la soumission, avis
(« Nouvel avis »).

### GET /api/notifications

Toutes les notifications. **Rôles** : ADM.

### GET /api/notifications/user/:id_utilisateur

Notifications d'un utilisateur. Étudiant : les siennes. **Auth** : requise.

### GET /api/notifications/unread

Notifications non lues de l'utilisateur connecté. **Auth** : requise.

### GET /api/notifications/count-unread

Nombre de non lues de l'utilisateur connecté.

**Réponse 200** : `"data": { "count": 3 }` (champ numérique).

### PATCH /api/notifications/:id/lu

Marquer comme lue (uniquement UNE de SES notifications).

**Auth** : requise. **Réponse 200** : notification mise à jour. **Erreurs** : 403 · 404 · 422.

### GET /api/notifications/:id

Une notification (propriétaire ou ADM). **Erreurs** : 404 · 403.

### POST /api/notifications

**Rôles** : ADM.

**Body** : `id_utilisateur` (int requis ≥ 1), `titre` (string requis ≤ 150),
`contenu` (string requis).

**Réponse 200** : notification créée. **Erreurs** : 422.

### PUT /api/notifications/:id

**Rôles** : ADM. Body : `titre` (requis ≤ 150), `contenu` (requis). **Réponse 200**.

### DELETE /api/notifications/:id

**Rôles** : ADM. **Réponse 200**. **Erreurs** : 404.

---

## Fichiers protégés `/api/files`

### GET /api/files/:filename

Sert un fichier uploadé référencé dans le rich text des sous-sections
(`/api/files/<nom_du_fichier>`).

**Auth** : requise — header `Authorization: Bearer <JWT>` **ou** query
`?token=<JWT>` (pour `<video>` / `<a href>`).

**Accès** : résolu par ressource référente (fichiers cités dans le contenu d'une
sous-section) — ADM, FOR propriétaire de la formation, étudiant inscrit à la
formation PUBLIEE dont dépend le fichier.

**Réponses** :

| Code | Cas |
|------|-----|
| 200 | flux du fichier (support Range pour la vidéo ; en-têtes `Accept-Ranges`, `Cross-Origin-Resource-Policy: cross-origin`, `Cache-Control: private, max-age=3600`) |
| 400 | « Nom de fichier invalide. » |
| 404 | « Fichier introuvable ou accès refusé. » / « Fichier introuvable. » |

**Exemple**

```
GET /api/files/lecon-intro.pdf?token=<JWT>
```

---

## Matrice récapitulative des rôles

| Ressource | Lecture | Création | Modification | Suppression |
|-----------|---------|----------|--------------|-------------|
| Users | ADM (liste) / tous (détail) | ADM | ADM | ADM |
| Categories | Public | ADM | ADM | ADM |
| Formations | tous (catalogue filtré) | ADM, FOR | ADM, FOR proprio | ADM, FOR proprio |
| Chapitres | ADM/FOR (gestion) ; ETD (parcours/détail bloqué) | ADM, FOR proprio | ADM, FOR proprio | ADM, FOR proprio |
| Sections | ETD si chapitre accessible ; ADM/FOR | ADM, FOR proprio | ADM, FOR | ADM, FOR |
| Sous-sections | ETD si accessible (contenu HTML) ; ADM/FOR | ADM, FOR proprio | ADM, FOR | ADM, FOR |
| Quiz | ETD si accessible ; ADM/FOR | ADM, FOR proprio | ADM, FOR | ADM, FOR |
| Questions | ETD (sans corrigé) ; ADM/FOR | ADM, FOR proprio | ADM, FOR (type figé) | ADM, FOR |
| Answers | ETD (sans `est_correcte`) ; ADM/FOR | ADM, FOR proprio | ADM, FOR | ADM, FOR |
| Attempts | ETD (siennes/historique) ; FOR (ses étudiants) ; ADM | ETD (start/submit) | — (correction automatique au submit) | — (pas de route DELETE publique) |
| Student-answers | lecture seule (cloisonnement corrigé) | — (via submit) | — (correction automatique) | — |
| Enrollments | ADM/FOR (listes) ; soi-même | ADM, FOR, ETD (auto-inscription PUBLIEE) | — | propriétaire ou ADM |
| Progressions | lecture seule (scopes) | — | — | — (recompute ADM) |
| Reviews | ADM (global) ; par user/formation | inscrit (auteur imposé) | auteur, ADM | auteur, ADM |
| Conversations | ADM (global) ; participant (détail) | authentifié | ADM | ADM |
| Conversation-participants | ADM (global) ; authentifié (par conv/user) | ADM | — | ADM |
| Messages | ADM (global) ; authentifié (filtres) | participant (expéditeur imposé) | authentifié | authentifié |
| Notifications | ADM (global) ; propriétaire | ADM | ADM | ADM |
| Files | selon ressource référente (token header/query) | — | — | — |

---

*Fin du document — généré depuis le code source réel, sans endpoint inventé.*
