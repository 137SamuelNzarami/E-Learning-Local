# 06 - Coding Standards

Projet : E-Learning Universitaire Locale

Version : 1.0

---

# 1. Objectif

Ce document définit les standards de développement du projet.

Toutes les contributions humaines ou générées par IA doivent respecter ces règles afin de garantir :

- un code propre ;
- une architecture homogène ;
- une maintenance simplifiée ;
- une évolutivité à long terme.

---

# 2. Principes fondamentaux

Le projet applique les principes suivants :

- SOLID
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Clean Code
- Clean Architecture
- Separation of Concerns
- Single Responsibility Principle

---

# 3. Langage

Tout le code est écrit en :

- JavaScript ES2023+

Commentaires et documentation :

- Français

Variables et fonctions :

- Anglais

---

# 4. Convention de nommage

Variables :

camelCase

Exemple :

```
studentProgress
courseTitle
quizScore
```

Fonctions :

camelCase

```
createCourse()

updateLesson()

deleteDocument()
```

Classes :

PascalCase

```
UserController

CourseService

QuizModel
```

Composants React :

PascalCase

```
Dashboard.jsx

CourseCard.jsx

Sidebar.jsx
```

Constantes :

UPPER_SNAKE_CASE

```
MAX_UPLOAD_SIZE

JWT_SECRET

DEFAULT_PAGE_SIZE
```

---

# 5. Organisation des fichiers

Un fichier = une responsabilité.

Éviter les fichiers de plusieurs centaines de lignes.

Préférer plusieurs petits modules.

---

# 6. Contrôleurs

Les contrôleurs :

- reçoivent les requêtes ;
- appellent les services ;
- renvoient les réponses JSON.

Ils ne doivent jamais contenir :

- de logique SQL ;
- de logique métier complexe.

---

# 7. Services

Toute la logique métier doit être placée dans les services.

Les services doivent être indépendants.

Ils peuvent être réutilisés par plusieurs contrôleurs.

---

# 8. Modèles

Chaque table MySQL possède :

- un modèle dédié.

Aucun modèle ne doit représenter plusieurs tables.

---

# 9. Routes

Une ressource = un routeur.

Exemple :

```
users.routes.js

courses.routes.js

quiz.routes.js
```

---

# 10. Middlewares

Créer des middlewares spécialisés :

- authMiddleware
- roleMiddleware
- uploadMiddleware
- errorMiddleware
- validationMiddleware

Les middlewares doivent être réutilisables.

---

# 11. React

Les composants doivent être :

- petits ;
- réutilisables ;
- indépendants.

Ils ne doivent pas contenir de logique métier.

---

# 12. Hooks

Créer des hooks personnalisés lorsque la logique est réutilisée.

Exemple :

```
useAuth()

usePagination()

useNotifications()
```

---

# 13. Services React

Toutes les requêtes HTTP passent par Axios.

Créer un service par ressource.

Exemple :

```
authService.js

courseService.js

quizService.js
```

---

# 14. Gestion de l'état

Utiliser :

- Context API

ou

- Redux Toolkit

Le choix devra rester cohérent dans tout le projet.

---

# 15. Validation

Toutes les données doivent être validées.

Backend :

Express Validator

Frontend :

Validation immédiate des formulaires.

---

# 16. Gestion des erreurs

Toutes les erreurs sont centralisées.

Ne jamais afficher une erreur SQL brute à l'utilisateur.

---

# 17. Sécurité

Toujours :

- hasher les mots de passe avec bcrypt ;
- vérifier les rôles ;
- protéger les routes privées avec JWT ;
- valider les fichiers uploadés.

---

# 18. Commentaires

Commenter uniquement :

- les traitements complexes ;
- les algorithmes ;
- les décisions techniques importantes.

Éviter les commentaires inutiles.

---

# 19. Formatage

Le projet utilise :

- ESLint
- Prettier

Le code doit être formaté automatiquement.

---

# 20. Gestion Git

Conventions de commits :

```
feat:
fix:
docs:
refactor:
style:
test:
chore:
```

Exemple :

```
feat(auth): add JWT authentication
fix(course): correct pagination bug
docs(api): update routes documentation
```

---

# 21. Tests

Chaque nouvelle fonctionnalité doit être testée.

Prévoir :

- tests unitaires ;
- tests d'intégration ;
- tests manuels.

---

# 22. Performance

Toujours rechercher :

- des requêtes SQL optimisées ;
- des composants React performants ;
- des appels API limités ;
- la pagination des listes.

---

# 23. Documentation

Chaque module important doit être documenté.

Chaque fonction publique doit posséder une description.

---

# 24. Instructions spécifiques pour Codex

Avant toute génération de code :

1. Lire ce document.
2. Respecter les conventions de nommage.
3. Respecter l'architecture MVC.
4. Produire un code lisible.
5. Factoriser le code commun.
6. Éviter les duplications.
7. Documenter les traitements importants.
8. Utiliser les Skills présents dans `.agents/skills` lorsque cela améliore la qualité du code sans contredire les autres documents.

---

# 25. Conclusion

Les standards définis dans ce document sont obligatoires.

Ils garantissent un projet professionnel, cohérent, maintenable et évolutif.