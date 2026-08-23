# Base de données de référence

Base réelle :

elearningDb

Ne pas utiliser :

elearning_db

## Principe

Le frontend ne manipule jamais directement MySQL.

Frontend
↓
API Express
↓
Services
↓
Repositories
↓
MySQL elearningDb

## Règles

Les IDs envoyés par le frontend ne doivent jamais permettre
de contourner les autorisations.

L'identité de l'utilisateur connecté provient du JWT.

Exemple :

req.user.id

et non un id_utilisateur arbitraire fourni par le frontend.

## Progression

Le frontend ne constitue jamais la source de vérité de la progression.

Le backend calcule et valide l'état du parcours.

## Quiz

Les bonnes réponses ne doivent jamais être exposées prématurément
à l'étudiant.

## Migrations

Toute modification de la base doit être :

1. analysée ;
2. documentée ;
3. migrée ;
4. testée ;
5. vérifiée.

Aucune modification silencieuse de la base.