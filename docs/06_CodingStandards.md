# Standards

## Backend

JavaScript moderne / ES Modules.

Respecter :

routes
controllers
services
repositories

Ne pas mettre toute la logique métier dans les controllers.

## Frontend

React.

Les appels HTTP doivent passer par les services API existants.

Éviter de mettre directement les URLs API dans les composants.

## Sécurité

Ne jamais faire confiance :

- aux IDs fournis par le frontend ;
- au rôle fourni par le frontend ;
- au score fourni par le frontend ;
- au pourcentage de progression fourni par le frontend.

## Erreurs

Ne jamais masquer une erreur backend.

Une erreur 401/403/404/422 doit être interprétée
selon le contrat API.

## Validation

Frontend et backend doivent utiliser les mêmes noms de champs
et respecter le contrat API.