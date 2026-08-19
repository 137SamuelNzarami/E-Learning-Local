# 01 - Vision du Projet

# E-Learning Universitaire Locale

Version : 1.0

---

# 1. Présentation

Le projet **E-Learning Universitaire Locale** consiste à concevoir et développer une plateforme numérique d'apprentissage destinée aux établissements d'enseignement supérieur.

Cette plateforme a pour objectif principal de faciliter la diffusion des enseignements numériques au sein d'une université sans dépendre obligatoirement d'une connexion Internet.

Elle sera installée sur le réseau local (LAN) de l'université afin de permettre aux enseignants, étudiants et administrateurs d'accéder aux ressources pédagogiques depuis les laboratoires informatiques, les salles de cours ou tout autre poste connecté au réseau interne.

Le projet est réalisé dans le cadre d'un Travail de Fin de Cycle (TFC) et servira également comme base d'un véritable système d'information universitaire.

---

# 2. Contexte

L'évolution rapide des Technologies de l'Information et de la Communication (TIC) a profondément transformé les méthodes d'enseignement.

Aujourd'hui, les grandes plateformes telles que :

- OpenClassrooms
- Moodle
- Coursera
- Udemy
- edX

offrent des environnements numériques performants permettant de suivre des formations entièrement en ligne.

Cependant, dans plusieurs établissements universitaires de la République Démocratique du Congo, ces solutions présentent plusieurs difficultés :

- coût élevé de la connexion Internet ;
- faible débit ;
- coupures fréquentes ;
- accès limité pour certains étudiants.

Le projet E-Learning Universitaire Locale constitue une réponse adaptée à ces contraintes.

---

# 3. Problématique

Comment mettre en place une plateforme d'apprentissage moderne permettant aux enseignants et aux étudiants d'interagir efficacement dans un environnement universitaire sans dépendre d'une connexion Internet permanente ?

---

# 4. Solution proposée

La solution consiste à développer une plateforme Web fonctionnant principalement sur un réseau local (LAN).

Les utilisateurs accéderont au système grâce à un navigateur Web connecté au serveur local de l'université.

L'ensemble des ressources pédagogiques sera stocké dans un serveur central.

Les étudiants pourront consulter les contenus à partir du réseau interne.

Lorsque l'université disposera d'un accès Internet, celui-ci constituera uniquement un service complémentaire.

---

# 5. Vision

Construire une plateforme moderne capable de devenir la référence numérique de l'université pour :

- la diffusion des enseignements ;
- la gestion des formations ;
- les évaluations ;
- les communications pédagogiques.

La plateforme devra être suffisamment évolutive pour intégrer ultérieurement :

- visioconférence ;
- application mobile ;
- intelligence artificielle ;
- synchronisation Cloud.

---

# 6. Mission

Mettre à la disposition de l'université une plateforme fiable, rapide, ergonomique et sécurisée permettant d'améliorer la qualité de l'enseignement numérique.

---

# 7. Objectifs

## Objectif général

Développer une plateforme E-Learning moderne adaptée aux besoins des universités.

---

## Objectifs spécifiques

La plateforme devra permettre :

- gérer les utilisateurs ;
- gérer les rôles ;
- créer des formations ;
- créer des modules ;
- créer des chapitres ;
- publier des leçons ;
- publier des vidéos ;
- publier des documents ;
- créer des quiz ;
- créer des devoirs ;
- suivre la progression des étudiants ;
- communiquer via une messagerie interne ;
- envoyer des notifications ;
- enregistrer les avis des étudiants.

---

# 8. Acteurs

Le système comporte trois acteurs principaux.

## Administrateur

Responsable de l'administration générale.

Il gère :

- les utilisateurs ;
- les rôles ;
- les catégories ;
- les statistiques ;
- les notifications.

---

## Formateur

Responsable des contenus pédagogiques.

Il peut :

- créer des formations ;
- créer des modules ;
- créer des chapitres ;
- créer des leçons ;
- déposer des vidéos ;
- déposer des documents ;
- créer des quiz ;
- créer des devoirs ;
- consulter les progressions.

---

## Étudiant

Utilisateur principal de la plateforme.

Il peut :

- consulter les formations ;
- s'inscrire ;
- suivre les cours ;
- regarder les vidéos ;
- télécharger les documents ;
- répondre aux quiz ;
- soumettre les devoirs ;
- consulter ses notes ;
- communiquer avec les enseignants ;
- recevoir des notifications.

---

# 9. Fonctionnement général

Le fonctionnement général est le suivant :

1. L'administrateur crée les comptes.
2. Les formateurs créent les formations.
3. Les étudiants s'inscrivent.
4. Les étudiants suivent les leçons.
5. Les quiz sont réalisés.
6. Les devoirs sont déposés.
7. Les enseignants corrigent.
8. La progression est mise à jour automatiquement.

---

# 10. Valeurs du projet

Le projet repose sur plusieurs valeurs fondamentales :

- simplicité ;
- accessibilité ;
- performance ;
- sécurité ;
- évolutivité ;
- maintenabilité.

---

# 11. Contraintes

Le développement devra respecter les contraintes suivantes.

## Techniques

- React.js
- Express.js
- Node.js
- MySQL

---

## Organisationnelles

Le système doit fonctionner avec :

- Administrateur
- Formateur
- Étudiant

---

## Fonctionnelles

Toutes les fonctionnalités devront être compatibles avec la base de données officielle.

---

# 12. Base de données

La base de données officielle est :

```
elearning_db
```

Elle contient 23 tables.

Cette base constitue la référence unique du projet.

Toute l'application devra être développée autour de cette base.

Le code s'adapte à la base.

La base ne s'adapte jamais au code.

---

# 13. Architecture cible

Le projet adopte une architecture Client / Serveur.

```
React
      │
      ▼

API REST Express

      │
      ▼

MySQL
```

Cette architecture garantit :

- modularité ;
- évolutivité ;
- performances ;
- maintenance facilitée.

---

# 14. UX / UI

Le projet devra posséder une identité graphique propre.

Les interfaces ne devront jamais être copiées depuis :

- Moodle
- OpenClassrooms
- Coursera
- Udemy

Les meilleures pratiques UX/UI pourront être utilisées uniquement comme source d'inspiration.

Le résultat devra être original.

---

# 15. Utilisation des Skills

Le projet contient plusieurs Skills dans le dossier :

```
.agents/skills/
```

Avant toute conception du Front-End :

Codex devra :

- analyser les Skills ;
- identifier ceux qui concernent le Design ;
- appliquer leurs recommandations lorsqu'elles améliorent le projet.

En cas de conflit :

Les règles définies dans la documentation officielle priment toujours.

---

# 16. Public cible

La plateforme est destinée :

- aux universités ;
- aux instituts supérieurs ;
- aux enseignants ;
- aux étudiants ;
- aux administrateurs.

---

# 17. Évolutions futures

La plateforme pourra intégrer :

- application Android ;
- synchronisation Internet ;
- visioconférence ;
- Intelligence Artificielle ;
- génération automatique des certificats ;
- tableau de bord décisionnel ;
- statistiques avancées.

---

# 18. Définition du succès

Le projet sera considéré comme réussi lorsque :

- toutes les fonctionnalités seront opérationnelles ;
- les performances seront satisfaisantes ;
- l'interface sera intuitive ;
- la sécurité sera assurée ;
- la plateforme fonctionnera correctement sur le réseau local.

---

# 19. Conclusion

Ce document constitue la vision officielle du projet.

Toutes les décisions techniques, fonctionnelles et ergonomiques devront être compatibles avec cette vision.

En cas de doute, cette documentation fait foi.