import client from "../api/client";
import { createResourceService } from "./resource";

/**
 * Backend : /api/sections
 * - GET    /                      (admin + formateur)
 * - GET    /chapter/:id_chapitre  (accès contrôlé par le parcours)
 * - GET    /:id
 * - POST   /                      { id_chapitre, titre?, description?, ordre? }
 * - PUT    /:id                   { titre?, description?, ordre? }
 * - PATCH  /chapter/:id_chapitre/reorder  { sections: [ids] }
 * - DELETE /:id                   (cascade sous-sections)
 */
export const sectionService = createResourceService("/sections");

export const sectionServiceExtended = {
  ...sectionService,
  byChapter: (idChapitre) => client.get(`/sections/chapter/${idChapitre}`),
  reorder: (idChapitre, orderedIds) =>
    client.patch(`/sections/chapter/${idChapitre}/reorder`, {
      sections: orderedIds.map(Number),
    }),
};
