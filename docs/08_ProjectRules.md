# 08 - Project Rules

Projet : E-Learning Universitaire Locale

Version : 1.0

---

# 1. Objectif

Ce document définit les règles générales du projet.

Toutes les personnes ou intelligences artificielles (Codex, ChatGPT, GitHub Copilot, Cursor AI, etc.) qui participent au développement doivent respecter ces règles.

Ces règles sont prioritaires sur toute décision d'implémentation.

---

# 2. Ordre de lecture obligatoire

Avant toute modification du projet, l'agent doit lire les documents suivants dans cet ordre :

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

Aucune implémentation ne doit commencer avant la lecture complète de ces documents.

---

# 3. Base de données

La base officielle du projet est :

elearning_db

Elle est déjà créée.

Elle est déjà exécutée dans PHPMyAdmin.

Elle constitue la seule source de vérité.

Le code doit s'adapter à cette base.

La base ne doit jamais être adaptée au code.

---

# 4. Interdictions

Il est strictement interdit de :

- modifier une table existante ;
- supprimer une table ;
- renommer une table ;
- modifier une clé primaire ;
- modifier une clé étrangère ;
- modifier les relations SQL ;
- supprimer une colonne ;
- renommer une colonne ;
- changer le type d'une colonne ;
- recréer la base de données.

Toute amélioration doit être proposée séparément.

---

# 5. Architecture

Respecter obligatoirement :

- MVC
- API REST
- React + Express
- MySQL
- Context API (ou Redux si validé)
- Tailwind CSS

---

# 6. Front-End

Le Front-End doit être :

- moderne ;
- responsive ;
- accessible ;
- réutilisable ;
- performant.

Ne jamais copier l'interface de Moodle, Coursera, Udemy ou OpenClassrooms.

---

# 7. Skills

Avant de développer une interface :

analyser le dossier

.agents/skills/

Identifier les Skills liés :

- au design ;
- à React ;
- à l'expérience utilisateur ;
- à l'architecture.

Appliquer leurs recommandations lorsqu'elles sont compatibles avec le projet.

---

# 8. Code

Toujours produire :

- du code lisible ;
- documenté ;
- modulaire ;
- réutilisable ;
- testé.

---

# 9. API

Chaque table possède :

- un modèle ;
- un service ;
- un contrôleur ;
- un routeur.

Respecter les conventions REST.

---

# 10. Authentification

Utiliser :

- JWT
- bcrypt

Toutes les routes sensibles doivent être protégées.

---

# 11. Uploads

Les fichiers doivent être stockés dans :

uploads/videos/

uploads/documents/

uploads/devoirs/

Ne jamais enregistrer les fichiers dans MySQL.

---

# 12. Git

Les commits doivent être petits.

Une seule fonctionnalité par commit.

---

# 13. Développement

Le développement suit obligatoirement la Roadmap.

Ne jamais développer plusieurs fonctionnalités majeures en parallèle.

---

# 14. Tests

Chaque fonctionnalité doit être :

- développée ;
- testée ;
- validée ;

avant de passer à la suivante.

---

# 15. Communication avec l'utilisateur

Avant toute implémentation importante, expliquer brièvement :

- ce qui sera développé ;
- les fichiers concernés ;
- les impacts éventuels.

---

# 16. Suggestions

Les suggestions d'amélioration sont autorisées.

Mais elles ne doivent jamais être appliquées automatiquement.

Toujours attendre la validation du propriétaire du projet.

---

# 17. Documentation

Tout nouveau module doit être documenté.

Le README doit être mis à jour si nécessaire.

---

# 18. Qualité

Le projet doit rester :

- cohérent ;
- évolutif ;
- professionnel ;
- maintenable.

---

# 19. Fin de tâche

À la fin de chaque tâche, vérifier :

✓ Le code compile.

✓ Les tests passent.

✓ Aucune régression.

✓ Les règles du projet sont respectées.

---

# 20. Conclusion

En cas de conflit entre une décision de développement et ce document, ce document prévaut.