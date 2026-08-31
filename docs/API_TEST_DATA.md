# TUTORE — Données et comptes pour tester l'API

> Ce document recense **uniquement** ce qui existe réellement dans le projet
> (`database/elearning_db.sql`, `backend/tests/*`) et les payloads validés par
> les harnais de tests automatisés. Toute donnée absente du projet est marquée
> explicitement **« À créer »** — aucune donnée fictive n'est présentée comme réelle.

---

## 1. Prérequis d'environnement

Fichier `backend/.env` (valeurs présentes dans le projet) :

| Variable | Valeur constatée | Rôle |
|----------|------------------|------|
| PORT | `3010` | port HTTP de l'API |
| DB_PORT | `3306` | port MySQL |
| DB_* (host/user/password/name) | selon votre installation locale | connexion `elearning_db` |
| JWT_SECRET | définie dans `.env` | signature des tokens |

Base de données à importer : `database/elearning_db.sql`.

Démarrage :

```
cd backend
npm start          # ou npm run dev (nodemon)
```

Vérification : `GET http://localhost:3010/api/test-db` → 200.

---

## 2. Données réellement présentes en base (seed officiel)

Le dump `database/elearning_db.sql` ne contient qu'**une seule insertion de
données** :

```sql
INSERT INTO roles(libelle) VALUES ('Administrateur'),('Formateur'),('Etudiant');
```

Soit, avec `id_role INT AUTO_INCREMENT` :

| id_role | libelle |
|---------|---------|
| 1 | Administrateur |
| 2 | Formateur |
| 3 | Etudiant |

Tout le reste est vide au premier import :

| Donnée | État après import |
|--------|-------------------|
| Utilisateurs (tous rôles) | **À créer** (aucun compte seedé) |
| Catégories | **À créer** (aucune catégorie seedée) |
| Formations / chapitres / sections / sous-sections | À créer via l'API |
| Quiz / questions / réponses | À créer via l'API |
| Inscriptions / progressions / avis / conversations / messages / notifications | Créées automatiquement ou via l'API |

---

## 3. Comptes de test

### Comment les tests automatisés obtiennent leurs comptes

Les suites (`backend/tests/*.test.js`) ne créent pas de comptes : elles lisent
les utilisateurs existants **par rôle**, dans l'ordre des identifiants :

```sql
SELECT u.id_utilisateur, r.libelle AS role, u.email
FROM utilisateurs u INNER JOIN roles r ON u.id_role = r.id_role
WHERE r.libelle = ?            -- 'Administrateur' | 'Formateur' | 'Etudiant'
ORDER BY u.id_utilisateur
LIMIT ?, 1                     -- ordre = 1er, 2e… utilisateur du rôle
```

Exigences des harnais pour être verts :

- au moins **1 Administrateur** ;
- au moins **1 Formateur** ;
- au moins **2 Etudiants distincts** (`cross-role.test.js` lève une erreur sinon).

### Comptes à créer avant de tester manuellement

Aucun e-mail/mot de passe n'est fourni par le projet : ces comptes sont
**À créer**, puis leurs identifiants réels doivent être notés ici par
l'équipe.

| Compte | Rôle visé | Mode de création | Statut |
|--------|-----------|------------------|--------|
| admin@[à définir] | Administrateur (id_role=1) | `POST /api/users` (nécessite déjà un admin) ou SQL direct | **À créer** |
| formateur1@[à définir] | Formateur (id_role=2) | `POST /api/users` par un admin | **À créer** |
| formateur2@[à définir] | Formateur (2e, utile pour tests IDOR) | `POST /api/users` par un admin | **À créer** |
| etudiant1@[à définir] | Etudiant (id_role=3) | `POST /api/auth/register` (crée toujours un étudiant) | **À créer** |
| etudiant2@[à définir] | Etudiant (2e, requis par cross-role.test.js) | `POST /api/auth/register` | **À créer** |

> Le premier administrateur doit être inséré directement en SQL (hachage bcrypt)
> car `POST /api/users` exige déjà le rôle ADM :
>
> ```sql
> -- mot_de_passe = hash bcrypt du mot de passe choisi (≥ 8 caractères)
> INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, id_role)
> VALUES ('Admin', 'Systeme', 'admin@local', '<hash bcrypt>', 1);
> ```

Une fois les comptes créés, récupérer les tokens :

```
POST /api/auth/login
{ "email": "<email réel>", "mot_de_passe": "<mot de passe réel>" }
→ data.token
```

---

## 4. Identifiants réels disponibles dans les tests

- Les tests créent tout leur contenu pédagogique **dynamiquement via l'API**
  (titres suffixés par un marqueur `Date.now()`) puis le **suppriment** en fin
  de suite. Il n'existe donc **aucun ID de formation/chapitre/quiz persistant
  garanti** à réutiliser : il faut recréer son propre scénario (section 5).
- Les seules valeurs stables exploitables immédiatement :
  - `id_role` : 1 / 2 / 3 (seed officiel) ;
  - les `id_utilisateur` que VOUS créez (section 3) ;
  - les IDs retournés par chaque `POST` (`data.id`) pendant votre session de test.
- Catégorie : `id_categorie` **À créer** (`POST /api/categories` avec un token
  ADM) ; noter l'ID retourné, il est requis par `POST /api/formations`.

---

## 5. Scénario complet de test dans le bon ordre

Payloads exacts tels qu'utilisés par `tests/cross-role.test.js` et
`tests/notifications-e2e.test.js` (tous verts). Remplacer `<TOKEN_*>` par les
tokens obtenus en section 3 et les IDs par ceux retournés à chaque étape.

### Étape 0 — Référentiels

```
POST /api/categories            (ADM)
{ "nom_categorie": "Informatique" }
→ data.id = <ID_CATEGORIE>
```

### Étape 1 — Le formateur construit la formation

```
POST /api/formations            (FOR)
{ "id_categorie": <ID_CATEGORIE>, "titre": "Formation Test <marqueur>",
  "description": "Introduction." }
→ data.id = <ID_FORMATION>      (statut initial BROUILLON)

PATCH /api/formations/<ID_FORMATION>/publish    (FOR)   → 200 (PUBLIEE)
```

### Étape 2 — Chapitres (le 2e servira au verrouillage)

```
POST /api/chapters              (FOR)
{ "id_formation": <ID_FORMATION>, "titre": "Chapitre 1 : Premiers pas",
  "description": "Les bases." }
→ data.id = <ID_CH1>

POST /api/chapters              (FOR)
{ "id_formation": <ID_FORMATION>, "titre": "Chapitre 2 : Approfondissement" }
→ data.id = <ID_CH2>
```

Réordonnancement éventuel :

```
PATCH /api/chapters/formation/<ID_FORMATION>/reorder   (FOR)
{ "chapitres": [<ID_CH1>, <ID_CH2>] }
```

### Étape 3 — Contenu rich text du chapitre 1

```
POST /api/sections              (FOR)
{ "id_chapitre": <ID_CH1>, "titre": "Section 1.1", "description": "Découverte." }
→ data.id = <ID_SECTION>

POST /api/sous-sections         (FOR)
{ "id_section": <ID_SECTION>, "titre": "Sous-section 1.1.1",
  "contenu": "<h2>Bienvenue</h2><p>Voici votre <strong>première</strong> leçon.</p>" }
→ data.id = <ID_SS>
```

Vérification étudiant (après inscription) :

```
GET /api/sous-sections/<ID_SS>  (ETD inscrit)   → 200, contenu HTML restitué
```

### Étape 4 — Quiz du chapitre 1 (QCM uniquement)

```
POST /api/quizzes               (FOR)
{ "id_chapitre": <ID_CH1>, "titre": "Quiz : valider le chapitre 1", "score_reussite": 50 }
→ data.id = <ID_QUIZ>

POST /api/questions             (FOR)
{ "id_quiz": <ID_QUIZ>, "enonce": "HTML signifie ?", "type": "QCM", "points": 1 }
→ data.id = <ID_Q_QCM>

POST /api/answers               (FOR)
{ "id_question": <ID_Q_QCM>, "texte": "HyperText Markup Language", "est_correcte": true }
→ data.id = <ID_REP_OK>

POST /api/answers               (FOR)
{ "id_question": <ID_Q_QCM>, "texte": "Hyper Text Machine Language" }
→ data.id = <ID_REP_KO>
```

Contre-tests utiles :

- re-poster un quiz sur `<ID_CH1>` → **409** ;
- `POST /api/questions` avec `{ "type": "LIBRE" }` → **409** « Seules les questions à choix multiple (QCM) sont prises en charge. » (ou 422 du validateur) ;
- `PUT /api/questions/<ID_Q_QCM>` avec `{ "type": "LIBRE" }` → **422** ;
- `GET /api/answers/question/<ID_Q_QCM>` en ETD → 200 **sans** `est_correcte`.

### Étape 5 — Inscription de l'étudiant

```
POST /api/enrollments           (ETD)
{ "id_formation": <ID_FORMATION> }
→ 200, data.id = <ID_INSCRIPTION>
```

Effets automatiques vérifiés : conversation `Formation : <titre>` créée,
progression initiale 0 %, notification « Nouvel étudiant inscrit » au formateur.

Contre-test : même requête une 2e fois → **409** « Cet utilisateur est déjà
inscrit à cette formation. »

### Étape 6 — Vue parcours et verrouillage

```
GET /api/chapters/formation/<ID_FORMATION>   (ETD)
→ 200 : chapitre 1 accessible=true ; chapitre 2 accessible=false ;
  progression_pourcentage = 0

GET /api/sections/chapter/<ID_CH2>           (ETD)
→ 403 (chapitre 2 verrouillé)

GET /api/chapters/formation/<ID_FORMATION>   (FOR ou ADM)
→ liste complète des chapitres (pas la vue parcours)
```

### Étape 7 — Passage du quiz

```
POST /api/attempts/quiz/<ID_QUIZ>/start      (ETD)
→ 200 : data.tentative.id_tentative = <ID_TENTATIVE>,
  data.questions[] sans est_correcte

(2e appel identique → même tentative, comportement idempotent)
```

Soumission **incomplète** (contre-test — toutes les questions du quiz doivent figurer) :

```
POST /api/attempts/<ID_TENTATIVE>/submit     (ETD)
{ "reponses": [] }
→ 409 « La question <ID_Q_QCM> n'a pas été répondue. »
```

Soumission avec une réponse erronée → auto-corrigé **ECHOUEE** :

```
POST /api/attempts/<ID_TENTATIVE>/submit     (ETD)
{ "reponses": [ { "id_question": <ID_Q_QCM>, "id_reponses": [<ID_REP_KO>] } ] }
→ 200 : statut ECHOUEE, note 0, score_reussite 50
  (+ notification « Quiz échoué » à l'étudiant)
```

Repassage (un quiz échoué peut être repassé) puis soumission QCM juste → **REUSSIE** :

```
POST /api/attempts/quiz/<ID_QUIZ>/start      (ETD)
→ 200 : nouvelle tentative data.tentative.id_tentative = <ID_TENTATIVE2>

POST /api/attempts/<ID_TENTATIVE2>/submit    (ETD)
{
  "reponses": [
    { "id_question": <ID_Q_QCM>, "id_reponses": [<ID_REP_OK>] }
  ]
}
→ 200 : statut REUSSIE, note 100, score_reussite 50
  (+ notification « Quiz réussi » à l'étudiant)
```

Contre-tests :

- réponse étrangère à la question → **409** ;
- re-soumettre une tentative déjà soumise → **409** « Cette tentative a déjà été soumise… » ;
- `PATCH /api/attempts/<ID_TENTATIVE>/corriger` → **404** (aucune route de correction manuelle) ;
- `POST /api/questions` avec `type` ≠ `QCM` → **409/422**.

Historique et cloisonnement :

```
GET /api/attempts/quiz/<ID_QUIZ>/mine        (ETD)   → 200
GET /api/student-answers/attempt/<ID_TENTATIVE2>   (FOR)   → 200 (avec est_correcte)
GET /api/student-answers/attempt/<ID_TENTATIVE2>   (ETD)   → 200 (sans est_correcte)
GET /api/attempts/<ID_TENTATIVE2>            (2e ETD non propriétaire) → 403
```

### Étape 8 — Déblocage et progression

```
GET /api/chapters/formation/<ID_FORMATION>   (ETD)
→ chapitre 2 accessible=true ; progression_pourcentage recalculée
  (1 chapitre validé sur 2 → 50)

GET /api/progressions/me                     (ETD) → 200
POST /api/chapters/<ID_CH2>/complete         (ETD) → 409 si CH2 avait un quiz ;
                                              200 seulement pour un chapitre SANS quiz
POST /api/attempts/quiz/<ID_QUIZ>/start      (ETD) → 409 « Ce quiz est déjà réussi… »
```

### Étape 9 — Messagerie (conversation automatique de l'étape 5)

Retrouver la conversation (SQL direct ou `GET /api/conversation-participants/user/<ETUDIANT_ID>`)
puis :

```
POST /api/messages              (FOR)
{ "id_conversation": <ID_CONVERSATION>, "id_expediteur": <FORMATEUR_ID>,
  "contenu": "Bonjour, bienvenue !" }
→ 200 (+ notification « Nouveau message » à l'étudiant)
```

### Étape 10 — Avis sur la formation

```
POST /api/reviews               (ETD inscrit)
{ "id_utilisateur": <ETUDIANT_ID>, "id_formation": <ID_FORMATION>,
  "note": 5, "commentaire": "Excellente formation !" }
→ 200 (+ notification « Nouvel avis » au formateur)
```

### Étape 11 — Notifications de l'étudiant

```
GET /api/notifications/count-unread          (ETD) → 200, data.count ≥ 1
GET /api/notifications/unread                (ETD) → 200
PATCH /api/notifications/<ID_NOTIF>/lu       (ETD) → 200 (sa propre notif uniquement)
```

---

## 6. Correspondance scénario ↔ suites automatisées

| Étapes ci-dessus | Suite qui les vérifie automatiquement |
|------------------|----------------------------------------|
| 1 → 4 (construction contenu) | ownership, services-full, http-routes |
| 5 → 6 (inscription, verrouillage, corrigé masqué) | ownership, cross-role |
| 7 → 8 (tentative, correction automatique, déblocage) | cross-role, services-full |
| 9 (message) | notifications-e2e |
| 10 (avis) | notifications-e2e, features |
| 11 (notifications) | notifications-e2e |

Exécution globale : `cd backend && npm test` (orchestrateur `tests/run-all.js`,
8 suites, 306 vérifications, 0 échec à la date du document).

---

## 7. Règles à respecter pendant les tests manuels

1. Ne jamais injecter `id_utilisateur` attendu du token : pour un non-admin il
   est **imposé** (enrollments, reviews, messages…) — le champ reste exigé par
   certains validateurs mais doit correspondre au compte du token.
2. Une formation doit être **publiée** avant toute inscription étudiante.
3. Un quiz doit contenir **au moins une question** pour être passable.
4. Toute question du quiz doit figurer dans `reponses[]` de la soumission.
5. Toutes les questions sont QCM ; la correction est entièrement automatique à
   la soumission (aucune correction manuelle par le formateur).
6. Les données créées manuellement restent en base : penser à nettoyer si vous
   rejouez les suites automatisées (elles, se nettoient elles-mêmes).
