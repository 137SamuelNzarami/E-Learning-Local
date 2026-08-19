# 07 - Roadmap du Projet

Projet : E-Learning Universitaire Locale

Version : 1.0

---

# 1. Objectif

Cette feuille de route décrit les différentes étapes de développement du projet.

Elle permet à Codex de développer le projet progressivement, sans essayer de générer toute l'application en une seule fois.

Chaque étape doit être terminée, testée et validée avant de passer à la suivante.

---

# 2. Principe général

Le développement suit une approche incrémentale.

Une seule fonctionnalité importante est développée à la fois.

Aucune nouvelle fonctionnalité ne doit être commencée tant que la précédente n'est pas entièrement fonctionnelle.

---

# 3. Étape 1 : Initialisation

Objectifs :

- Initialiser le dépôt Git.
- Initialiser le Backend Express.
- Initialiser le Frontend React avec Vite.
- Installer les dépendances.
- Configurer ESLint et Prettier.
- Configurer Tailwind CSS.
- Configurer les variables d'environnement.
- Tester le lancement des deux applications.

Critère de validation :

- Frontend accessible.
- Backend accessible.
- Structure des dossiers conforme.

---

# 4. Étape 2 : Connexion à la base de données

Objectifs :

- Configurer la connexion MySQL.
- Tester la connexion avec `elearning_db`.
- Créer le module de connexion réutilisable.
- Vérifier que toutes les tables sont accessibles.

Critère de validation :

Connexion réussie sans erreur.

---

# 5. Étape 3 : Authentification

Objectifs :

- Connexion.
- Déconnexion.
- JWT.
- bcrypt.
- Gestion des rôles.
- Middleware d'authentification.

Critère :

Un utilisateur peut se connecter et accéder à son tableau de bord.

---

# 6. Étape 4 : Gestion des utilisateurs

Implémenter :

- CRUD utilisateurs.
- CRUD rôles.
- Gestion des profils.

Validation :

Toutes les opérations CRUD fonctionnent.

---

# 7. Étape 5 : Gestion des catégories

Créer :

- CRUD catégories.

Validation :

Les catégories peuvent être créées, modifiées et supprimées.

---

# 8. Étape 6 : Gestion des formations

Créer :

- CRUD formations.
- Association avec les catégories.
- Association avec les formateurs.

Validation :

Une formation peut être publiée.

---

# 9. Étape 7 : Modules

Créer :

- CRUD modules.

Validation :

Une formation possède plusieurs modules.

---

# 10. Étape 8 : Chapitres

Créer :

- CRUD chapitres.

Validation :

Chaque module contient plusieurs chapitres.

---

# 11. Étape 9 : Leçons

Créer :

- CRUD leçons.

Validation :

Une leçon est correctement affichée.

---

# 12. Étape 10 : Uploads

Créer :

- Upload vidéos.
- Upload documents.

Validation :

Les fichiers sont stockés dans les dossiers prévus.

---

# 13. Étape 11 : Inscriptions

Créer :

- Inscription à une formation.
- Désinscription.

Validation :

Les inscriptions sont enregistrées.

---

# 14. Étape 12 : Progression

Créer :

- Calcul automatique.
- Affichage graphique.

Validation :

La progression est correctement calculée.

---

# 15. Étape 13 : Quiz

Créer :

- Quiz.
- Questions.
- Réponses.
- Tentatives.

Validation :

Les notes sont correctement calculées.

---

# 16. Étape 14 : Devoirs

Créer :

- Création.
- Dépôt.
- Correction.

Validation :

Les devoirs fonctionnent correctement.

---

# 17. Étape 15 : Messagerie

Créer :

- Conversations.
- Messages.

Validation :

Deux utilisateurs peuvent communiquer.

---

# 18. Étape 16 : Notifications

Créer :

- Création.
- Lecture.
- Suppression.

Validation :

Les notifications apparaissent correctement.

---

# 19. Étape 17 : Tableau de bord

Créer :

- Dashboard Administrateur.
- Dashboard Formateur.
- Dashboard Étudiant.

Validation :

Chaque rôle possède son propre tableau de bord.

---

# 20. Étape 18 : Optimisation

Effectuer :

- Optimisation SQL.
- Optimisation React.
- Optimisation API.
- Tests.

---

# 21. Étape 19 : Documentation

Mettre à jour :

- README.
- Documentation API.
- Documentation technique.

---

# 22. Étape 20 : Livraison

Effectuer :

- Vérification complète.
- Tests finaux.
- Nettoyage.
- Préparation du projet pour la soutenance.

---

# 23. Règle importante

Codex ne doit jamais développer plusieurs étapes simultanément.

Une étape doit être entièrement terminée avant de passer à la suivante.

---

# 24. Conclusion

Cette feuille de route constitue le planning officiel du développement.