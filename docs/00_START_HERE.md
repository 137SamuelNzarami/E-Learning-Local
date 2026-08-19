# 00 - START HERE

# E-Learning Universitaire Locale

Version : 1.0

---

# Bienvenue

Ce dépôt contient le projet **E-Learning Universitaire Locale**, développé dans le cadre d'un Travail de Fin de Cycle (TFC).

Avant toute modification du projet, tu dois lire entièrement ce document puis tous les autres documents du dossier `docs`.

Aucune implémentation ne doit commencer avant cette lecture.

---

# Objectif du projet

Le projet consiste à développer une plateforme E-Learning fonctionnant principalement sur un réseau local (LAN) universitaire.

Cette plateforme permettra :

- aux administrateurs de gérer le système ;
- aux formateurs de publier des formations ;
- aux étudiants de suivre les formations, passer des évaluations et communiquer avec leurs enseignants.

Le projet est inspiré des meilleures plateformes E-Learning (OpenClassrooms, Moodle, Coursera, Udemy), mais possède sa propre identité graphique et fonctionnelle.

---

# Technologies du projet

## Front-End

- React.js
- Vite
- Tailwind CSS
- Axios
- Context API

## Back-End

- Node.js
- Express.js
- Architecture MVC
- JWT
- bcrypt
- Multer
- Express Validator

## Base de données

- MySQL
- PHPMyAdmin

---

# Base de données

La base officielle du projet est :

```
elearning_db
```

Le fichier SQL officiel est situé dans :

```
database/elearning_db.sql
```

Cette base est :

- déjà conçue ;
- déjà exécutée dans PHPMyAdmin ;
- la seule source de vérité du projet.

## Interdiction absolue

Ne jamais :

- modifier une table ;
- supprimer une table ;
- renommer une table ;
- modifier une clé primaire ;
- modifier une clé étrangère ;
- modifier une relation ;
- modifier les colonnes.

Si une amélioration est nécessaire, elle doit être proposée séparément et ne jamais être appliquée automatiquement.

---

# Skills

Le projet contient un dossier :

```
.agents/skills/
```

Avant de développer une interface ou une fonctionnalité importante :

1. analyser les Skills disponibles ;
2. identifier les recommandations pertinentes ;
3. appliquer ces recommandations lorsqu'elles sont compatibles avec la documentation du projet.

Les Skills servent à améliorer la qualité du code et du Front-End, mais ne remplacent jamais les règles définies dans les documents du projet.

---

# Documents à lire

Lire les documents suivants dans l'ordre :

1. README.md

2. docs/01_ProjectVision.md

3. docs/02_DataBaseRules.md

4. docs/03_Architecture.md

5. docs/04_UI_UX.md

6. docs/05_API.md

7. docs/06_CodingStandards.md

8. docs/07_Roadmap.md

9. docs/08_ProjectRules.md

10. docs/09_PromptTemplates.md

Ne commencer aucune implémentation avant d'avoir terminé cette lecture.

---

# Règles de développement

Respecter obligatoirement :

- Architecture MVC.
- API REST.
- React + Express.
- Tailwind CSS.
- MySQL.
- Clean Code.
- SOLID.
- DRY.
- KISS.

Le code doit être :

- lisible ;
- documenté ;
- modulaire ;
- réutilisable ;
- maintenable.

---

# Déroulement du développement

Le projet est développé de manière incrémentale.

Toujours respecter l'ordre suivant :

1. analyser ;
2. expliquer le plan ;
3. développer une seule fonctionnalité ;
4. tester ;
5. corriger les éventuels problèmes ;
6. attendre la validation avant de passer à la fonctionnalité suivante.

Ne jamais développer plusieurs modules importants simultanément.

---

# Communication

Avant chaque implémentation importante :

- expliquer brièvement ce qui sera développé ;
- indiquer les fichiers concernés ;
- préciser les impacts éventuels.

À la fin de chaque tâche :

- vérifier que le projet compile ;
- vérifier qu'aucune régression n'a été introduite ;
- résumer les modifications effectuées.

---

# Qualité attendue

Le résultat attendu est une plateforme :

- professionnelle ;
- moderne ;
- responsive ;
- accessible ;
- performante ;
- évolutive ;
- facilement maintenable.

Le Front-End doit posséder une identité graphique originale et ne pas reproduire l'apparence des plateformes existantes.

---

# Mission de l'agent

Ta mission est de développer progressivement cette plateforme en respectant strictement :

- la documentation du projet ;
- la structure de la base de données ;
- les règles de développement ;
- la feuille de route ;
- les conventions définies dans ce dépôt.

En cas de doute, privilégier toujours la documentation du projet plutôt que de prendre une décision automatique.

---

# Première action attendue

Avant d'écrire la moindre ligne de code :

1. Lire tous les documents.
2. Vérifier la structure du projet.
3. Vérifier la présence de la base de données.
4. Vérifier la présence des Skills.
5. Expliquer ta compréhension du projet.
6. Présenter le plan de la première étape.
7. Attendre la validation avant de commencer l'implémentation.

---

# Conclusion

Ce document constitue la porte d'entrée officielle du projet.

Toute implémentation doit commencer ici.

L'objectif est de garantir un développement cohérent, professionnel et conforme aux exigences du projet de fin de cycle.