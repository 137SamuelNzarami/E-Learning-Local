# 02 - Database Rules

# Base de données officielle du projet

Projet : E-Learning Universitaire Locale

Version : 1.0

---

# 1. Objet du document

Ce document définit les règles officielles concernant la base de données du projet **E-Learning Universitaire Locale**.

Il constitue la référence principale pour tous les développements réalisés sur le Backend, le Frontend ainsi que les API.

Toute personne ou intelligence artificielle (Codex, ChatGPT, GitHub Copilot, etc.) participant au développement du projet doit respecter les règles décrites dans ce document.

---

# 2. Base de données officielle

Nom :

```
elearning_db
```

SGBD :

```
MySQL
```

Administration :

```
PHPMyAdmin
```

Cette base est déjà créée.

Elle est déjà exécutée.

Elle est fonctionnelle.

Elle constitue la référence officielle du projet.

---

# 3. Philosophie

Le développement suit une règle fondamentale :

> **Le code s'adapte à la base de données. La base de données ne s'adapte jamais au code.**

Toutes les implémentations devront être réalisées autour de cette structure existante.

---

# 4. Règles impératives

Il est strictement interdit de :

- supprimer une table ;
- renommer une table ;
- modifier une clé primaire ;
- modifier une clé étrangère ;
- changer les relations ;
- modifier un type de données ;
- supprimer une colonne ;
- renommer une colonne ;
- recréer la base de données ;
- remplacer la structure SQL existante.

Toute proposition d'amélioration devra être documentée séparément et ne sera appliquée qu'après validation explicite du propriétaire du projet.

---

# 5. Tables de la base de données

La base contient les tables suivantes :

1. roles
2. utilisateurs
3. categories
4. formations
5. modules
6. chapitres
7. lecons
8. videos
9. documents
10. inscriptions
11. progressions
12. quiz
13. questions
14. reponses
15. tentatives
16. reponses_etudiants
17. devoirs
18. soumissions
19. avis
20. conversations
21. participant_conversations
22. messages
23. notifications

---

# 6. Description fonctionnelle des tables

## roles

Contient les rôles du système.

Exemples :

- Administrateur
- Formateur
- Étudiant

---

## utilisateurs

Informations des utilisateurs.

Elle centralise tous les comptes.

---

## categories

Catégories des formations.

---

## formations

Contient les formations créées par les formateurs.

---

## modules

Découpage d'une formation.

Une formation possède plusieurs modules.

---

## chapitres

Organisation pédagogique des modules.

---

## lecons

Chaque chapitre contient plusieurs leçons.

---

## videos

Ressources vidéo liées aux leçons.

---

## documents

Supports PDF, Word ou autres.

---

## inscriptions

Historique des inscriptions des étudiants.

---

## progressions

Pourcentage de progression d'un étudiant dans une formation.

---

## quiz

Évaluations automatiques.

---

## questions

Questions appartenant aux quiz.

---

## reponses

Réponses possibles.

Une seule ou plusieurs peuvent être correctes.

---

## tentatives

Historique des passages des quiz.

---

## reponses_etudiants

Réponses données par les étudiants.

---

## devoirs

Travaux demandés par les enseignants.

---

## soumissions

Travaux déposés par les étudiants.

---

## avis

Commentaires des étudiants.

---

## conversations

Messagerie interne.

---

## participant_conversations

Participants des conversations.

---

## messages

Messages échangés.

---

## notifications

Notifications envoyées aux utilisateurs.

---

# 7. Relations générales

Les principales relations sont :

Roles

↓

Utilisateurs

↓

Formations

↓

Modules

↓

Chapitres

↓

Leçons

↓

Vidéos

↓

Documents

↓

Quiz

↓

Questions

↓

Réponses

Les étudiants sont reliés aux formations par :

Inscriptions

Progressions

Tentatives

Soumissions

Avis

Notifications

---

# 8. Intégrité référentielle

Toutes les clés étrangères doivent être respectées.

Aucune suppression ne devra provoquer une rupture des relations.

Le Backend devra gérer correctement les erreurs liées aux contraintes SQL.

---

# 9. Transactions

Les opérations critiques devront utiliser des transactions MySQL.

Exemples :

- inscription ;
- soumission d'un devoir ;
- passage d'un quiz ;
- création d'une formation.

---

# 10. Sécurité

Les mots de passe seront toujours chiffrés avec :

bcrypt

Jamais en clair.

---

# 11. Conventions SQL

Les noms des tables restent inchangés.

Les noms des colonnes restent inchangés.

Les identifiants sont utilisés comme définis dans le script SQL officiel.

Les clés étrangères existantes doivent être utilisées telles quelles.

---

# 12. Utilisation par le Backend

Le Backend Express devra :

- utiliser cette structure ;
- créer les modèles correspondants ;
- créer les contrôleurs ;
- créer les routes REST ;
- ne jamais contourner les relations SQL.

---

# 13. Utilisation par le Frontend

Le Frontend React ne communique jamais directement avec MySQL.

Toutes les opérations passent par l'API REST Express.

---

# 14. Évolutions futures

Les évolutions devront être proposées sous forme de migrations ou de scripts SQL distincts.

Le schéma actuel ne devra jamais être modifié automatiquement.

---

# 15. Instructions pour Codex

Avant toute génération de code :

1. Lire entièrement ce document.

2. Considérer la base `elearning_db` comme la seule source de vérité.

3. Générer les modèles Express directement à partir des tables existantes.

4. Générer les contrôleurs en respectant les clés étrangères.

5. Ne jamais inventer de nouvelles tables sans validation.

6. Ne jamais modifier la structure SQL.

7. Adapter toute logique métier à cette base.

---

# 16. Conclusion

La base de données constitue le socle du projet.

Toutes les couches de l'application (Frontend, Backend, API) doivent être développées autour de cette structure.

En cas de conflit entre le code et la base de données, la base de données prévaut toujours.