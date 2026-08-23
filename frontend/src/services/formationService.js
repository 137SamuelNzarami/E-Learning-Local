import client from "../api/client";
import { createResourceService } from "./resource";

/**
 * Backend : /api/formations
 * - GET    /                      (étudiant : PUBLIEES ; formateur : publiées + siennes ; admin : tout)
 * - GET    /:id                   (brouillon visible uniquement par son propriétaire / admin)
 * - POST   /                      { titre, description?, id_categorie } → statut BROUILLON
 * - PUT    /:id                   (le statut n'est jamais modifiable ici)
 * - PATCH  /:id/publish           (formateur propriétaire / admin)
 * - PATCH  /:id/unpublish         (formateur propriétaire / admin)
 * - DELETE /:id
 */
export const formationService = createResourceService("/formations");

export const formationServiceExtended = {
  ...formationService,
  publish: (id) => client.patch(`/formations/${id}/publish`),
  unpublish: (id) => client.patch(`/formations/${id}/unpublish`),
};
