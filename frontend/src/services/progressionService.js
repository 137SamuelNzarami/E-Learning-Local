import client from "../api/client";

/**
 * Backend : /api/progressions — LECTURE SEULE côté frontend.
 *
 * Routes réelles :
 * - GET  /me                        (progressions de l'utilisateur courant)
 * - GET  /                          (admin)
 * - GET  /user/:id_utilisateur      (soi-même ; formateur : inscrits à ses formations)
 * - GET  /formation/:id_formation   (formateur propriétaire / admin)
 * - POST /formation/:id_formation/recompute (formateur propriétaire / admin)
 *
 * Le pourcentage est TOUJOURS calculé par le backend.
 * Aucune création/modification/suppression directe n'existe.
 */
export const progressionService = {
  me: () => client.get("/progressions/me"),
  index: () => client.get("/progressions"),
  getByUser: (id) => client.get(`/progressions/user/${id}`),
  getByFormation: (id) => client.get(`/progressions/formation/${id}`),
  recomputeForFormation: (id) =>
    client.post(`/progressions/formation/${id}/recompute`),
};

export const progressionServiceExtended = {
  ...progressionService,
};
