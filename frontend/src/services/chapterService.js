import client from "../api/client";
import { createResourceService } from "./resource";

/**
 * Backend : /api/chapters
 * - GET    /                              (admin + formateur)
 * - GET    /formation/:id_formation       étudiant : VUE PARCOURS
 *            { formation, chapitres:[{id_chapitre,titre,description,ordre,a_quiz,valide,accessible}], progression_pourcentage }
 *            admin/formateur : tableau simple.
 * - GET    /:id                           (accès contrôlé par le parcours)
 * - POST   /                              { id_formation, titre, description? } (ordre auto)
 * - PUT    /:id                           { titre?, description?, ordre? }
 * - PATCH  /formation/:id_formation/reorder  { chapitres: [ids] }
 * - POST   /:id/complete                  étudiant inscrit — chapitre SANS quiz uniquement
 *                                           → { completed, pourcentage }
 * - DELETE /:id
 */
export const chapterService = createResourceService("/chapters");

export const chapterServiceExtended = {
  ...chapterService,
  byFormation: (idFormation) => client.get(`/chapters/formation/${idFormation}`),
  reorder: (idFormation, orderedIds) =>
    client.patch(`/chapters/formation/${idFormation}/reorder`, {
      chapitres: orderedIds.map(Number),
    }),
  complete: (idChapitre) => client.post(`/chapters/${idChapitre}/complete`),
};
