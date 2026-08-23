import client from "../api/client";
import { createResourceService } from "./resource";

/**
 * Backend : /api/sous-sections
 * - GET    /                       (admin + formateur)
 * - GET    /section/:id_section    (accès contrôlé par le parcours)
 * - GET    /:id                    (avec contenu rich text)
 * - POST   /                       { id_section, titre?, contenu?, ordre? }
 * - PUT    /:id                    { titre?, contenu?, ordre? }  (contenu ≤ 2 Mo HTML)
 * - PATCH  /section/:id_section/reorder  { sous_sections: [ids] }
 * - DELETE /:id
 */
export const sousSectionService = createResourceService("/sous-sections");

export const sousSectionServiceExtended = {
  ...sousSectionService,
  bySection: (idSection) => client.get(`/sous-sections/section/${idSection}`),
  reorder: (idSection, orderedIds) =>
    client.patch(`/sous-sections/section/${idSection}/reorder`, {
      sous_sections: orderedIds.map(Number),
    }),
};
