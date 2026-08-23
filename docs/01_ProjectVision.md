# Vision du projet

E-Learning Universitaire Locale est une plateforme gratuite d'apprentissage
destinée à un environnement universitaire local.

La plateforme possède trois rôles :

- Administrateur
- Formateur
- Étudiant

L'expérience pédagogique s'inspire d'OpenClassrooms pour :

- le catalogue ;
- l'organisation pédagogique ;
- le parcours séquentiel ;
- les chapitres ;
- les sections ;
- les sous-sections ;
- le contenu Rich Text ;
- les quiz ;
- la progression ;
- les espaces distincts par rôle.

Les fonctionnalités payantes et le système de certificats ne font pas partie
du périmètre actuel.

## Architecture pédagogique

FORMATION
→ CHAPITRES
→ SECTIONS
→ SOUS-SECTIONS
→ CONTENU RICH TEXT
→ QUIZ DE CHAPITRE

Un quiz est associé à un chapitre.

Le quiz constitue le contrôle permettant de valider le chapitre.

Un étudiant ne peut accéder au chapitre suivant que lorsque le quiz
du chapitre précédent est réussi.

Cette règle est contrôlée côté backend.