/**
 * Harnais "Scénario transversal — introduction de la formation" (Phase 5).
 *
 * Exécution : node tests/cross-role.test.js
 *
 * Parcourt le scénario réel de bout en bout, en croisant les rôles :
 *
 *  1. Le formateur construit le contenu : introduction de la formation
 *     (description), introduction du module (titre), introduction du
 *     chapitre (titre) et le contenu pédagogique de la leçon (contenu),
 *     puis quiz + questions + réponses, devoir, vidéo et document.
 *  2. L'étudiant s'inscrit et consulte : l'introduction est lisible,
 *     le contenu pédagogique est accessible, mais le corrigé
 *     (est_correcte) n'est JAMAIS exposé avant d'avoir répondu.
 *  3. L'étudiant passe le quiz (note recalculée côté serveur) et
 *     soumet son devoir.
 *  4. Le formateur consulte la tentative (vue de correction) et note
 *     la soumission du devoir.
 *  5. Cloisonnement : IDOR sur tentative/soumission, le corrigé reste
 *     masqué pour un étudiant tiers, et un étudiant ne peut jamais
 *     modifier sa note.
 *
 * Nécessite la base MySQL configurée (.env) avec les rôles et des
 * utilisateurs réels (formateurs et étudiants existants).
 */
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import pool from "../src/config/database.js";
import ROLES from "../src/constants/role.js";

const results = [];
let failures = 0;
const suite = "CROSSROLE";

function check(condition, label) {
  if (!condition) failures += 1;
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

/**
 * Récupère un utilisateur réel de la base et signe un JWT valide.
 */
async function getRealUser(roleLabel, order = 1) {
  const [rows] = await pool.query(
    `SELECT u.id_utilisateur, r.libelle AS role, u.email
     FROM utilisateurs u
     INNER JOIN roles r ON u.id_role = r.id_role
     WHERE r.libelle = ?
     ORDER BY u.id_utilisateur
     LIMIT ?, 1`,
    [roleLabel, order - 1],
  );
  if (rows.length === 0) {
    throw new Error(`Aucun utilisateur du rôle "${roleLabel}" trouvé en base.`);
  }
  const u = rows[0];
  return {
    id: u.id_utilisateur,
    token: jwt.sign(
      { id: u.id_utilisateur, role: u.role, email: u.email },
      process.env.JWT_SECRET,
    ),
  };
}

function jsonRequest(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

function formRequest(method, path, { token, fields } = {}) {
  const form = new FormData();
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value instanceof Blob) {
        form.append(key, value, value.name || "fichier");
      } else {
        form.append(key, String(value));
      }
    }
  }
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return { method, headers, body: form };
}

async function main() {
  const admin = await getRealUser(ROLES.ADMIN, 1);
  const formateur = await getRealUser(ROLES.FORMATEUR, 1); // Jean
  const etudiant = await getRealUser(ROLES.ETUDIANT, 1); // Pierre
  const etudiantTiers = await getRealUser(ROLES.ETUDIANT, 2); // Camille

  if (etudiantTiers.id === etudiant.id) {
    throw new Error("Il faut au moins deux étudiants distincts en base.");
  }

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, options = {}) => {
    const init = options.fields
      ? formRequest(method, path, options)
      : jsonRequest(method, path, options);
    const res = await fetch(`${base}${path}`, init);
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* corps non JSON */
    }
    return { status: res.status, body };
  };

  const marqueur = Date.now();
  const F = formateur.token;
  const S = etudiant.token;
  const C = etudiantTiers.token;

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 1 — Le formateur construit le contenu                         */
  /* ------------------------------------------------------------------ */

  const cats = await call("GET", "/api/categories", { token: admin.token });
  check(cats.status === 200, "GET /categories admin -> 200");
  const idCategorie = cats.body?.data?.[0]?.id_categorie;

  // Introduction de la formation = description
  const introFormation =
    "Introduction : bienvenue dans cette formation de validation. " +
    "Vous y découvrirez les bases du développement web.";

  const formation = await call("POST", "/api/formations", {
    token: F,
    body: {
      id_categorie: idCategorie,
      titre: `Formation de validation ${marqueur}`,
      description: introFormation,
    },
  });
  check(formation.status === 200, "POST /formations formateur -> 200");
  const idFormation = formation.body?.data?.id;

  const detailF = await call("GET", `/api/formations/${idFormation}`, {
    token: F,
  });
  check(
    detailF.status === 200 && detailF.body?.data?.description === introFormation,
    "l'introduction de la formation est bien enregistrée",
  );

  // Deuxième formation du même formateur : sert à vérifier la
  // déduplication des conversations (une conversation par formation).
  const formation2 = await call("POST", "/api/formations", {
    token: F,
    body: {
      id_categorie: idCategorie,
      titre: `Formation de validation B ${marqueur}`,
      description: "Deuxième formation pour la déduplication des conversations.",
    },
  });
  check(formation2.status === 200, "POST /formations (2e) formateur -> 200");
  const idFormation2 = formation2.body?.data?.id;

  // Introduction du module = titre
  const descriptionModule =
    "Ce module pose les fondations du HTML : structure, balises et arborescence.";
  const module = await call("POST", "/api/modules", {
    token: F,
    body: {
      id_formation: idFormation,
      titre: `Introduction au HTML ${marqueur}`,
      description: descriptionModule,
    },
  });
  check(module.status === 200, "POST /modules formateur -> 200");
  const idModule = module.body?.data?.id;

  // Introduction du chapitre = titre
  const descriptionChapitre =
    "Premier contact avec la structure d'un document HTML et ses balises essentielles.";
  const chapitre = await call("POST", "/api/chapters", {
    token: F,
    body: {
      id_module: idModule,
      titre: `Bien débuter avec le HTML ${marqueur}`,
      description: descriptionChapitre,
    },
  });
  check(chapitre.status === 200, "POST /chapters formateur -> 200");
  const idChapitre = chapitre.body?.data?.id;

  // Contenu pédagogique de la leçon
  const contenu =
    "Une page HTML se compose d'un doctype, d'une balise <html>, " +
    "d'un en-tête <head> et d'un corps <body>.";
  const descriptionLecon =
    "Objectif : savoir écrire une page HTML minimale valide et l'afficher dans un navigateur.";
  const lecon = await call("POST", "/api/lessons", {
    token: F,
    body: {
      id_chapitre: idChapitre,
      titre: `Première page HTML ${marqueur}`,
      contenu,
      description: descriptionLecon,
    },
  });
  check(lecon.status === 200, "POST /lessons formateur -> 200");
  const idLecon = lecon.body?.data?.id;

  const quiz = await call("POST", "/api/quizzes", {
    token: F,
    body: { id_lecon: idLecon, titre: `Quiz : Première page HTML ${marqueur}` },
  });
  check(quiz.status === 200, "POST /quizzes formateur -> 200");
  const idQuiz = quiz.body?.data?.id;

  const q1 = await call("POST", "/api/questions", {
    token: F,
    body: { id_quiz: idQuiz, enonce: "Où place-t-on le corps d'une page ?" },
  });
  check(q1.status === 200, "POST /questions (1/2) formateur -> 200");
  const idQ1 = q1.body?.data?.id;

  const q2 = await call("POST", "/api/questions", {
    token: F,
    body: { id_quiz: idQuiz, enonce: "Quelle balise encadre le contenu visible ?" },
  });
  check(q2.status === 200, "POST /questions (2/2) formateur -> 200");
  const idQ2 = q2.body?.data?.id;

  // Réponses : 1 correcte + 1 fausse par question
  const r1 = await call("POST", "/api/answers", {
    token: F,
    body: { id_question: idQ1, contenu: "Dans la balise <body>.", est_correcte: true },
  });
  check(r1.status === 200, "POST /answers (Q1 correcte) -> 200");
  const idR1 = r1.body?.data?.id;

  const r2 = await call("POST", "/api/answers", {
    token: F,
    body: { id_question: idQ1, contenu: "Dans la balise <head>.", est_correcte: false },
  });
  check(r2.status === 200, "POST /answers (Q1 fausse) -> 200");
  const idR2 = r2.body?.data?.id;

  const r3 = await call("POST", "/api/answers", {
    token: F,
    body: { id_question: idQ2, contenu: "<title>", est_correcte: false },
  });
  check(r3.status === 200, "POST /answers (Q2 fausse) -> 200");
  const idR3 = r3.body?.data?.id;

  const r4 = await call("POST", "/api/answers", {
    token: F,
    body: { id_question: idQ2, contenu: "<body>", est_correcte: true },
  });
  check(r4.status === 200, "POST /answers (Q2 correcte) -> 200");
  const idR4 = r4.body?.data?.id;

  const instructionsDevoir =
    "Créez une page HTML minimale avec un titre, un paragraphe et une image. " +
    "Déposez votre fichier .html (ou une archive .zip) avant la date limite.";
  const devoir = await call("POST", "/api/assignments", {
    token: F,
    body: {
      id_lecon: idLecon,
      titre: `Devoir : Ma première page HTML ${marqueur}`,
      instructions: instructionsDevoir,
    },
  });
  check(devoir.status === 200, "POST /assignments formateur -> 200");
  const idDevoir = devoir.body?.data?.id;

  // Consignes téléchargeables du devoir (fichier protégé)
  const fakeConsignes = new Blob(
    [new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 45])],
    { type: "application/pdf" },
  );
  fakeConsignes.name = "consignes-devoir.pdf";
  const consignes = await call("PUT", `/api/assignments/${idDevoir}/consignes`, {
    token: F,
    fields: { fichier_consignes: fakeConsignes },
  });
  check(
    consignes.status === 200 && !!consignes.body?.data?.fichier_consignes,
    "POST /assignments/:id/consignes (fichier de consignes) -> 200",
  );

  const fakeMp4 = new Blob([new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112])], {
    type: "video/mp4",
  });
  fakeMp4.name = "introduction.mp4";
  const video = await call("POST", "/api/videos", {
    token: F,
    fields: { id_lecon: idLecon, titre: `Vidéo : Bien débuter ${marqueur}`, fichier: fakeMp4 },
  });
  check(video.status === 200, "POST /videos formateur -> 200");
  const idVideo = video.body?.data?.id;

  const fakePdf = new Blob([new Uint8Array([37, 80, 68, 70, 45])], {
    type: "application/pdf",
  });
  fakePdf.name = "support-cours.pdf";
  const document = await call("POST", "/api/documents", {
    token: F,
    fields: { id_lecon: idLecon, titre: `Support de cours PDF ${marqueur}`, fichier: fakePdf },
  });
  check(document.status === 200, "POST /documents formateur -> 200");
  const idDocument = document.body?.data?.id;

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 2 — L'étudiant s'inscrit et consulte                          */
  /* ------------------------------------------------------------------ */

  const inscription = await call("POST", "/api/enrollments", {
    token: S,
    body: { id_formation: idFormation },
  });
  check(inscription.status === 200, "POST /enrollments étudiant -> 200");

  // Conversation automatique formateur <-> étudiant
  const [convPartagee] = await pool.query(
    `SELECT pcA.id_conversation, c.sujet
     FROM participant_conversations pcA
     INNER JOIN participant_conversations pcB ON pcA.id_conversation = pcB.id_conversation
     INNER JOIN conversations c ON pcA.id_conversation = c.id_conversation
     WHERE pcA.id_utilisateur = ? AND pcB.id_utilisateur = ?
     LIMIT 1`,
    [etudiant.id, formateur.id],
  );
  check(
    convPartagee.length > 0,
    "l'inscription crée une conversation formateur/étudiant",
  );

  const messagerieS = await call("GET", `/api/conversation-participants/user/${etudiant.id}`, {
    token: S,
  });
  check(
    messagerieS.status === 200 &&
      Array.isArray(messagerieS.body?.data) &&
      messagerieS.body.data.some(
        (c) =>
          convPartagee.length > 0 &&
          Number(c.id_conversation) === Number(convPartagee[0].id_conversation),
      ),
    "l'étudiant retrouve la conversation automatique dans sa messagerie",
  );

  // Une inscription dans une 2e formation du même formateur doit créer
  // une conversation distincte (déduplication par formation).
  const inscription2 = await call("POST", "/api/enrollments", {
    token: S,
    body: { id_formation: idFormation2 },
  });
  check(inscription2.status === 200, "POST /enrollments (2e formation) étudiant -> 200");

  const [convsX] = await pool.query(
    `SELECT pcA.id_conversation, c.sujet
     FROM participant_conversations pcA
     INNER JOIN participant_conversations pcB ON pcA.id_conversation = pcB.id_conversation
     INNER JOIN conversations c ON pcA.id_conversation = c.id_conversation
     WHERE pcA.id_utilisateur = ? AND pcB.id_utilisateur = ?
       AND c.sujet LIKE ?
     ORDER BY c.id_conversation`,
    [etudiant.id, formateur.id, `%${marqueur}%`],
  );
  check(
    convsX.length === 2 &&
      new Set(convsX.map((c) => Number(c.id_conversation))).size === 2,
    "deux formations du même formateur = deux conversations distinctes",
  );

  // Progression initiale à 0 % créée automatiquement par l'inscription
  const prog0 = await call("GET", `/api/progressions/user/${etudiant.id}`, {
    token: S,
  });
  const progRow0 = (prog0.body?.data || []).find(
    (p) => Number(p.id_formation) === Number(idFormation),
  );
  check(
    prog0.status === 200 && progRow0 && Number(progRow0.pourcentage) === 0,
    "l'inscription crée une progression initiale à 0 %",
  );

  const introS = await call("GET", `/api/formations/${idFormation}`, {
    token: S,
  });
  check(
    introS.status === 200 && introS.body?.data?.description === introFormation,
    "l'étudiant lit l'introduction de la formation",
  );

  const leconS = await call("GET", `/api/lessons/${idLecon}`, { token: S });
  check(
    leconS.status === 200 && leconS.body?.data?.contenu === contenu,
    "l'étudiant accède au contenu pédagogique de la leçon",
  );
  check(
    leconS.body?.data?.description === descriptionLecon,
    "la description de la leçon est lisible",
  );

  const moduleS = await call("GET", `/api/modules/${idModule}`, { token: S });
  check(
    moduleS.status === 200 && moduleS.body?.data?.description === descriptionModule,
    "la description du module est lisible",
  );

  const chapitreS = await call("GET", `/api/chapters/${idChapitre}`, { token: S });
  check(
    chapitreS.status === 200 && chapitreS.body?.data?.description === descriptionChapitre,
    "la description du chapitre est lisible",
  );

  const devoirS = await call("GET", `/api/assignments/${idDevoir}`, { token: S });
  check(
    devoirS.status === 200 && devoirS.body?.data?.instructions === instructionsDevoir,
    "les instructions du devoir sont lisibles par l'étudiant",
  );
  check(
    !!devoirS.body?.data?.fichier_consignes,
    "le devoir expose le fichier de consignes",
  );

  const quizS = await call("GET", `/api/quizzes/${idQuiz}`, { token: S });
  check(quizS.status === 200, "GET /quizzes/:id étudiant -> 200");

  const questionsS = await call("GET", `/api/questions/quiz/${idQuiz}`, {
    token: S,
  });
  check(
    questionsS.status === 200 && questionsS.body?.data?.length === 2,
    "l'étudiant liste les 2 questions du quiz",
  );

  const reponsesS = await call("GET", `/api/answers/question/${idQ1}`, {
    token: S,
  });
  const dataS = reponsesS.body?.data;
  const aucuneCorrige =
    Array.isArray(dataS) &&
    dataS.length === 2 &&
    dataS.every((r) => r && !Object.prototype.hasOwnProperty.call(r, "est_correcte"));
  check(
    reponsesS.status === 200 && aucuneCorrige,
    "le corrigé (est_correcte) n'est pas exposé à l'étudiant avant de répondre",
  );

  const videoS = await call("GET", `/api/videos/${idVideo}`, { token: S });
  check(videoS.status === 200, "GET /videos/:id étudiant -> 200");

  const documentS = await call("GET", `/api/documents/${idDocument}`, {
    token: S,
  });
  check(documentS.status === 200, "GET /documents/:id étudiant -> 200");

  /* Fichiers protégés : contrôle d'accès sur /api/files/:filename */
  const docChemin = documentS.body?.data?.chemin_document;
  const nomFichier = docChemin ? docChemin.split("/").pop() : null;
  if (nomFichier) {
    const fileS = await call("GET", `/api/files/${nomFichier}`, { token: S });
    check(fileS.status === 200, "l'étudiant inscrit télécharge le fichier protégé (200)");

    const fileSq = await call("GET", `/api/files/${nomFichier}?token=${S}`, {});
    check(fileSq.status === 200, "le fichier protégé est accessible via ?token=");

    const fileC = await call("GET", `/api/files/${nomFichier}`, { token: C });
    check(fileC.status === 404, "un étudiant tiers ne télécharge pas le fichier (404)");

    const fileAnon = await call("GET", `/api/files/${nomFichier}`, {});
    check(fileAnon.status === 401, "un visiteur non authentifié est refusé (401)");
  }

  const consignesChemin = consignes.body?.data?.fichier_consignes;
  const nomConsignes = consignesChemin ? consignesChemin.split("/").pop() : null;
  if (nomConsignes) {
    const consignesS = await call("GET", `/api/files/${nomConsignes}`, { token: S });
    check(consignesS.status === 200, "l'étudiant inscrit télécharge les consignes du devoir (200)");
    const consignesC = await call("GET", `/api/files/${nomConsignes}`, { token: C });
    check(consignesC.status === 404, "un étudiant tiers ne télécharge pas les consignes (404)");
  }

  /* Complétion de leçon -> mise à jour de la progression */
  const complete = await call("POST", `/api/lessons/${idLecon}/complete`, {
    token: S,
  });
  check(
    complete.status === 200 &&
      complete.body?.data?.completed === true &&
      Number(complete.body?.data?.pourcentage) > 0,
    "l'étudiant marque la leçon comme terminée (progression > 0)",
  );

  const statut = await call("GET", `/api/lessons/${idLecon}/status`, { token: S });
  check(
    statut.status === 200 && statut.body?.data?.completed === true,
    "le statut de la leçon est 'terminée'",
  );

  const completeC = await call("POST", `/api/lessons/${idLecon}/complete`, {
    token: C,
  });
  check(completeC.status === 403, "un étudiant tiers ne marque pas la leçon (403)");

  const progApres = await call("GET", `/api/progressions/user/${etudiant.id}`, {
    token: S,
  });
  const progRowApres = (progApres.body?.data || []).find(
    (p) => Number(p.id_formation) === Number(idFormation),
  );
  check(
    progApres.status === 200 &&
      progRowApres &&
      Number(progRowApres.pourcentage) > 0,
    "la progression de l'étudiant est recalculée après la leçon",
  );

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 3 — L'étudiant passe le quiz et soumet son devoir             */
  /* ------------------------------------------------------------------ */

  const tentative = await call("POST", "/api/attempts", {
    token: S,
    body: { id_utilisateur: etudiant.id, id_quiz: idQuiz },
  });
  check(tentative.status === 200, "POST /attempts étudiant -> 200");
  const idTentative = tentative.body?.data?.id;

  const sa1 = await call("POST", "/api/student-answers", {
    token: S,
    body: { id_tentative: idTentative, id_question: idQ1, id_reponse: idR1 },
  });
  check(sa1.status === 200, "POST /student-answers (bonne réponse) -> 200");

  const sa2 = await call("POST", "/api/student-answers", {
    token: S,
    body: { id_tentative: idTentative, id_question: idQ2, id_reponse: idR3 },
  });
  check(sa2.status === 200, "POST /student-answers (mauvaise réponse) -> 200");

  const maTentative = await call("GET", `/api/attempts/${idTentative}`, {
    token: S,
  });
  check(
    maTentative.status === 200 && Number(maTentative.body?.data?.note) === 50,
    "la note du quiz est recalculée côté serveur (1/2 -> 50/100)",
  );

  const fakeSoumission = new Blob([new Uint8Array([37, 80, 68, 70, 45])], {
    type: "application/pdf",
  });
  fakeSoumission.name = "devoir-etudiant.pdf";
  const soumission = await call("POST", "/api/submissions", {
    token: S,
    fields: { id_devoir: idDevoir, fichier: fakeSoumission },
  });
  check(soumission.status === 200, "POST /submissions étudiant -> 200");
  const idSoumission = soumission.body?.data?.id;

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 4 — Le formateur consulte et corrige                          */
  /* ------------------------------------------------------------------ */

  const tentativesQuiz = await call("GET", `/api/attempts/quiz/${idQuiz}`, {
    token: F,
  });
  const vueFormateur = tentativesQuiz.body?.data;
  check(
    tentativesQuiz.status === 200 &&
      Array.isArray(vueFormateur) &&
      vueFormateur.some((t) => Number(t.id_utilisateur) === Number(etudiant.id)),
    "le formateur consulte la tentative de l'étudiant (vue de correction)",
  );

  const notation = await call("PUT", `/api/submissions/${idSoumission}`, {
    token: F,
    fields: { note: 90 },
  });
  check(
    notation.status === 200 && Number(notation.body?.data?.note) === 90,
    "le formateur note la soumission du devoir (90/100)",
  );

  const soumissionsDevoir = await call(
    "GET",
    `/api/submissions/assignment/${idDevoir}`,
    { token: F },
  );
  const listeSoumissions = soumissionsDevoir.body?.data;
  check(
    soumissionsDevoir.status === 200 &&
      Array.isArray(listeSoumissions) &&
      listeSoumissions.some(
          (s) =>
            Number(s.id_soumission) === Number(idSoumission) &&
            Number(s.note) === 90,
      ),
    "le formateur voit la soumission notée dans la liste du devoir",
  );

  const reponsesF = await call("GET", `/api/answers/question/${idQ1}`, {
    token: F,
  });
  const dataF = reponsesF.body?.data;
  const corrigeVisible =
    Array.isArray(dataF) &&
    dataF.some((r) => r && r.est_correcte === 1 || r?.est_correcte === true);
  check(
    reponsesF.status === 200 && corrigeVisible,
    "le formateur propriétaire voit le corrigé (est_correcte)",
  );

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 5 — Cloisonnement : un étudiant tiers                         */
  /* ------------------------------------------------------------------ */

  const idorTentative = await call("GET", `/api/attempts/${idTentative}`, {
    token: C,
  });
  check(idorTentative.status === 403, "IDOR : tentative d'autrui -> 403");

  const idorSoumission = await call("GET", `/api/submissions/${idSoumission}`, {
    token: C,
  });
  check(idorSoumission.status === 403, "IDOR : soumission d'autrui -> 403");

  const tentativesTiers = await call("GET", `/api/attempts/quiz/${idQuiz}`, {
    token: C,
  });
  const dataTiers = tentativesTiers.body?.data;
  check(
    tentativesTiers.status === 200 &&
      Array.isArray(dataTiers) &&
      !dataTiers.some(
        (t) => Number(t.id_utilisateur) === Number(etudiant.id),
      ),
    "un étudiant tiers ne voit pas la tentative de l'étudiant inscrit",
  );

  const reponsesC = await call("GET", `/api/answers/question/${idQ1}`, {
    token: C,
  });
  const dataC = reponsesC.body?.data;
  const aucuneCorrigeTiers =
    Array.isArray(dataC) &&
    dataC.every(
      (r) => r && !Object.prototype.hasOwnProperty.call(r, "est_correcte"),
    );
  check(
    reponsesC.status === 200 && aucuneCorrigeTiers,
    "le corrigé reste masqué pour un étudiant tiers",
  );

  const tentativeFraude = await call("PUT", `/api/submissions/${idSoumission}`, {
    token: S,
    fields: { note: 5 },
  });
  check(
    tentativeFraude.status === 200 && Number(tentativeFraude.body?.data?.note) === 90,
    "un étudiant ne peut pas modifier la note de sa soumission",
  );

  await new Promise((resolve) => server.close(resolve));
  await pool.end();

  console.log("--- Résultats ---");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.label}`);
  }
  console.log(`\nRÉSULTATS : ${results.length - failures} PASS / ${failures} FAIL`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("ERREUR FATALE :", err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(2);
});
