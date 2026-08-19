# 09 - Prompt Templates

Projet : E-Learning Universitaire Locale

Version : 1.0

---

# Objectif

Ce document contient les modèles de prompts utilisés pour piloter Codex tout au long du développement.

Avant d'exécuter n'importe quel prompt ci-dessous, Codex doit :

1. Lire le README.md.
2. Lire tous les documents du dossier docs/.
3. Considérer la base de données elearning_db comme la seule source de vérité.
4. Ne jamais modifier la structure de la base de données.
5. Lire les Skills présents dans `.agents/skills` si nécessaire.
6. Développer uniquement la fonctionnalité demandée.
7. Expliquer brièvement son plan avant d'écrire du code.
8. Vérifier que le projet compile avant de terminer la tâche.

---

# Prompt 1 : Analyse du projet

Analyse entièrement le projet.

Lis le README.md ainsi que tous les documents du dossier docs/.

Analyse également la structure du backend, du frontend, la base de données MySQL et les Skills présents dans `.agents/skills`.

Explique ensuite ta compréhension générale du projet sans modifier aucun fichier.

---

# Prompt 2 : Initialisation

Configure complètement le projet.

Initialise :

- Backend Express
- Frontend React (Vite)
- Tailwind CSS
- ESLint
- Prettier
- Variables d'environnement
- Connexion MySQL

Ne développe aucune fonctionnalité métier.

---

# Prompt 3 : Authentification

Développe uniquement le module d'authentification.

Inclure :

- JWT
- bcrypt
- Login
- Logout
- Gestion des rôles
- Middleware Auth

Respecter la base de données existante.

---

# Prompt 4 : Gestion des utilisateurs

Développe uniquement le CRUD des utilisateurs.

Créer :

- modèle
- service
- contrôleur
- routes
- pages React

Tester le fonctionnement.

---

# Prompt 5 : Gestion des catégories

Créer le CRUD complet des catégories.

---

# Prompt 6 : Gestion des formations

Développer :

- CRUD Formations
- Association catégories
- Association formateurs

---

# Prompt 7 : Modules

Créer le CRUD des modules.

---

# Prompt 8 : Chapitres

Créer le CRUD des chapitres.

---

# Prompt 9 : Leçons

Créer le CRUD des leçons.

---

# Prompt 10 : Vidéos

Créer :

- Upload
- Lecture
- Suppression

---

# Prompt 11 : Documents

Créer :

- Upload
- Téléchargement
- Suppression

---

# Prompt 12 : Inscriptions

Créer le système d'inscription aux formations.

---

# Prompt 13 : Progression

Créer le calcul automatique de la progression.

Afficher la progression dans le Dashboard étudiant.

---

# Prompt 14 : Quiz

Créer complètement :

- Quiz
- Questions
- Réponses
- Tentatives
- Correction automatique

---

# Prompt 15 : Devoirs

Créer :

- Dépôt
- Correction
- Notation

---

# Prompt 16 : Messagerie

Développer :

- Conversations
- Messages
- Notifications de nouveaux messages

---

# Prompt 17 : Notifications

Créer le système complet de notifications.

---

# Prompt 18 : Tableau de bord Administrateur

Créer un Dashboard moderne affichant :

- utilisateurs
- statistiques
- catégories
- activité récente
- notifications

---

# Prompt 19 : Tableau de bord Formateur

Créer un Dashboard affichant :

- formations
- étudiants
- quiz
- devoirs
- progression

---

# Prompt 20 : Tableau de bord Étudiant

Créer un Dashboard affichant :

- formations suivies
- progression
- quiz
- devoirs
- notifications
- calendrier

---

# Prompt 21 : Optimisation Front-End

Analyser les Skills présents dans `.agents/skills`.

Appliquer les recommandations pertinentes afin d'améliorer :

- UX
- UI
- Responsive Design
- Performance

Le résultat ne doit pas ressembler à Moodle, Coursera ou OpenClassrooms.

Créer une identité graphique propre au projet.

---

# Prompt 22 : Optimisation Back-End

Optimiser :

- API
- SQL
- performances
- sécurité

Sans modifier la base de données.

---

# Prompt 23 : Tests

Créer les tests :

- unitaires
- intégration
- API

Corriger automatiquement les erreurs détectées.

---

# Prompt 24 : Documentation

Mettre à jour :

- README.md
- commentaires
- documentation API

---

# Prompt 25 : Vérification finale

Effectuer un audit complet du projet.

Vérifier :

- cohérence de l'architecture
- respect des conventions
- conformité avec la base de données
- sécurité
- performance
- qualité du code
- documentation

Ne rien modifier sans validation.

Présenter un rapport détaillé avec les améliorations proposées.