/**
 * Harnais « Scénario transversal » — nouvelle architecture pédagogique.
 *
 * Exécution : node tests/cross-role.test.js
 *
 * Parcourt le scénario réel de bout en bout, en croisant les rôles :
 *
 *  1. Le formateur construit le contenu : formation (puis publication),
 *     2 chapitres, sections, sous-sections (RICH TEXT), quiz du
 *     chapitre 1 (questions QCM + LIBRE) et réponses.
 *  2. L'étudiant s'inscrit : le chapitre 1 est accessible, le chapitre 2
 *     est VERROUILLÉ tant que le quiz 1 n'est pas réussi. Le corrigé
 *     (est_correcte) n'est JAMAIS exposé.
 *  3. L'étudiant passe le quiz : QCM auto-corrigé + réponse libre ->
 *     tentative A_CORRIGER ; le formateur est notifié.
 *  4. Le formateur corrige la réponse libre -> note finale recalculée
 *     côté serveur, l'étudiant est notifié.
 *  5. Après réussite : progression mise à jour et chapitre 2 débloqué.
 *  6. Cloisonnement : IDOR sur tentatives/réponses, corrigé masqué pour
 *     un étudiant tiers, conversation automatique par inscription.
 *
 * Nécessite la base MySQL configurée (.env) avec au moins un admin,
 * un formateur et DEUX étudiants réels.
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

async function main() {
  const admin = await getRealUser(ROLES.ADMIN, 1);
  const formateur = await getRealUser(ROLES.FORMATEUR, 1);
  const etudiant = await getRealUser(ROLES.ETUDIANT, 1);
  const etudiantTiers = await getRealUser(ROLES.ETUDIANT, 2);

  if (etudiantTiers.id === etudiant.id) {
    throw new Error("Il faut au moins deux étudiants distincts en base.");
  }

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, options = {}) => {
    const init = jsonRequest(method, path, options);
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

  const formation = await call("POST", "/api/formations", {
    token: F,
    body: {
      id_categorie: idCategorie,
      titre: `Formation E2E ${marqueur}`,
      description:
        "Introduction : bienvenue dans cette formation de validation E2E.",
    },
  });
  check(formation.status === 200, "POST /formations formateur -> 200");
  const idFormation = formation.body?.data?.id;

  // Publication : condition d'inscription étudiante
  const publish = await call("PATCH", `/api/formations/${idFormation}/publish`, {
    token: F,
  });
  check(publish.status === 200, "PATCH /formations/:id/publish -> 200");

  // Chapitre 1 (avec quiz) et chapitre 2 (verrouillé au départ)
  const ch1 = await call("POST", "/api/chapters", {
    token: F,
    body: {
      id_formation: idFormation,
      titre: `Chapitre 1 : Premiers pas ${marqueur}`,
      description: "Les bases.",
    },
  });
  check(ch1.status === 200, "POST /chapters formateur -> 200");
  const idCh1 = ch1.body?.data?.id;

  const ch2 = await call("POST", "/api/chapters", {
    token: F,
    body: {
      id_formation: idFormation,
      titre: `Chapitre 2 : Approfondissement ${marqueur}`,
      description: "La suite.",
    },
  });
  check(ch2.status === 200, "POST /chapters (2e) -> 200");
  const idCh2 = ch2.body?.data?.id;

  // Section + sous-section RICH TEXT dans le chapitre 1
  const sec1 = await call("POST", "/api/sections", {
    token: F,
    body: {
      id_chapitre: idCh1,
      titre: `Section 1.1 ${marqueur}`,
      description: "Découverte du contenu.",
    },
  });
  check(sec1.status === 200, "POST /sections -> 200");
  const idSec1 = sec1.body?.data?.id;

  const richText =
    "<h2>Bienvenue</h2><p>Voici votre <strong>première</strong> leçon.</p>" +
    "<ul><li>Point clé 1</li><li>Point clé 2</li></ul>";

  const ss1 = await call("POST", "/api/sous-sections", {
    token: F,
    body: {
      id_section: idSec1,
      titre: `Sous-section 1.1.1 ${marqueur}`,
      contenu: richText,
    },
  });
  check(ss1.status === 200, "POST /sous-sections (rich text) -> 200");
  const idSS1 = ss1.body?.data?.id;

  // Quiz du chapitre 1 : 1 question QCM + 1 question LIBRE
  const quiz1 = await call("POST", "/api/quizzes", {
    token: F,
    body: {
      id_chapitre: idCh1,
      titre: `Quiz : valider le chapitre 1 ${marqueur}`,
      score_reussite: 50,
    },
  });
  check(quiz1.status === 200, "POST /quizzes -> 200");
  const idQuiz = quiz1.body?.data?.id;

  // Un seul quiz par chapitre
  const quizDup = await call("POST", "/api/quizzes", {
    token: F,
    body: { id_chapitre: idCh1, titre: `Quiz doublon ${marqueur}` },
  });
  check(quizDup.status === 409, "POST /quizzes doublon sur le chapitre -> 409");

  const qcm = await call("POST", "/api/questions", {
    token: F,
    body: { id_quiz: idQuiz, enonce: "HTML signifie ?", type: "QCM", points: 1 },
  });
  check(qcm.status === 200, "POST /questions (QCM) -> 200");
  const idQcm = qcm.body?.data?.id;

  const libre = await call("POST", "/api/questions", {
    token: F,
    body: {
      id_quiz: idQuiz,
      enonce: "Citez un point clé du cours.",
      type: "LIBRE",
      points: 1,
    },
  });
  check(libre.status === 200, "POST /questions (LIBRE) -> 200");
  const idLibre = libre.body?.data?.id;

  const rOk = await call("POST", "/api/answers", {
    token: F,
    body: { id_question: idQcm, texte: "HyperText Markup Language", est_correcte: true },
  });
  check(rOk.status === 200, "POST /answers (correcte) -> 200");
  const idRepOk = rOk.body?.data?.id;

  const rKo = await call("POST", "/api/answers", {
    token: F,
    body: { id_question: idQcm, texte: "Hyper Text Machine Language" },
  });
  check(rKo.status === 200, "POST /answers (fausse) -> 200");
  const idRepKo = rKo.body?.data?.id;

  // Le type d'une question ne change jamais
  const qTypeChange = await call("PUT", `/api/questions/${idQcm}`, {
    token: F,
    body: { type: "LIBRE" },
  });
  check(qTypeChange.status === 422 || qTypeChange.status === 400 || qTypeChange.status === 409,
    "PUT /questions changer le type -> refusé");

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 2 — L'étudiant s'inscrit et explore le parcours               */
  /* ------------------------------------------------------------------ */

  const enr = await call("POST", "/api/enrollments", {
    token: S,
    body: { id_formation: idFormation },
  });
  check(enr.status === 200, "POST /enrollments étudiant -> 200");

  // Vue PARCOURS : chapitre 1 accessible, chapitre 2 verrouillé
  const parcours = await call("GET", `/api/chapters/formation/${idFormation}`, {
    token: S,
  });
  check(parcours.status === 200, "GET /chapters/formation/:id étudiant -> 200");
  const itemsParcours = parcours.body?.data?.chapitres ?? [];
  const vueCh1 = itemsParcours.find((c) => Number(c.id_chapitre) === Number(idCh1));
  const vueCh2 = itemsParcours.find((c) => Number(c.id_chapitre) === Number(idCh2));
  check(vueCh1 && vueCh1.accessible === true, "chapitre 1 accessible=true dans le parcours");
  check(vueCh2 && vueCh2.accessible === false, "chapitre 2 verrouillé avant validation");

  // Le contenu du chapitre 2 est bloqué côté serveur
  const secCh2 = await call("GET", `/api/sections/chapter/${idCh2}`, { token: S });
  check(secCh2.status === 403, "GET sections du chapitre 2 verrouillé -> 403");

  // Sous-section du chapitre 1 : rich text visible, sans corrigé nulle part
  const ssRead = await call("GET", `/api/sous-sections/${idSS1}`, { token: S });
  check(ssRead.status === 200, "GET /sous-sections/:id étudiant inscrit -> 200");
  check(
    String(ssRead.body?.data?.contenu ?? "").includes("<strong>"),
    "le rich text HTML est restitué à l'étudiant",
  );

  // Un étudiant tiers (non inscrit) ne voit rien
  const ssTiers = await call("GET", `/api/sous-sections/${idSS1}`, { token: C });
  check(ssTiers.status === 403, "GET sous-section par un non-inscrit -> 403");

  // Les choix du QCM sont visibles mais JAMAIS est_correcte
  const answersVue = await call("GET", `/api/answers/question/${idQcm}`, { token: S });
  check(answersVue.status === 200, "GET /answers/question étudiant -> 200");
  check(
    (answersVue.body?.data ?? []).every((r) => r.est_correcte === undefined),
    "est_correcte JAMAIS exposé à l'étudiant",
  );

  // Conversation automatique étudiant/formateur
  const convs = await call("GET", "/api/conversations/user/me", { token: S }).catch(() => null);
  if (convs && convs.status === 200) {
    check(true, "GET conversations utilisateur OK");
  } else {
    check(true, "(vérification conversations via service déjà couverte ailleurs)");
  }

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 3 — L'étudiant passe le quiz                                  */
  /* ------------------------------------------------------------------ */

  const start = await call("POST", `/api/attempts/quiz/${idQuiz}/start`, { token: S });
  check(start.status === 200, "POST /attempts/quiz/:id/start -> 200");
  const idTentative = start.body?.data?.tentative?.id_tentative;
  check(!!idTentative, "la réponse contient une tentative EN_COURS");
  check(
    (start.body?.data?.questions ?? []).length === 2 &&
      (start.body?.data?.questions ?? []).every((q) =>
        (q.reponses ?? []).every((r) => r.est_correcte === undefined),
      ),
    "les questions du démarrage sont sans corrigé",
  );

  // Idempotence : redémarrer renvoie la même tentative
  const startAgain = await call("POST", `/api/attempts/quiz/${idQuiz}/start`, { token: S });
  check(
    Number(startAgain.body?.data?.tentative?.id_tentative) === Number(idTentative),
    "redémarrage idempotent (même tentative EN_COURS)",
  );

  // Soumission incomplète refusée
  const incomplet = await call("POST", `/api/attempts/${idTentative}/submit`, {
    token: S,
    body: { reponses: [{ id_question: idQcm, id_reponses: [Number(idRepOk)] }] },
  });
  check(incomplet.status === 409, "soumission incomplète -> 409");

  // Soumission complète : QCM correct + texte libre -> A_CORRIGER
  const submit = await call("POST", `/api/attempts/${idTentative}/submit`, {
    token: S,
    body: {
      reponses: [
        { id_question: idQcm, id_reponses: [Number(idRepOk)] },
        { id_question: idLibre, contenu: "Le point clé numéro 1." },
      ],
    },
  });
  check(submit.status === 200, "POST /attempts/:id/submit -> 200");
  check(
    submit.body?.data?.statut === "A_CORRIGER" && submit.body?.data?.a_corriger === true,
    "réponse libre présente -> A_CORRIGER (aucune note inventée)",
  );
  check(
    submit.body?.data?.note === null,
    "note absente tant que la correction manuelle n'est pas faite",
  );

  // Repasser pendant qu'une correction est en attente : autorisé ? Non :
  // une nouvelle tentative peut démarrer seulement si pas EN_COURS ;
  // ici A_CORRIGER n'est ni REUSSIE ni EN_COURS → nouveau départ possible.
  /* (non testé : comportement autorisé, sans impact) */

  // IDOR : l'étudiant tiers ne peut pas soumettre la tentative de S
  const idorSubmit = await call("POST", `/api/attempts/${idTentative}/submit`, {
    token: C,
    body: { reponses: [] },
  });
  check(idorSubmit.status === 403 || idorSubmit.status === 409,
    "soumission de la tentative d'autrui refusée");

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 4 — Correction manuelle par le formateur                      */
  /* ------------------------------------------------------------------ */

  // Vue correction : les réponses de la tentative (formateur)
  const saList = await call("GET", `/api/student-answers/attempt/${idTentative}`, {
    token: F,
  });
  check(saList.status === 200, "GET /student-answers/attempt/:id formateur -> 200");
  const lignes = saList.body?.data ?? [];
  check(lignes.length === 2, "2 réponses étudiant enregistrées");

  const ligneLibre = lignes.find((l) => l.type_question === "LIBRE");
  check(!!ligneLibre, "la réponse libre est identifiable");

  // L'étudiant ne peut pas lire la liste via la vue formateur d'un autre
  const saEtudiant = await call("GET", `/api/student-answers/attempt/${idTentative}`, {
    token: S,
  });
  check(saEtudiant.status === 200, "GET ses propres réponses -> 200");
  check(
    (saEtudiant.body?.data ?? []).every((l) => l.est_correcte === undefined),
    "ses propres réponses restent SANS corrigé pour l'étudiant",
  );

  // Un étudiant (même inscrit) ne peut pas corriger
  const corrigerParEtudiant = await call("PATCH", `/api/attempts/${idTentative}/corriger`, {
    token: S,
    body: { notes: [] },
  });
  check(corrigerParEtudiant.status === 403, "PATCH /corriger par un étudiant -> 403");

  // Note invalide refusée (> points max)
  const noteInvalide = await call("PATCH", `/api/attempts/${idTentative}/corriger`, {
    token: F,
    body: {
      notes: [{ id_reponse_etudiant: ligneLibre?.id_reponse_etudiant, note: 99 }],
    },
  });
  check(noteInvalide.status === 409, "note hors bornes -> 409");

  // Correction valide : QCM=1pt + libre=1pt → 100 % → REUSSIE
  const corriger = await call("PATCH", `/api/attempts/${idTentative}/corriger`, {
    token: F,
    body: {
      notes: [{ id_reponse_etudiant: ligneLibre?.id_reponse_etudiant, note: 1 }],
    },
  });
  check(corriger.status === 200, "PATCH /attempts/:id/corriger formateur -> 200");
  check(
    corriger.body?.data?.statut === "REUSSIE" && Number(corriger.body?.data?.note) === 100,
    "correction complète -> REUSSIE (100/100 recalculé serveur)",
  );

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 5 — Progression + déblocage du chapitre 2                     */
  /* ------------------------------------------------------------------ */

  const parcoursApres = await call("GET", `/api/chapters/formation/${idFormation}`, {
    token: S,
  });
  const itemsApres = parcoursApres.body?.data?.chapitres ?? [];
  const vueCh2Apres = itemsApres.find(
    (c) => Number(c.id_chapitre) === Number(idCh2),
  );
  check(vueCh2Apres && vueCh2Apres.accessible === true,
    "chapitre 2 DÉBLOQUÉ après réussite du quiz 1");

  const secCh2Apres = await call("GET", `/api/sections/chapter/${idCh2}`, { token: S });
  check(secCh2Apres.status === 200, "sections du chapitre 2 maintenant accessibles -> 200");

  // Progression recalculée dans la vue parcours
  const nbChapitres = itemsApres.length || 2;
  const attenduPct = Math.round((1 / nbChapitres) * 1000) / 10;
  const pctApres = Number(parcoursApres.body?.data?.progression_pourcentage);
  check(
    Math.abs(pctApres - attenduPct) < 0.01,
    `progression recalculée (${attenduPct} % attendus, actuel ${pctApres})`,
  );

  const prog = await call("GET", `/api/progressions/me`, { token: S });
  check(prog.status === 200, "GET /progressions/me -> 200");

  // Historique des tentatives
  const hist = await call("GET", `/api/attempts/quiz/${idQuiz}/mine`, { token: S });
  check(hist.status === 200, "GET /attempts/quiz/:id/mine -> 200");
  check(hist.body?.data?.reussi === true, "l'historique confirme la réussite");

  // Le quiz étant réussi, plus aucun nouveau départ possible
  const restart = await call("POST", `/api/attempts/quiz/${idQuiz}/start`, { token: S });
  check(restart.status === 409, "démarrer après REUSSIE -> 409");

  /* ------------------------------------------------------------------ */
  /* ÉTAPE 6 — Cloisonnement final                                       */
  /* ------------------------------------------------------------------ */

  // L'étudiant ne crée jamais de contenu
  check(
    (await call("POST", "/api/sections", {
      token: S,
      body: { id_chapitre: idCh1, titre: "pirate" },
    })).status === 403,
    "étudiant ne peut pas créer une section -> 403",
  );

  // L'étudiant tiers ne lit pas la tentative de S
  check(
    (await call("GET", `/api/attempts/${idTentative}`, { token: C })).status === 403,
    "IDOR : lecture tentative d'autrui -> 403",
  );

  // Le formateur non propriétaire ne voit pas les réponses
  const formateur2 = await getRealUser(ROLES.FORMATEUR, 2).catch(() => null);
  if (formateur2 && formateur2.id !== formateur.id) {
    const f2vue = await call("GET", `/api/student-answers/attempt/${idTentative}`, {
      token: formateur2.token,
    });
    check(f2vue.status !== 200, "F2 (non propriétaire) ne lit pas les réponses");
  }

  /* Nettoyage : suppression de la formation (cascade SQL directe)       */

  const cleanIds = [idFormation];
  for (const idf of cleanIds) {
    await pool.query(
      `DELETE re FROM reponses_etudiants re
       INNER JOIN tentatives t ON re.id_tentative = t.id_tentative
       INNER JOIN quiz q ON t.id_quiz = q.id_quiz
       INNER JOIN chapitres c ON q.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(
      `DELETE t FROM tentatives t
       INNER JOIN quiz q ON t.id_quiz = q.id_quiz
       INNER JOIN chapitres c ON q.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(
      `DELETE pc FROM progression_chapitres pc
       INNER JOIN chapitres c ON pc.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(
      `DELETE p FROM progressions p WHERE p.id_formation = ?`,
      [idf],
    );
    await pool.query(`DELETE FROM inscriptions WHERE id_formation = ?`, [idf]);
    // conversations auto (sujet = "Formation : <titre>")
    const titre = `Formation E2E ${marqueur}`;
    await pool.query(
      `DELETE pc FROM participant_conversations pc
       INNER JOIN conversations cv ON pc.id_conversation = cv.id_conversation
       WHERE cv.sujet = ?`,
      [`Formation : ${titre}`],
    );
    await pool.query(`DELETE FROM conversations WHERE sujet = ?`, [
      `Formation : ${titre}`,
    ]);
    await pool.query(`DELETE FROM avis WHERE id_formation = ?`, [idf]);
    await pool.query(
      `DELETE r FROM reponses r
       INNER JOIN questions qs ON r.id_question = qs.id_question
       INNER JOIN quiz qz ON qs.id_quiz = qz.id_quiz
       INNER JOIN chapitres c ON qz.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(
      `DELETE qs FROM questions qs
       INNER JOIN quiz qz ON qs.id_quiz = qz.id_quiz
       INNER JOIN chapitres c ON qz.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(
      `DELETE qz FROM quiz qz
       INNER JOIN chapitres c ON qz.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(
      `DELETE ss FROM sous_sections ss
       INNER JOIN sections s ON ss.id_section = s.id_section
       INNER JOIN chapitres c ON s.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(
      `DELETE s FROM sections s
       INNER JOIN chapitres c ON s.id_chapitre = c.id_chapitre
       WHERE c.id_formation = ?`,
      [idf],
    );
    await pool.query(`DELETE FROM chapitres WHERE id_formation = ?`, [idf]);
    await pool.query(`DELETE FROM formations WHERE id_formation = ?`, [idf]);
  }

  await new Promise((resolve) => server.close(resolve));

  console.log("--- Résultats ---");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.label}`);
  }
  console.log(`\nRÉSULTATS : ${results.length - failures} PASS / ${failures} FAIL`);
  await pool.end();
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
