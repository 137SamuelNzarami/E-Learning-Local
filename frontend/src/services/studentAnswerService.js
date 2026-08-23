import client from "../api/client";

/**
 * Backend : /api/student-answers — LECTURE SEULE côté frontend.
 *
 * Routes réelles :
 * - GET  /                      (admin)
 * - GET  /attempt/:id_tentative (étudiant : ses réponses, sans corrigé ;
 *                                formateur propriétaire : avec est_correcte)
 * - GET  /:id
 *
 * Les réponses étudiantes sont créées UNIQUEMENT via POST /attempts/:id/submit.
 */
export const studentAnswerService = {
  index: () => client.get("/student-answers"),
  getByAttempt: (id) => client.get(`/student-answers/attempt/${id}`),
  show: (id) => client.get(`/student-answers/${id}`),
};

export const studentAnswerServiceExtended = {
  ...studentAnswerService,
};
