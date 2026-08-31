/**
 * Harnais E2E « Déclencheurs de notifications ».
 *
 * Exécution : node tests/notifications-e2e.test.js
 *
 * Simule chaque événement métier de la nouvelle architecture et vérifie
 * que la bonne notification est créée pour le bon destinataire :
 *
 *  1. Inscription étudiant        -> « Nouvel étudiant inscrit » (formateur)
 *  2. Message en conversation     -> « Nouveau message » (participants)
 *  3. Quiz soumis (QCM)           -> « Quiz réussi / échoué » (étudiant)
 *  4. Avis sur une formation      -> « Nouvel avis » (formateur)
 *
 * Nécessite la base MySQL configurée (.env) avec au moins un formateur
 * et un étudiant réels distincts.
 */
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import pool from "../src/config/database.js";
import ROLES from "../src/constants/role.js";

const results = [];
let failures = 0;
const suite = "NOTIF-E2E";

function check(condition, label) {
  if (!condition) failures += 1;
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

async function getRealUser(roleLabel, order = 1) {
  const [rows] = await pool.query(
    `SELECT u.id_utilisateur, r.libelle AS role, u.email, u.prenom, u.nom
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
    prenom: u.prenom,
    nom: u.nom,
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
  const formateur = await getRealUser(ROLES.FORMATEUR, 1);
  const etudiant = await getRealUser(ROLES.ETUDIANT, 1);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, options = {}) => {
    const res = await fetch(`${base}${path}`, jsonRequest(method, path, options));
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

  // Borne haute des ids de notifications avant les déclencheurs :
  // sert au nettoyage ciblé des notifications créées par ce harnais.
  const [[{ maxNotifAvant }]] = await pool.query(
    `SELECT COALESCE(MAX(id_notification), 0) AS maxNotifAvant FROM notifications`,
  );

  async function getNotifications(userId) {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE id_utilisateur = ? ORDER BY id_notification DESC`,
      [userId],
    );
    return rows;
  }

  async function getUnreadCount(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM notifications WHERE id_utilisateur = ? AND lu = 0`,
      [userId],
    );
    return Number(rows[0]?.total || 0);
  }

  /* ------------------------------------------------------------------ */
  /* TRIGGER 1 — Inscription -> « Nouvel étudiant inscrit »              */
  /* ------------------------------------------------------------------ */

  console.log("\n--- TRIGGER 1 : inscription -> notif formateur ---");

  const cats = await call("GET", "/api/categories", { token: F });
  const idCategorie = cats.body?.data?.[0]?.id_categorie;

  const formation = await call("POST", "/api/formations", {
    token: F,
    body: {
      id_categorie: idCategorie,
      titre: `Formation Notif ${marqueur}`,
      description: "Formation dédiée aux tests de notifications.",
    },
  });
  check(formation.status === 200, "POST /formations -> 200");
  const idFormation = formation.body?.data?.id;

  const publish = await call("PATCH", `/api/formations/${idFormation}/publish`, {
    token: F,
  });
  check(publish.status === 200, "PATCH /formations/:id/publish -> 200");

  const unreadAvant1 = await getUnreadCount(formateur.id);

  const enr = await call("POST", "/api/enrollments", {
    token: S,
    body: { id_formation: idFormation },
  });
  check(enr.status === 200, "POST /enrollments étudiant -> 200");

  const notifsApres1 = await getNotifications(formateur.id);
  const notif1 = notifsApres1.find((n) =>
    String(n.titre).includes("Nouvel étudiant inscrit"),
  );
  check(notif1 != null, `formateur reçoit « Nouvel étudiant inscrit »`);
  if (notif1) {
    check(
      String(notif1.contenu).includes(etudiant.prenom) &&
        String(notif1.contenu).includes(`Formation Notif ${marqueur}`),
      "la notification contient le prénom étudiant et le titre formation",
    );
  }

  const unreadApres1 = await getUnreadCount(formateur.id);
  check(unreadApres1 > unreadAvant1, "compteur non-lus du formateur augmenté");

  /* ------------------------------------------------------------------ */
  /* TRIGGER 2 — Message -> « Nouveau message »                          */
  /* ------------------------------------------------------------------ */

  console.log("\n--- TRIGGER 2 : message -> notif participants ---");

  // La conversation automatique formateur/étudiant créée à l'inscription
  const [convs] = await pool.query(
    `SELECT cv.id_conversation, cv.sujet
     FROM conversations cv
     INNER JOIN participant_conversations pc1
       ON pc1.id_conversation = cv.id_conversation AND pc1.id_utilisateur = ?
     INNER JOIN participant_conversations pc2
       ON pc2.id_conversation = cv.id_conversation AND pc2.id_utilisateur = ?
     WHERE cv.sujet = ?
     LIMIT 1`,
    [formateur.id, etudiant.id, `Formation : Formation Notif ${marqueur}`],
  );

  if (convs.length > 0) {
    const conv = convs[0];
    const unreadEAvant2 = await getUnreadCount(etudiant.id);

    const msg = await call("POST", "/api/messages", {
      token: F,
      body: {
        id_conversation: conv.id_conversation,
        id_expediteur: formateur.id,
        contenu: `Bonjour, bienvenue dans la formation ! (${marqueur})`,
      },
    });
    check(msg.status === 200, "POST /messages formateur -> 200");

    const notifsApres2 = await getNotifications(etudiant.id);
    const notif2 = notifsApres2.find((n) =>
      String(n.titre).includes("Nouveau message"),
    );
    check(notif2 != null, `étudiant reçoit « Nouveau message »`);
    if (notif2) {
      check(
        String(notif2.contenu).includes(conv.sujet || "conversation"),
        "la notification contient le sujet de la conversation",
      );
    }

    const unreadEApres2 = await getUnreadCount(etudiant.id);
    check(unreadEApres2 > unreadEAvant2, "compteur non-lus de l'étudiant augmenté");
  } else {
    console.log("  conversation automatique introuvable, test message sauté");
    check(false, "conversation automatique disponible pour le test message");
  }

  /* ------------------------------------------------------------------ */
  /* TRIGGER 3 — Quiz soumis (QCM) -> « Quiz réussi/échoué » étudiant    */
  /* ------------------------------------------------------------------ */

  console.log("\n--- TRIGGER 3 : quiz soumis -> notif étudiant ---");

  const ch = await call("POST", "/api/chapters", {
    token: F,
    body: {
      id_formation: idFormation,
      titre: `Chapitre Notif ${marqueur}`,
      description: "Chapitre du quiz notification.",
    },
  });
  check(ch.status === 200, "POST /chapters -> 200");
  const idChapitre = ch.body?.data?.id;

  const quiz = await call("POST", "/api/quizzes", {
    token: F,
    body: {
      id_chapitre: idChapitre,
      titre: `Quiz Notif ${marqueur}`,
      score_reussite: 50,
    },
  });
  check(quiz.status === 200, "POST /quizzes -> 200");
  const idQuiz = quiz.body?.data?.id;

  const qcm = await call("POST", "/api/questions", {
    token: F,
    body: { id_quiz: idQuiz, enonce: "2 + 2 =", type: "QCM", points: 1 },
  });
  check(qcm.status === 200, "POST /questions (QCM) -> 200");
  const idQcm = qcm.body?.data?.id;

  const rOk = await call("POST", "/api/answers", {
    token: F,
    body: { id_question: idQcm, texte: "4", est_correcte: true },
  });
  check(rOk.status === 200, "POST /answers (correcte) -> 200");
  const idRepOk = rOk.body?.data?.id;

  const start = await call("POST", `/api/attempts/quiz/${idQuiz}/start`, {
    token: S,
  });
  check(start.status === 200, "POST /attempts/quiz/:id/start -> 200");
  const idTentative = start.body?.data?.tentative?.id_tentative;
  check(!!idTentative, "tentative EN_COURS créée pour l'étudiant");

  const unreadEAvant3 = await getUnreadCount(etudiant.id);
  const unreadFAvant3 = await getUnreadCount(formateur.id);

  const submit = await call("POST", `/api/attempts/${idTentative}/submit`, {
    token: S,
    body: {
      reponses: [{ id_question: idQcm, id_reponses: [idRepOk] }],
    },
  });
  check(submit.status === 200, "POST /attempts/:id/submit -> 200");
  check(
    submit.body?.data?.statut === "REUSSIE" && Number(submit.body?.data?.note) === 100,
    "correction automatique QCM -> REUSSIE (100)",
  );

  const notifsApres3 = await getNotifications(etudiant.id);
  const notif3 = notifsApres3.find((n) =>
    String(n.titre).includes("Quiz réussi"),
  );
  check(notif3 != null, `étudiant reçoit « Quiz réussi » (correction auto)`);
  if (notif3) {
    check(
      String(notif3.contenu).includes("100") &&
        String(notif3.contenu).includes(`Quiz Notif ${marqueur}`),
      "la notification contient la note et le titre du quiz",
    );
  }

  const unreadEApres3 = await getUnreadCount(etudiant.id);
  check(unreadEApres3 > unreadEAvant3, "compteur non-lus de l'étudiant augmenté");
  const unreadFApres3 = await getUnreadCount(formateur.id);
  check(
    unreadFApres3 === unreadFAvant3,
    "aucune notification de correction pour le formateur (100 % auto)",
  );

  /* ------------------------------------------------------------------ */
  /* TRIGGER 4 — Avis -> « Nouvel avis »                                 */
  /* ------------------------------------------------------------------ */

  console.log("\n--- TRIGGER 4 : avis -> notif formateur ---");

  const unreadFAvant4 = await getUnreadCount(formateur.id);

  const avis = await call("POST", "/api/reviews", {
    token: S,
    body: {
      id_utilisateur: etudiant.id,
      id_formation: idFormation,
      note: 5,
      commentaire: "Excellente formation de test !",
    },
  });
  check(avis.status === 200, "POST /reviews étudiant inscrit -> 200");

  const notifsApres4 = await getNotifications(formateur.id);
  const notif4 = notifsApres4.find((n) =>
    String(n.titre).includes("Nouvel avis"),
  );
  check(notif4 != null, `formateur reçoit « Nouvel avis »`);
  if (notif4) {
    check(
      String(notif4.contenu).includes(etudiant.prenom) &&
        String(notif4.contenu).includes(`Formation Notif ${marqueur}`),
      "la notification contient le prénom étudiant et le titre formation",
    );
  }

  const unreadFApres4 = await getUnreadCount(formateur.id);
  check(unreadFApres4 > unreadFAvant4, "compteur non-lus du formateur augmenté");

  /* ------------------------------------------------------------------ */
  /* CONTRE-TEST — Marquer comme lu                                      */
  /* ------------------------------------------------------------------ */

  console.log("\n--- CONTRE-TEST : marquer comme lu ---");

  const premiereNonLue = (await getNotifications(formateur.id)).find((n) => !n.lu);
  if (premiereNonLue) {
    const luRes = await call(
      "PATCH",
      `/api/notifications/${premiereNonLue.id_notification}/lu`,
      { token: F },
    );
    check(luRes.status === 200, "PATCH /notifications/:id/lu -> 200");
    check(
      (await getUnreadCount(formateur.id)) < unreadFApres4,
      "compteur non-lus diminué après marquage",
    );
  } else {
    check(true, "(aucune notification non lue à marquer)");
  }

  /* ------------------------------------------------------------------ */
  /* NETTOYAGE                                                           */
  /* ------------------------------------------------------------------ */

  await pool.query(
    `DELETE FROM notifications WHERE id_notification > ?`,
    [maxNotifAvant],
  );

  try {
    const [rows] = await pool.query(
      `SELECT id_formation FROM formations WHERE id_formation = ?`,
      [idFormation],
    );
    const idf = rows[0]?.id_formation;
    if (idf) {
      await pool.query(
        `DELETE re FROM reponses_etudiants re
         INNER JOIN tentatives t ON re.id_tentative = t.id_tentative
         INNER JOIN quiz qz ON t.id_quiz = qz.id_quiz
         INNER JOIN chapitres c ON qz.id_chapitre = c.id_chapitre
         WHERE c.id_formation = ?`,
        [idf],
      );
      await pool.query(
        `DELETE t FROM tentatives t
         INNER JOIN quiz qz ON t.id_quiz = qz.id_quiz
         INNER JOIN chapitres c ON qz.id_chapitre = c.id_chapitre
         WHERE c.id_formation = ?`,
        [idf],
      );
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
      await pool.query(`DELETE FROM progressions WHERE id_formation = ?`, [idf]);
      await pool.query(
        `DELETE pc FROM participant_conversations pc
         INNER JOIN conversations cv ON pc.id_conversation = cv.id_conversation
         WHERE cv.sujet = ?`,
        [`Formation : Formation Notif ${marqueur}`],
      );
      await pool.query(`DELETE FROM conversations WHERE sujet = ?`, [
        `Formation : Formation Notif ${marqueur}`,
      ]);
      await pool.query(`DELETE FROM avis WHERE id_formation = ?`, [idf]);
      await pool.query(`DELETE FROM inscriptions WHERE id_formation = ?`, [idf]);
      await pool.query(`DELETE FROM chapitres WHERE id_formation = ?`, [idf]);
      await pool.query(`DELETE FROM formations WHERE id_formation = ?`, [idf]);
    }
  } catch (e) {
    console.warn("nettoyage partiel :", e.message);
  }

  server.close();

  /* ------------------------------------------------------------------ */
  /* RÉSULTATS                                                           */
  /* ------------------------------------------------------------------ */

  console.log("\n==============================");
  let pass = 0;
  for (const r of results) {
    const icon = r.ok ? "PASS" : "FAIL";
    console.log(`${icon}  ${r.label}`);
    if (r.ok) pass++;
  }
  console.log(`\nRÉSULTATS : ${pass} PASS / ${failures} FAIL`);
  return failures === 0 ? 0 : 1;
}

main()
  .then((code) => {
    pool.end();
    process.exit(code);
  })
  .catch((err) => {
    console.error("ERREUR FATALE :", err.message);
    pool.end();
    process.exit(1);
  });
