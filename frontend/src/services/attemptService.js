import client from "../api/client";

/**
 * Backend : /api/attempts
 *
 * Routes réelles :
 * - GET   /                          (admin uniquement)
 * - GET   /user/:id_utilisateur      (étudiant : soi-même ; admin : tous)
 * - POST  /quiz/:id_quiz/start       (étudiant) → { tentative, score_reussite, questions[] }
 * - POST  /:id/submit                (étudiant) { reponses: [...] } → { statut, note, a_corriger, message }
 * - GET   /quiz/:id_quiz/mine        (étudiant) → historique + peut_passer
 * - GET   /quiz/:id_quiz/attempts    (scopé : étudiant=siennes, formateur=ses étudiants, admin=tout)
 * - GET   /:id                       (propriétaire ou admin)
 * - PATCH /:id/corriger              (formateur propriétaire / admin) { notes: [...] }
 *
 * AUCUNE création/modification/suppression générique n'existe côté backend.
 */
export const attemptService = {
  index: () => client.get("/attempts"),
  getByUser: (id) => client.get(`/attempts/user/${id}`),
  show: (id) => client.get(`/attempts/${id}`),
};

export const attemptServiceExtended = {
  ...attemptService,

  /** Historique de l'étudiant courant sur un quiz. */
  mine: (idQuiz) => client.get(`/attempts/quiz/${idQuiz}/mine`),

  /**
   * Tentatives d'un quiz (scopées côté backend) :
   * formateur propriétaire → tentatives de ses étudiants.
   */
  listByQuiz: (idQuiz) => client.get(`/attempts/quiz/${idQuiz}/attempts`),

  /**
   * Démarrer (ou reprendre) une tentative.
   * Idempotent : renvoie la tentative EN_COURS existante.
   */
  start: (idQuiz) => client.post(`/attempts/quiz/${idQuiz}/start`),

  /**
   * Soumettre une tentative EN_COURS.
   * payload.reponses = [
   *   { id_question, id_reponses: [10, 11] },  // QCM (ensemble exact)
   *   { id_question, contenu: "texte" },       // LIBRE
   * ]
   * La NOTE est toujours calculée par le backend.
   */
  submit: (idTentative, payload) =>
    client.post(`/attempts/${idTentative}/submit`, payload),

  /**
   * Correction manuelle des questions LIBRE (formateur propriétaire).
   * payload.notes = [{ id_reponse_etudiant, note }]
   */
  corriger: (idTentative, payload) =>
    client.patch(`/attempts/${idTentative}/corriger`, payload),
};
