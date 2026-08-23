# Règles absolues du projet

1. La base réelle est elearningDb.

2. Ne jamais utiliser elearning_db.

3. Ne jamais désactiver les Foreign Keys.

4. Ne jamais contourner une autorisation backend.

5. Ne jamais faire confiance au frontend pour la sécurité.

6. Ne jamais permettre à un étudiant de modifier une formation.

7. Un formateur ne gère que ses propres formations.

8. Un étudiant ne peut accéder qu'aux formations auxquelles
   il a les droits nécessaires.

9. La progression est calculée côté backend.

10. Le frontend ne peut pas déclarer arbitrairement une formation
    terminée.

11. Un quiz appartient à un chapitre.

12. Le chapitre suivant est verrouillé jusqu'à réussite
    du quiz précédent.

13. Les QCM peuvent être corrigés automatiquement.

14. Les questions libres nécessitent une correction du formateur.

15. Un étudiant peut repasser un quiz échoué selon les règles métier.

16. Les bonnes réponses ne doivent jamais être exposées
    à l'étudiant avant la correction.

17. Une conversation étudiant/formateur peut être créée
    automatiquement lors de l'inscription.

18. Les conversations doivent respecter les participants.

19. Les notifications ne doivent pas casser l'action métier.

20. Ne pas réintroduire le certificat.

21. Ne pas réintroduire les devoirs comme mécanisme pédagogique
    principal si le backend actuel les a supprimés du produit.

22. Ne pas réintroduire arbitrairement les anciennes entités
    module/lesson/video/document si elles ont été supprimées
    de l'architecture actuelle.

23. Ne jamais modifier la DB sans analyser son impact.

24. Après chaque correction :
    test backend
    → test API
    → test navigateur
    → non-régression.

25. Ne jamais déclarer PASS sans test réel.