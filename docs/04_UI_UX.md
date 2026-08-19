# 04 - UI / UX Design System

# E-Learning Universitaire Locale

Version : 1.0

---

# 1. Objectif

Ce document définit les règles officielles concernant :

- l'expérience utilisateur (UX) ;
- l'interface utilisateur (UI) ;
- le Design System ;
- les composants graphiques ;
- les tableaux de bord ;
- les règles de conception du Front-End.

Toutes les interfaces du projet devront respecter cette documentation.

---

# 2. Philosophie du Design

La plateforme doit donner une impression de :

- modernité ;
- simplicité ;
- professionnalisme ;
- rapidité ;
- confiance ;
- accessibilité.

L'utilisateur doit comprendre immédiatement comment utiliser l'application sans avoir besoin d'une formation.

---

# 3. Inspirations

Les plateformes suivantes peuvent servir d'inspiration uniquement pour leurs bonnes pratiques UX :

- OpenClassrooms
- Coursera
- Moodle
- Udemy
- edX
- LinkedIn Learning

⚠ Aucune interface ne devra être copiée.

Le projet doit posséder une identité graphique propre.

---

# 4. Public cible

Les interfaces sont destinées :

- aux étudiants ;
- aux enseignants ;
- aux administrateurs ;
- aux responsables académiques.

Les utilisateurs ne sont pas forcément experts en informatique.

L'interface doit donc rester intuitive.

---

# 5. Principes UX

Chaque page devra respecter les principes suivants :

- simplicité ;
- cohérence ;
- lisibilité ;
- rapidité ;
- accessibilité ;
- navigation claire.

L'utilisateur doit toujours savoir :

- où il se trouve ;
- ce qu'il peut faire ;
- comment revenir en arrière.

---

# 6. Responsive Design

Toutes les pages doivent fonctionner sur :

- Desktop
- Laptop
- Tablette
- Smartphone

Le Responsive Design est obligatoire.

---

# 7. Palette de couleurs

Couleurs principales :

Primary

```
#2563EB
```

Secondary

```
#1E40AF
```

Success

```
#16A34A
```

Warning

```
#F59E0B
```

Danger

```
#DC2626
```

Background

```
#F8FAFC
```

Text

```
#1E293B
```

---

# 8. Typographie

Police principale :

```
Inter
```

Police secondaire :

```
Poppins
```

Les titres doivent être hiérarchisés :

- H1
- H2
- H3
- H4

Les textes doivent rester lisibles.

---

# 9. Icônes

Utiliser :

- Lucide React
- Heroicons
- React Icons

Les icônes doivent être cohérentes sur toute l'application.

---

# 10. Structure générale

Chaque interface comprend :

```
Header

↓

Sidebar

↓

Contenu principal

↓

Footer
```

---

# 11. Tableaux de bord

Trois tableaux de bord sont prévus.

## Administrateur

Contient :

- statistiques ;
- utilisateurs ;
- catégories ;
- notifications ;
- activités récentes.

---

## Formateur

Contient :

- formations ;
- modules ;
- étudiants ;
- progression ;
- devoirs ;
- quiz.

---

## Étudiant

Contient :

- formations suivies ;
- progression ;
- dernières leçons ;
- quiz ;
- devoirs ;
- notifications.

---

# 12. Navigation

La navigation doit être simple.

Toujours afficher :

- Accueil
- Formations
- Tableau de bord
- Notifications
- Profil
- Déconnexion

---

# 13. Composants réutilisables

Créer des composants indépendants :

- Button
- Card
- Badge
- Avatar
- Modal
- Table
- Alert
- Breadcrumb
- Pagination
- Spinner
- ProgressBar
- Toast
- EmptyState

Tous les composants devront être réutilisables.

---

# 14. Cartes de formation

Chaque formation est affichée sous forme de carte.

La carte contient :

- image ;
- titre ;
- catégorie ;
- enseignant ;
- progression ;
- bouton "Continuer".

---

# 15. Page Formation

Chaque formation possède :

- bannière ;
- description ;
- enseignant ;
- modules ;
- progression ;
- avis ;
- bouton d'inscription.

---

# 16. Page Leçon

Une leçon contient :

- vidéo ;
- contenu ;
- documents ;
- quiz associé ;
- devoir éventuel.

La lecture doit être agréable.

---

# 17. Formulaires

Tous les formulaires doivent :

- afficher les erreurs clairement ;
- utiliser des labels ;
- posséder une validation immédiate ;
- afficher les champs obligatoires.

---

# 18. Messages utilisateur

Les notifications doivent être :

- discrètes ;
- compréhensibles ;
- non bloquantes.

Utiliser des Toasts.

---

# 19. États des interfaces

Prévoir systématiquement :

- Loading
- Empty State
- Error State
- Success State

Aucune page ne doit rester vide.

---

# 20. Animations

Animations légères uniquement.

Utiliser :

- Framer Motion

Les animations doivent améliorer l'expérience sans ralentir l'application.

---

# 21. Accessibilité

Respecter les bonnes pratiques :

- contraste suffisant ;
- navigation clavier ;
- focus visible ;
- textes alternatifs pour les images.

---

# 22. Dark Mode

Prévoir une architecture permettant l'ajout futur d'un mode sombre.

Le développement initial sera réalisé en mode clair.

---

# 23. Performance Front-End

Optimisations :

- Lazy Loading
- Code Splitting
- Memoization
- Optimisation des images

---

# 24. Instructions concernant les Skills

Le projet contient plusieurs Skills dans :

```
.agents/skills/
```

Avant toute conception graphique :

Codex devra :

1. analyser les Skills présents ;
2. identifier ceux dédiés au Design et à l'UX ;
3. appliquer leurs recommandations lorsqu'elles sont compatibles avec ce document.

Les Skills doivent servir d'inspiration et non remplacer les règles définies ici.

---

# 25. Originalité

Le Front-End ne doit jamais être une copie de :

- Moodle
- Coursera
- Udemy
- OpenClassrooms
- edX

Le résultat attendu est une identité visuelle propre à l'Université.

---

# 26. Expérience utilisateur

L'expérience doit donner l'impression :

- d'une plateforme moderne ;
- rapide ;
- fluide ;
- professionnelle.

Chaque interaction doit être intuitive.

---

# 27. Instructions pour Codex

Avant de développer une interface :

1. Lire entièrement ce document.

2. Lire les Skills présents dans `.agents/skills`.

3. Identifier les meilleures pratiques UX/UI.

4. Concevoir une interface originale.

5. Produire des composants réutilisables.

6. Respecter le Responsive Design.

7. Respecter la cohérence graphique.

8. Ne jamais copier une plateforme existante.

---

# 28. Conclusion

Ce document constitue la référence officielle du Design System.

Toutes les interfaces devront respecter ces règles afin de garantir une expérience utilisateur cohérente, moderne et professionnelle.