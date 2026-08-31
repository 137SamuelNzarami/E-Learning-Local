# E-Learning Universitaire Local — TUTORE

Plateforme universitaire locale gratuite d'apprentissage en ligne.

Le projet permet aux étudiants de suivre des formations structurées, aux formateurs de créer et gérer leurs contenus pédagogiques et aux administrateurs de superviser la plateforme.

Le projet s'inspire des principes d'expérience pédagogique d'OpenClassrooms, tout en restant une plateforme locale gratuite.

Le module de certificat payant d'OpenClassrooms n'est pas intégré au projet.

---

# 1. TECHNOLOGIES

## Backend

- Node.js
- Express.js
- MySQL
- JWT
- JavaScript

## Frontend

- React
- JavaScript

## Base de données

MySQL

Base utilisée :

elearningDb

---

# 2. ARCHITECTURE GÉNÉRALE

Le projet est organisé autour d'une architecture :

Frontend React
↓
API HTTP
↓
Backend Express / Node.js
↓
Services
↓
Repositories / accès aux données
↓
MySQL
↓
elearningDb

Le frontend ne communique pas directement avec MySQL.

Toutes les opérations sur les données passent par l'API backend.

---

# 3. RÔLES

La plateforme possède trois rôles principaux.

## Administrateur

L'administrateur assure :

- la supervision ;
- la gestion des utilisateurs ;
- la gestion globale des formations selon les permissions ;
- la consultation des données ;
- l'administration de la plateforme.

---

## Formateur

Le formateur peut gérer ses propres formations.

Il peut notamment gérer :

- formations ;
- chapitres ;
- sections ;
- sous-sections ;
- contenu Rich Text ;
- quiz ;
- questions ;
- réponses ;
- corrections des questions libres ;
- étudiants liés à ses formations ;
- conversations ;
- notifications.

Un formateur ne doit pas modifier les formations d'un autre formateur.

---

## Étudiant

L'étudiant peut notamment :

- consulter le catalogue ;
- consulter les formations publiées ;
- s'inscrire ;
- suivre son parcours ;
- consulter les chapitres accessibles ;
- lire le contenu pédagogique ;
- passer les quiz ;
- consulter ses résultats ;
- consulter sa progression ;
- communiquer avec les interlocuteurs autorisés ;
- consulter ses notifications ;
- publier des avis selon les règles du backend.

---

# 4. ARCHITECTURE PÉDAGOGIQUE

La structure actuelle du cours est :

FORMATION
↓
CHAPITRE
↓
SECTION
↓
SOUS-SECTION
↓
CONTENU RICH TEXT
↓
QUIZ

Le projet ne repose plus sur l'ancien modèle pédagogique basé principalement sur :

- modules ;
- leçons indépendantes ;
- devoirs ;
- documents pédagogiques séparés ;
- vidéos pédagogiques séparées.

Le contenu pédagogique est désormais destiné à être intégré dans le Rich Text.

---

# 5. CONTENU RICH TEXT

Les sous-sections constituent les unités de contenu pédagogique.

Une sous-section peut contenir du contenu Rich Text.

Le frontend doit donc fournir un éditeur permettant au formateur de créer et modifier ce contenu.

L'étudiant consulte ensuite ce contenu dans son parcours.

Le backend reste responsable de la validation et de la sécurité du contenu.

---

# 6. QUIZ

Chaque chapitre peut être associé à un quiz selon les règles du backend.

Le quiz constitue l'évaluation du chapitre.

Il contient uniquement des questions à choix multiple.

---

# 7. CORRECTION DES QCM

Pour une question à choix multiple :

Étudiant
↓
répond
↓
soumet
↓
serveur
↓
correction automatique
↓
note
↓
réussite ou échec

La correction est effectuée côté serveur.

La bonne réponse ne doit jamais être exposée à l'étudiant avant la correction.

---

# 8. TENTATIVES

Une tentative représente le passage d'un quiz.

Son cycle peut être :

EN_COURS
↓
REUSSIE
ou
ECHOUEE

La correction est 100 % automatique côté serveur : toute question est à choix multiple, il n'existe ni question libre ni correction manuelle par le formateur.

Le serveur reste responsable de la validation de l'état.

---

# 9. REPASSAGE

Lorsqu'un étudiant échoue à un quiz, il peut le repasser selon les règles backend.

Lorsqu'un quiz est déjà réussi, le backend peut empêcher une nouvelle tentative.

Le frontend doit suivre la réponse du serveur.

---

# 11. VERROUILLAGE DU PARCOURS

Le parcours est séquentiel.

Exemple :

Chapitre 1
↓
Quiz
↓
Réussite
↓
Chapitre 2
↓
Quiz
↓
Réussite
↓
Chapitre 3

Un chapitre suivant ne doit pas être accessible tant que le quiz précédent n'est pas validé comme réussi.

Cette règle est appliquée côté backend.

Le frontend ne doit pas pouvoir contourner ce verrouillage.

---

# 12. PROGRESSION

La progression est calculée côté serveur.

Le frontend consomme la progression retournée par l'API.

Les informations de progression doivent rester cohérentes entre :

- détail d'une formation ;
- parcours étudiant ;
- état des chapitres ;
- validation des quiz.

Le frontend ne doit pas déclarer arbitrairement une formation comme terminée.

---

# 13. INSCRIPTIONS

L'étudiant peut s'inscrire à une formation lorsque les conditions backend sont respectées.

Une formation non publiée ne doit pas être proposée comme formation publiquement accessible.

Une inscription peut entraîner :

- création de la progression initiale ;
- création d'une conversation ;
- notification du formateur.

Le backend est responsable de ces règles.

---

# 14. CONVERSATIONS

Lorsqu'un étudiant s'inscrit à une formation, le système peut créer automatiquement une conversation entre :

FORMATEUR
↔
ÉTUDIANT

La conversation est liée au contexte de formation.

Les participants sont contrôlés côté backend.

---

# 15. MESSAGES

Les participants autorisés peuvent envoyer des messages.

Les messages appartiennent à une conversation.

Un nouveau message peut déclencher une notification.

Les dates des messages doivent provenir des données backend réelles.

---

# 16. NOTIFICATIONS

Le système de notifications peut informer les utilisateurs lors d'événements métier.

Les événements actuellement couverts comprennent notamment :

- inscription ;
- nouveau message ;
- tentative à corriger ;
- correction/validation d'un quiz ;
- nouvel avis.

Le frontend doit afficher :

- notifications ;
- compteur non lu ;
- état lu/non lu ;
- date ;
- contenu.

---

# 17. AVIS

Les étudiants autorisés peuvent donner un avis sur une formation.

Le backend contrôle :

- l'auteur ;
- l'inscription ;
- les doublons ;
- la formation concernée.

Le frontend ne doit pas pouvoir choisir arbitrairement l'identité de l'auteur.

---

# 18. SÉCURITÉ

L'authentification utilise JWT.

Les requêtes protégées utilisent :

Authorization: Bearer <JWT>

Le backend contrôle :

- identité ;
- rôle ;
- propriété des ressources ;
- accès aux formations ;
- accès aux tentatives ;
- accès aux réponses ;
- accès aux conversations ;
- autres permissions.

Le frontend ne constitue jamais la couche de sécurité.

---

# 19. BASE DE DONNÉES

Base MySQL :

elearningDb

Le frontend ne se connecte jamais directement à MySQL.

Architecture :

React
↓
Express API
↓
Services backend
↓
MySQL

Les modifications de la base doivent être réalisées en cohérence avec le backend.

---

# 20. API

Base URL backend :

http://localhost:3010

Base URL API :

http://localhost:3010/api

Authentification :

Authorization: Bearer <JWT>

La documentation API principale se trouve dans :

docs/05_API.md

La documentation détaillée des endpoints se trouve dans :

docs/API_DOCUMENTATION.md

Les données de test API se trouvent dans :

docs/API_TEST_DATA.md

---

# 21. FRONTEND

Le frontend utilise React.

Il doit communiquer avec le backend exclusivement via les services API.

Les services frontend doivent être organisés par domaine fonctionnel.

Exemples :

- authService ;
- categoryService ;
- formationService ;
- chapterService ;
- sectionService ;
- subSectionService ;
- quizService ;
- questionService ;
- answerService ;
- attemptService ;
- studentAnswerService ;
- progressionService ;
- enrollmentService ;
- conversationService ;
- participantService ;
- messageService ;
- notificationService ;
- reviewService.

Les noms doivent être adaptés aux services réellement présents dans le projet.

---

# 22. RÈGLE BACKEND / FRONTEND

Le backend Express est la source de vérité pour les règles métier.

Le frontend React doit refléter :

- les routes ;
- les permissions ;
- les réponses ;
- les erreurs ;
- les statuts ;
- les règles de progression ;
- les règles de quiz ;
- les inscriptions ;
- les conversations ;
- les notifications.

Le frontend ne doit pas inventer une logique différente.

---

# 23. ERREURS HTTP

Le frontend doit gérer correctement les réponses HTTP.

Notamment :

200
→ succès

201
→ création réussie

400
→ requête invalide

401
→ non authentifié

403
→ accès interdit

404
→ ressource inexistante

409
→ conflit ou règle métier

422
→ données invalides lorsque utilisé

500
→ erreur serveur

---

# 24. TESTS BACKEND

Les tests backend peuvent être lancés depuis le dossier backend avec :

npm test

Les tests doivent vérifier notamment :

- API ;
- services ;
- permissions ;
- rôles ;
- base de données ;
- progression ;
- quiz ;
- notifications ;
- conversations ;
- scénarios cross-role.

---

# 25. TESTS API

Les endpoints peuvent être testés avec :

- Postman ;
- tests automatisés ;
- navigateur pour les requêtes GET lorsque pertinent.

Pour les tests manuels, utiliser :

docs/API_TEST_DATA.md

et :

docs/API_DOCUMENTATION.md

---

# 26. TEST CROSS-ROLE

Le projet doit être testé avec les différents rôles.

Exemple :

FORMATEUR
↓
crée formation
↓
crée chapitres
↓
crée sections
↓
crée sous-sections
↓
ajoute contenu Rich Text
↓
crée quiz

Puis :

ÉTUDIANT
↓
consulte catalogue
↓
s'inscrit
↓
accède au chapitre
↓
consulte le contenu
↓
passe le quiz
↓
obtient résultat
↓
valide le chapitre
↓
accède au chapitre suivant

Puis :

FORMATEUR
↓
consulte les résultats
↓
corrige les questions libres
↓
confirme la note

---

# 27. INSPIRATION OPENCLASSROOMS

Le projet s'inspire d'OpenClassrooms pour :

- l'organisation pédagogique ;
- le parcours séquentiel ;
- l'expérience utilisateur ;
- la séparation des rôles ;
- la logique d'évaluation ;
- le fonctionnement des quiz ;
- la présentation générale du parcours.

Cependant, le projet reste une plateforme universitaire locale gratuite.

Le système de certificats payants d'OpenClassrooms n'est pas intégré.

---

# 28. RÈGLES DE COHÉRENCE

Les éléments suivants doivent rester cohérents :

Backend
↕
Documentation API
↕
Services React
↕
Pages React
↕
Interface utilisateur

Une modification backend impliquant une route ou un contrat doit être répercutée dans :

- documentation ;
- services frontend ;
- composants concernés ;
- tests.

---

# 29. DOCUMENTATION DU PROJET

La documentation principale est organisée ainsi :

01_ProjectVision.md
→ vision et objectifs du projet

02_DataBaseRules.md
→ règles de base de données

03_Architecture.md
→ architecture technique et pédagogique

04_UI_UX.md
→ principes d'interface et expérience utilisateur

05_API.md
→ contrat API général

06_CodingStandards.md
→ conventions de développement

07_Roadmap.md
→ évolution du projet

08_ProjectRules.md
→ règles générales du projet

Documents techniques complémentaires :

API_DOCUMENTATION.md
→ documentation détaillée des endpoints

API_TEST_DATA.md
→ données nécessaires aux tests API

---

# 30. ORDRE DE TRAVAIL RECOMMANDÉ

Pour toute nouvelle fonctionnalité :

1. analyser le besoin ;
2. vérifier le modèle de données ;
3. vérifier les routes backend ;
4. vérifier les services backend ;
5. vérifier les permissions ;
6. tester l'API ;
7. mettre à jour la documentation ;
8. adapter les services React ;
9. adapter les composants React ;
10. tester l'interface ;
11. effectuer un test cross-role ;
12. vérifier la non-régression.

---

# 31. SOURCE DE VÉRITÉ

En cas de contradiction entre plusieurs documents :

1. code backend réel ;
2. schéma réel de la base ;
3. tests backend ;
4. documentation API détaillée ;
5. documentation générale.

La documentation doit être corrigée lorsqu'elle devient différente du comportement réel du backend.

---

# 32. OBJECTIF FINAL

Le projet doit fournir une plateforme locale gratuite permettant :

FORMATEUR
→ créer et gérer des formations

FORMATION
→ chapitres
→ sections
→ sous-sections
→ Rich Text
→ quiz

ÉTUDIANT
→ catalogue
→ inscription
→ parcours
→ contenu
→ quiz
→ progression
→ conversations
→ notifications
→ avis

ADMINISTRATEUR
→ administration
→ supervision
→ gestion selon les permissions

Le tout doit fonctionner à travers :

React
↓
API Express
↓
Services Node.js
↓
MySQL / elearningDb

avec une gestion correcte :

- des rôles ;
- de l'authentification ;
- des permissions ;
- de la progression ;
- des quiz ;
- des tentatives ;
- des conversations ;
- des notifications ;
- des données ;
- de la sécurité.

---

# 33. ÉTAT DU PROJET

Le backend a été restructuré autour du modèle pédagogique :

Formation
→ Chapitre
→ Section
→ Sous-section
→ Rich Text
→ Quiz

Le frontend doit maintenant être aligné sur ce contrat.

Avant toute modification importante du frontend, il faut vérifier les routes et contrats réellement disponibles dans :

docs/API_DOCUMENTATION.md

et les données de test dans :

docs/API_TEST_DATA.md