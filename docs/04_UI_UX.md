# UI / UX

L'expérience utilisateur s'inspire d'OpenClassrooms.

## Administrateur

Dashboard
→ utilisateurs
→ catégories
→ formations
→ supervision
→ notifications
→ conversations selon permissions

## Formateur

Dashboard
→ mes formations
→ créer une formation
→ description
→ chapitres
→ sections
→ sous-sections
→ Rich Text Editor
→ quiz
→ questions
→ résultats
→ correction des questions libres
→ étudiants inscrits
→ conversations
→ notifications

Le formateur ne doit gérer que ses propres formations.

## Étudiant

Catalogue
→ détail formation
→ inscription
→ parcours
→ chapitre
→ section
→ sous-section
→ contenu Rich Text
→ quiz
→ résultat
→ progression

Le chapitre suivant reste verrouillé tant que le précédent
n'est pas validé.

## Important

Le frontend ne doit jamais être considéré comme le mécanisme
de sécurité.

Masquer un bouton ne suffit pas.

L'API backend doit également refuser l'action interdite.