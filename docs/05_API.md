# API CONTRACT — TUTORE / E-LEARNING UNIVERSITAIRE LOCAL

Version : 1.0
Statut : Contrat de référence pour le frontend
Backend : Node.js + Express
Base de données : MySQL
Base de données utilisée : elearningDb

---

## 1. OBJECTIF

Ce document définit le contrat API utilisé par le frontend React.

Le frontend ne doit pas inventer de routes.

Toute communication avec le backend doit passer par les endpoints réellement exposés par l'application Express.

Le frontend doit respecter :

- les méthodes HTTP ;
- les paramètres ;
- les corps de requêtes ;
- les réponses ;
- les codes HTTP ;
- l'authentification JWT ;
- les rôles ;
- les permissions ;
- les règles métier ;
- les restrictions d'accès aux formations et aux chapitres.

Les règles de sécurité sont appliquées côté backend.

Le frontend ne doit jamais être considéré comme une couche de sécurité.

---

# 2. BASE URL

En développement local :

http://localhost:3010

Base API :

http://localhost:3010/api

Exemple :

GET http://localhost:3010/api/formations

---

# 3. AUTHENTIFICATION

L'API utilise une authentification par JWT.

Après authentification, le token doit être envoyé dans l'en-tête HTTP :

Authorization: Bearer <JWT>

Exemple :

Authorization: Bearer eyJhbGciOi...

Les routes publiques et protégées doivent être distinguées selon leur configuration réelle dans le backend.

---

# 4. RÔLES

La plateforme possède trois rôles principaux.

## 4.1 ADMINISTRATEUR

L'administrateur possède les droits d'administration et de supervision prévus par le backend.

Le frontend administrateur doit uniquement afficher les opérations réellement autorisées par l'API.

---

## 4.2 FORMATEUR

Le formateur peut gérer les contenus dont il est propriétaire selon les permissions du backend.

Notamment :

- formations ;
- chapitres ;
- sections ;
- sous-sections ;
- contenu Rich Text ;
- quiz ;
- questions ;
- réponses ;
- suivi de ses étudiants ;
- conversations ;
- notifications.

Un formateur ne doit pas pouvoir modifier les ressources appartenant à un autre formateur.

---

## 4.3 ÉTUDIANT

L'étudiant peut notamment :

- consulter le catalogue ;
- consulter les formations accessibles ;
- s'inscrire ;
- consulter son parcours ;
- consulter les chapitres accessibles ;
- consulter les sections et sous-sections accessibles ;
- consulter le contenu Rich Text ;
- passer les quiz ;
- consulter ses tentatives ;
- consulter sa progression ;
- consulter ses notifications ;
- participer aux conversations autorisées.

L'étudiant ne doit jamais pouvoir contourner les restrictions de progression côté frontend.

---

# 5. FORMAT GÉNÉRAL DES REQUÊTES

Pour les requêtes JSON :

Content-Type: application/json

Exemple :

POST /api/formations

Headers :

Authorization: Bearer <JWT>
Content-Type: application/json

Body :

{
  ...
}

Pour les fichiers éventuels, le frontend doit utiliser le format réellement accepté par le backend.

Le nouveau modèle pédagogique privilégie le contenu Rich Text pour le contenu des sous-sections.

---

# 6. FORMAT GÉNÉRAL DES ERREURS

Le frontend doit traiter les codes HTTP retournés par le backend.

Principaux cas :

- 200 : succès ;
- 201 : ressource créée ;
- 400 : requête invalide ;
- 401 : authentification absente ou invalide ;
- 403 : accès interdit ;
- 404 : ressource inexistante ;
- 409 : conflit ou règle métier empêchant l'opération ;
- 422 : données non valides lorsque cette réponse est utilisée par le backend ;
- 500 : erreur serveur.

Le frontend ne doit pas transformer une erreur 403 en succès visuel.

Les messages d'erreur doivent être affichés de manière compréhensible à l'utilisateur.

---

# 7. AUTH

## Connexion

Méthode :

POST

Route :

/api/auth/...

Le frontend doit utiliser la route exacte exposée par le backend.

La réponse d'authentification doit permettre au frontend de récupérer les informations nécessaires à la session, notamment le JWT et les informations de rôle lorsqu'elles sont fournies.

---

# 8. CATÉGORIES

Les catégories permettent d'organiser les formations.

Opérations prévues :

GET
POST
PUT
DELETE

Les routes exactes doivent correspondre aux routes exposées par le backend.

Les opérations d'écriture sont soumises aux permissions du rôle authentifié.

Le frontend administrateur doit utiliser les routes d'administration prévues.

---

# 9. FORMATIONS

## Consultation du catalogue

Méthode :

GET

Route :

/api/formations

Cette route permet au frontend de récupérer les formations selon les règles de visibilité définies par le backend.

Le frontend ne doit pas supposer qu'une formation est accessible uniquement parce qu'elle est retournée dans une liste.

---

## Création

Méthode :

POST

Route :

/api/formations

Authentification :

JWT

Rôle :

Formateur autorisé ou administrateur selon les règles backend.

---

## Consultation d'une formation

Méthode :

GET

Route :

/api/formations/:id

---

## Modification

Méthode :

PUT

Route :

/api/formations/:id

Le backend doit vérifier que l'utilisateur possède le droit de modifier la formation.

---

## Suppression

Méthode :

DELETE

Route :

/api/formations/:id

La suppression doit respecter les relations de la base de données.

---

## Publication

Une formation peut être soumise aux règles de publication définies par le backend.

Une formation non publiée ne doit pas pouvoir être utilisée comme une formation publique par un étudiant.

L'inscription à une formation non publiée doit être refusée par le backend.

---

# 10. ARCHITECTURE PÉDAGOGIQUE

La structure pédagogique actuelle est :

FORMATION
↓
CHAPITRES
↓
SECTIONS
↓
SOUS-SECTIONS
↓
CONTENU RICH TEXT
↓
QUIZ DE CHAPITRE

Le frontend doit respecter cette structure.

Les anciennes notions de :

- modules ;
- leçons ;
- devoirs ;
- vidéos séparées ;
- documents pédagogiques séparés

ne doivent pas être recréées dans le frontend si elles ne sont plus présentes dans le contrat backend actuel.

---

# 11. CHAPITRES

## Liste des chapitres d'une formation

Méthode :

GET

Route :

/api/chapters/formation/:id

Cette route est particulièrement importante pour le parcours étudiant.

Pour un étudiant, la réponse peut contenir les informations de parcours telles que :

- formation ;
- chapitres ;
- état de validation ;
- accessibilité ;
- progression.

Le frontend doit utiliser les informations retournées par le backend.

Il ne doit pas recalculer arbitrairement l'accessibilité d'un chapitre.

---

## Réordonnancement

Méthode :

PATCH

Route :

/chapters/formation/:id/reorder

Cette opération est réservée aux utilisateurs autorisés.

---

# 12. SECTIONS

Les sections appartiennent aux chapitres.

Le frontend formateur doit permettre les opérations réellement exposées par le backend :

- création ;
- consultation ;
- modification ;
- suppression ;
- réordonnancement lorsqu'il existe une route correspondante.

Les droits d'accès doivent être vérifiés côté backend.

---

# 13. SOUS-SECTIONS

Les sous-sections appartiennent aux sections.

Elles constituent l'unité contenant le contenu pédagogique Rich Text.

Le frontend formateur doit pouvoir gérer :

- création ;
- modification ;
- suppression ;
- ordre ;
- contenu Rich Text.

Le contenu est stocké dans le backend sous la forme prévue par le schéma actuel.

Le contenu Rich Text doit être envoyé au backend selon le format accepté par les validateurs.

---

# 14. RICH TEXT

Le contenu pédagogique utilise le Rich Text.

Le principe est :

Formation
→ Chapitre
→ Section
→ Sous-section
→ Contenu Rich Text

Le frontend ne doit plus construire une architecture pédagogique basée principalement sur :

- fichiers vidéo séparés ;
- documents pédagogiques séparés ;
- leçons indépendantes ;
- devoirs indépendants.

Les contenus intégrés dans le Rich Text doivent respecter les règles de sécurité et de taille du backend.

Le backend peut limiter la taille du contenu HTML.

Le frontend doit donc prévoir :

- éditeur Rich Text ;
- aperçu ;
- édition ;
- sauvegarde ;
- affichage sécurisé.

---

# 15. QUIZ

Les quiz sont associés aux chapitres.

Route de consultation :

GET /api/quizzes

GET /api/quizzes/:id

GET /api/quizzes/chapter/:id

Création :

POST /api/quizzes

Modification :

PUT /api/quizzes/:id

Suppression :

DELETE /api/quizzes/:id

Le backend applique les règles métier.

Un chapitre ne doit pas recevoir plusieurs quiz si le backend impose la règle d'un seul quiz par chapitre.

Dans ce cas, une tentative de création supplémentaire doit être traitée comme un conflit HTTP 409.

---

# 16. QUESTIONS

Les questions appartiennent aux quiz.

Le système ne comporte que des **questions à choix multiple (QCM)**.

Le type d'une question peut être figé après certaines étapes de création/modification selon les règles backend.

Le frontend doit respecter les validations du backend.

---

# 17. RÉPONSES

Les réponses sont associées aux questions.

Pour une question QCM, les réponses permettent de déterminer la bonne réponse.

IMPORTANT :

Le champ indiquant qu'une réponse est correcte ne doit jamais être exposé à l'étudiant.

Le frontend étudiant doit recevoir uniquement les données nécessaires pour répondre au quiz.

---

# 18. TENTATIVES

Une tentative représente le passage d'un quiz par un étudiant.

Cycle métier :

EN_COURS
↓
REUSSIE ou ECHOUEE

Toutes les questions sont QCM et la correction est **100 % automatique** côté
serveur au moment de la soumission.

La valeur `SOUMISE` existe dans l'enum du statut mais le produit ne transitionne
jamais vers elle : la soumission passe directement de `EN_COURS` à `REUSSIE` ou
`ECHOUEE`. Il n'existe aucun workflow de correction manuelle (pas de `A_CORRIGER`,
pas de route `corriger`, pas de `date_correction`).

La note est calculée et contrôlée côté serveur.

Le frontend ne doit jamais calculer ou imposer lui-même la note finale.

---

# 19. REPONSES ÉTUDIANTS

Les réponses des étudiants sont associées aux tentatives et aux questions.

Chaque réponse étudiante référence une réponse QCM choisie (`id_reponse`) :
les champs `contenu` (texte libre) et `note` ont été retirés du produit.

Le frontend étudiant doit pouvoir :

- consulter le résultat autorisé.

Le frontend formateur propriétaire du quiz peut consulter les réponses avec la
correction (`est_correcte`) ; il n'existe aucune correction manuelle à saisir.

Les réponses d'un étudiant ne doivent pas être accessibles à un autre étudiant.

---

# 20. RÉUSSITE DU QUIZ

La validation d'un quiz est une règle backend.

Toutes les questions sont QCM :

→ le serveur corrige automatiquement à la soumission.

Un quiz réussi débloque le chapitre suivant selon la logique de progression actuelle.

---

# 21. REPASSAGE DU QUIZ

Un étudiant peut repasser un quiz lorsqu'il a échoué, selon les règles backend.

Un quiz déjà réussi ne doit pas pouvoir être repassé si le backend interdit une nouvelle tentative après REUSSIE.

Le frontend doit afficher le comportement réel retourné par l'API et non inventer sa propre règle.

---

# 22. VERROUILLAGE DES CHAPITRES

Le parcours est séquentiel.

Exemple :

Chapitre 1
↓
Quiz
↓
Réussite
↓
Chapitre 2

Le chapitre suivant reste inaccessible tant que le quiz précédent n'est pas réussi.

Le serveur est la source de vérité.

Si le serveur retourne 403 pour un chapitre verrouillé, le frontend doit :

- empêcher l'accès ;
- afficher clairement que le chapitre est verrouillé ;
- indiquer la condition nécessaire pour continuer.

Il ne faut jamais se contenter de masquer le bouton.

---

# 23. PROGRESSION

La progression est calculée côté serveur.

Le frontend doit consommer la progression fournie par l'API.

Le pourcentage ne doit pas être calculé arbitrairement uniquement dans React.

La progression doit rester cohérente entre :

- détail de formation ;
- parcours ;
- état des chapitres.

---

# 24. INSCRIPTIONS

Une inscription associe un étudiant à une formation.

Elle doit respecter :

- l'authentification ;
- les permissions ;
- la publication de la formation ;
- l'absence de doublon.

Une formation non publiée ne doit pas être accessible à l'inscription publique.

Une inscription réussie peut déclencher :

- progression initiale ;
- conversation automatique ;
- notification au formateur.

Le frontend doit refléter les résultats retournés par l'API.

---

# 25. CONVERSATIONS

Les conversations permettent la communication entre utilisateurs autorisés.

Lorsqu'un étudiant s'inscrit à une formation, le backend peut créer automatiquement une conversation entre :

FORMATEUR
↔
ÉTUDIANT

La conversation doit être associée au contexte de formation.

Le frontend doit afficher les conversations autorisées sans exposer les identifiants techniques inutilement.

---

# 26. PARTICIPANTS

Les participants déterminent les utilisateurs autorisés à accéder à une conversation.

Le backend doit vérifier l'appartenance à la conversation avant l'envoi ou la consultation des messages.

Le frontend ne doit pas considérer un simple ID comme une preuve d'accès.

---

# 27. MESSAGES

Les messages appartiennent aux conversations.

Le frontend doit permettre :

- consultation ;
- envoi ;
- affichage de l'expéditeur ;
- affichage de la date ;
- actualisation.

L'envoi d'un message peut déclencher une notification pour les autres participants.

---

# 28. NOTIFICATIONS

Les notifications sont liées à des événements métier.

Les événements actuellement couverts par le backend comprennent notamment :

- inscription ;
- nouveau message ;
- résultat de quiz (« Quiz réussi » / « Quiz échoué », notification immédiate à
  l'étudiant à la soumission) ;
- nouvel avis.

Le frontend doit afficher :

- liste des notifications ;
- titre ;
- message ;
- date ;
- état lu/non lu ;
- compteur de notifications non lues.

---

# 29. NOTIFICATIONS NON BLOQUANTES

Une notification ne doit pas empêcher l'action métier principale lorsqu'une erreur de notification survient si le backend applique cette règle.

Exemple :

INSCRIPTION
→ inscription réussie
→ notification éventuelle

Une erreur de notification ne doit pas transformer automatiquement une inscription réussie en échec métier.

---

# 30. AVIS

Les avis permettent aux étudiants autorisés de donner une appréciation sur une formation.

Le backend doit contrôler :

- l'identité de l'auteur ;
- l'inscription ;
- les doublons ;
- l'accès à la formation.

Le frontend ne doit jamais permettre à un utilisateur de choisir arbitrairement l'identité de l'auteur.

---

# 31. ACCÈS AUX FICHIERS

Lorsque des fichiers sont référencés dans du contenu Rich Text, leur accès doit passer par les mécanismes de sécurité du backend.

Les permissions doivent notamment tenir compte :

- de l'administrateur ;
- du formateur propriétaire ;
- de l'étudiant inscrit ;
- de l'état de publication de la formation.

Le frontend ne doit pas exposer directement un chemin physique du serveur comme mécanisme de sécurité.

---

# 32. SÉCURITÉ IDOR

Le backend protège les ressources contre les accès directs par modification d'identifiant.

Exemple :

Un étudiant ne doit pas pouvoir modifier :

GET /api/attempts/123

en :

GET /api/attempts/124

pour obtenir les données d'un autre étudiant.

Le frontend doit respecter les erreurs 403/404 retournées par le serveur.

---

# 33. MATRICE GÉNÉRALE DES ACCÈS

| Fonction | Admin | Formateur propriétaire | Formateur étranger | Étudiant inscrit | Étudiant non inscrit |
|---|---|---|---|---|---|
| Administrer utilisateurs | Oui | Non | Non | Non | Non |
| Gérer ses formations | Oui selon backend | Oui | Non | Non | Non |
| Modifier formation étrangère | Selon permission | Non | Non | Non | Non |
| Gérer chapitres | Oui selon permission | Oui | Non | Non | Non |
| Gérer sections | Oui selon permission | Oui | Non | Non | Non |
| Gérer sous-sections | Oui selon permission | Oui | Non | Non | Non |
| Gérer quiz propriétaire | Oui selon permission | Oui | Non | Non | Non |
| Passer quiz | Non | Non | Non | Oui | Non |
| Correction automatique des QCM (au serveur) | Automatique | Automatique | Automatique | Automatique | Automatique |
| Consulter sa progression | Oui selon supervision | Selon permission | Selon permission | Oui | Non |
| S'inscrire | Selon rôle | Selon rôle | Selon rôle | Oui | Oui si formation publiée |
| Messagerie autorisée | Oui selon permission | Oui | Selon permission | Oui participant | Non |
| Notifications personnelles | Oui | Oui | Oui | Oui | Non |
| Avis | Selon règles | Selon règles | Selon règles | Oui si inscrit | Non |

Cette matrice doit toujours être considérée comme indicative lorsque le backend applique une permission plus précise.

---

# 34. RÈGLES POUR LE FRONTEND REACT

Le frontend doit :

1. utiliser les endpoints réellement exposés ;
2. utiliser les services API centralisés ;
3. envoyer le JWT ;
4. gérer les erreurs HTTP ;
5. respecter les rôles ;
6. respecter les réponses backend ;
7. ne pas contourner les 401/403 ;
8. ne pas recalculer les règles métier critiques ;
9. ne pas exposer les réponses correctes des QCM ;
10. ne pas modifier arbitrairement les notes ;
11. ne pas déverrouiller localement un chapitre ;
12. conserver une séparation claire entre UI et appels API.

---

# 35. STRUCTURE CONSEILLÉE DES SERVICES FRONTEND

Le frontend peut organiser ses appels API par domaine :

authService
categoryService
formationService
chapterService
sectionService
subSectionService
quizService
questionService
answerService
attemptService
studentAnswerService
progressionService
enrollmentService
conversationService
participantService
messageService
notificationService
reviewService
userService

Les noms doivent correspondre aux services réellement présents dans le projet.

---

# 36. RÈGLE DE SYNCHRONISATION BACKEND / FRONTEND

Avant toute modification frontend :

1. vérifier la route backend ;
2. vérifier la méthode HTTP ;
3. vérifier le middleware d'authentification ;
4. vérifier le rôle ;
5. vérifier le body ;
6. vérifier la réponse ;
7. vérifier les erreurs ;
8. vérifier la persistance ;
9. ensuite seulement construire l'interface React.

Le frontend ne doit jamais devenir une deuxième implémentation du métier.

---

# 37. TESTS API

Les tests doivent être effectués avec :

- Postman ;
- tests automatisés backend ;
- navigateur lorsque nécessaire.

Les scénarios importants sont :

- authentification ;
- création de formation ;
- publication ;
- inscription ;
- création de chapitre ;
- création de section ;
- création de sous-section ;
- création de quiz ;
- création de questions ;
- tentative QCM ;
- correction automatique ;
- verrouillage chapitre ;
- progression ;
- conversation ;
- message ;
- notification ;
- avis ;
- permissions.

---

# 38. DOCUMENTATION DE RÉFÉRENCE

Ce fichier constitue le contrat général.

Pour les détails exacts des endpoints, payloads et données de test, utiliser :

docs/API_DOCUMENTATION.md

et :

docs/API_TEST_DATA.md

Ces documents doivent rester cohérents avec le backend réel.

En cas de divergence :

CODE BACKEND RÉEL
→ source de vérité.

La documentation doit ensuite être corrigée pour correspondre au code.

---

# 39. RÈGLE FINALE

Aucune route fictive ne doit être ajoutée au frontend.

Aucune permission ne doit être supposée.

Aucune règle métier critique ne doit être implémentée uniquement côté React.

Le backend Express reste la source de vérité pour :

- authentification ;
- autorisation ;
- progression ;
- validation des quiz ;
- notes ;
- accès aux chapitres ;
- inscriptions ;
- conversations ;
- notifications ;
- accès aux ressources.