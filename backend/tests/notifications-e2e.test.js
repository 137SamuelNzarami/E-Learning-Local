/**
 * E2E notification trigger tests.
 *
 * Simulates each business event and verifies the notification was created
 * for the correct recipient with the expected title/content.
 */
import jwt from "jsonwebtoken";
import pool from "../src/config/database.js";

const results = [];
let failures = 0;
const suite = "NOTIF-E2E";

function check(condition, label) {
  if (!condition) failures += 1;
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

async function getUser(roleLabel, order = 1) {
  const [rows] = await pool.query(
    `SELECT u.id_utilisateur, r.libelle AS role, u.email, u.prenom, u.nom
     FROM utilisateurs u
     INNER JOIN roles r ON u.id_role = r.id_role
     WHERE r.libelle = ?
     ORDER BY u.id_utilisateur
     LIMIT ?, 1`,
    [roleLabel, order - 1],
  );
  if (rows.length === 0) throw new Error(`No user for role "${roleLabel}"`);
  const u = rows[0];
  return {
    id: u.id_utilisateur,
    prenom: u.prenom,
    nom: u.nom,
    email: u.email,
    token: jwt.sign(
      { id: u.id_utilisateur, role: u.role, email: u.email },
      process.env.JWT_SECRET,
    ),
  };
}

async function getNotifications(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE id_utilisateur = ? ORDER BY id_notification DESC LIMIT 10`,
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

function req(method, path, token, body) {
  return fetch(`http://localhost:3010/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());
}

function reqForm(method, path, token, fields) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  return fetch(`http://localhost:3010/api${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  }).then((r) => r.json());
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findNotification(notifs, titreContains) {
  return notifs.find((n) => n.titre.includes(titreContains));
}

async function cleanup(...ids) {
  for (const id of ids) {
    if (id != null) {
      await pool.query("DELETE FROM notifications WHERE id_notification = ?", [id]);
    }
  }
}

async function run() {
  const formateur1 = await getUser("Formateur", 1);
  const etudiant1 = await getUser("Etudiant", 1);
  const etudiant2 = await getUser("Etudiant", 2);

  console.log(`Formateur1: ${formateur1.prenom} ${formateur1.nom} (id=${formateur1.id})`);
  console.log(`Etudiant1: ${etudiant1.prenom} ${etudiant1.nom} (id=${etudiant1.id})`);
  console.log(`Etudiant2: ${etudiant2.prenom} ${etudiant2.nom} (id=${etudiant2.id})`);

  const createdNotifIds = [];

  // ─── TRIGGER 1: Enrollment → formateur notification ────────────
  console.log("\n--- TRIGGER 1: Enrollment → formateur notification ---");

  const beforeUnread = await getUnreadCount(formateur1.id);

  // Find a formation owned by formateur1 and a formation etudiant1 is NOT yet enrolled in
  const [formations] = await pool.query(
    `SELECT f.id_formation, f.titre
     FROM formations f
     WHERE f.id_formateur = ?
     ORDER BY f.id_formation DESC LIMIT 5`,
    [formateur1.id],
  );

  let testFormation = null;
  for (const f of formations) {
    const [enrollCheck] = await pool.query(
      `SELECT id_inscription FROM inscriptions WHERE id_utilisateur = ? AND id_formation = ?`,
      [etudiant1.id, f.id_formation],
    );
    if (enrollCheck.length === 0) {
      testFormation = f;
      break;
    }
  }

  if (!testFormation) {
    console.log("  No unenrolled formation found, creating one...");
    const titre = `Test Notif Formation ${Date.now()}`;
    const res = await req("POST", "/formations", formateur1.token, {
      titre,
      description: "Test notification",
      id_categorie: 1,
    });
    if (res.success) {
      testFormation = { id_formation: res.data.id, titre };
    }
  }

  if (testFormation) {
    const enrollRes = await req("POST", "/enrollments", etudiant1.token, {
      id_utilisateur: etudiant1.id,
      id_formation: testFormation.id_formation,
    });

    check(enrollRes.success, "Enrollment created successfully");

    const afterNotifs = await getNotifications(formateur1.id);
    const notif = findNotification(afterNotifs, "inscrit");
    check(notif != null, `Formateur received "Nouvel étudiant inscrit" notification`);
    if (notif) {
      createdNotifIds.push(notif.id_notification);
      check(
        notif.contenu.includes(etudiant1.prenom) && notif.contenu.includes(testFormation.titre),
        `Notification contains student name and formation title`,
      );
    }

    const afterUnread = await getUnreadCount(formateur1.id);
    check(afterUnread > beforeUnread, "Formateur unread count increased");
  }

  // ─── TRIGGER 2: Message → other participants notified ──────────
  console.log("\n--- TRIGGER 2: Message → other participants notified ---");

  // Find a conversation with formateur1 and etudiant1
  const [convs] = await pool.query(
    `SELECT c.id_conversation, c.sujet
     FROM conversations c
     INNER JOIN participant_conversations pc1 ON pc1.id_conversation = c.id_conversation AND pc1.id_utilisateur = ?
     INNER JOIN participant_conversations pc2 ON pc2.id_conversation = c.id_conversation AND pc2.id_utilisateur = ?
     LIMIT 1`,
    [formateur1.id, etudiant1.id],
  );

  if (convs.length > 0) {
    const conv = convs[0];
    const beforeCount = await getUnreadCount(etudiant1.id);

    const msgRes = await req("POST", "/messages", formateur1.token, {
      id_conversation: conv.id_conversation,
      id_expediteur: formateur1.id,
      contenu: `Test notification message ${Date.now()}`,
    });

    check(msgRes.success, "Message sent successfully");

    await sleep(500);

    const afterMsgNotifs = await getNotifications(etudiant1.id);
    const msgNotif = findNotification(afterMsgNotifs, "Nouveau message");
    check(msgNotif != null, "Student received 'Nouveau message' notification from formateur");
    if (msgNotif) {
      createdNotifIds.push(msgNotif.id_notification);
      check(
        msgNotif.contenu.includes(conv.sujet || "conversation"),
        "Notification contains conversation subject",
      );
    }

    const afterCount = await getUnreadCount(etudiant1.id);
    check(afterCount > beforeCount, "Student unread count increased after message");
  } else {
    console.log("  No shared conversation found, skipping message test");
    check(false, "No shared conversation to test message notification");
  }

  // ─── TRIGGER 3: Submission → formateur notification ────────────
  console.log("\n--- TRIGGER 3: Submission → formateur notification ---");

  const [assignments] = await pool.query(
    `SELECT d.id_devoir, d.titre, f.id_formation
     FROM devoirs d
     INNER JOIN lecons l ON d.id_lecon = l.id_lecon
     INNER JOIN chapitres c ON l.id_chapitre = c.id_chapitre
     INNER JOIN modules m ON c.id_module = m.id_module
     INNER JOIN formations f ON m.id_formation = f.id_formation
     WHERE f.id_formateur = ?
     ORDER BY d.id_devoir DESC LIMIT 20`,
    [formateur1.id],
  );

  let testAssignment = null;
  for (const a of assignments) {
    const [subCheck] = await pool.query(
      `SELECT id_soumission FROM soumissions WHERE id_utilisateur = ? AND id_devoir = ?`,
      [etudiant1.id, a.id_devoir],
    );
    if (subCheck.length === 0) {
      const [enrollCheck] = await pool.query(
        `SELECT id_inscription FROM inscriptions WHERE id_utilisateur = ? AND id_formation = ?`,
        [etudiant1.id, a.id_formation],
      );
      if (enrollCheck.length > 0) {
        testAssignment = a;
        break;
      }
    }
  }

  if (testAssignment) {
    const beforeSubCount = await getUnreadCount(formateur1.id);

    const subRes = await reqForm("POST", "/submissions", etudiant1.token, {
      id_devoir: testAssignment.id_devoir,
      fichier: new Blob(["test"], { type: "text/plain" }),
    });

    check(subRes.success, "Submission created successfully");

    const afterSubNotifs = await getNotifications(formateur1.id);
    const subNotif = findNotification(afterSubNotifs, "Devoir soumis");
    check(subNotif != null, "Formateur received 'Devoir soumis' notification");
    if (subNotif) {
      createdNotifIds.push(subNotif.id_notification);
      check(
        subNotif.contenu.includes(etudiant1.prenom) && subNotif.contenu.includes(testAssignment.titre),
        "Submission notification contains student name and assignment title",
      );
    }
  } else {
    console.log("  No suitable assignment found for submission test");
    check(false, "No assignment available for submission notification test");
  }

  // ─── TRIGGER 4: Grading → student notification ─────────────────
  console.log("\n--- TRIGGER 4: Grading → student notification ---");

  // Find a graded submission or use the one we just created
  const [subs] = await pool.query(
    `SELECT s.id_soumission, s.id_devoir, s.id_utilisateur, d.titre AS devoir_titre, f.id_formation
     FROM soumissions s
     INNER JOIN devoirs d ON s.id_devoir = d.id_devoir
     INNER JOIN lecons l ON d.id_lecon = l.id_lecon
     INNER JOIN chapitres c ON l.id_chapitre = c.id_chapitre
     INNER JOIN modules m ON c.id_module = m.id_module
     INNER JOIN formations f ON m.id_formation = f.id_formation
     WHERE f.id_formateur = ?
     ORDER BY s.id_soumission DESC LIMIT 5`,
    [formateur1.id],
  );

  const gradeableSub = subs.find((s) => s.id_utilisateur !== formateur1.id);

  if (gradeableSub) {
    const beforeGradeCount = await getUnreadCount(gradeableSub.id_utilisateur);

    const gradeRes = await req("PUT", `/submissions/${gradeableSub.id_soumission}`, formateur1.token, {
      id_devoir: gradeableSub.id_devoir,
      id_utilisateur: gradeableSub.id_utilisateur,
      note: 85,
    });

    check(gradeRes.success, "Submission graded successfully");

    const afterGradeNotifs = await getNotifications(gradeableSub.id_utilisateur);
    const gradeNotif = findNotification(afterGradeNotifs, "Devoir noté");
    check(gradeNotif != null, "Student received 'Devoir noté' notification");
    if (gradeNotif) {
      createdNotifIds.push(gradeNotif.id_notification);
      check(
        gradeNotif.contenu.includes("85") && gradeNotif.contenu.includes(gradeableSub.devoir_titre),
        "Grading notification contains score and assignment title",
      );
    }

    const afterGradeCount = await getUnreadCount(gradeableSub.id_utilisateur);
    check(afterGradeCount > beforeGradeCount, "Student unread count increased after grading");
  } else {
    console.log("  No gradable submission found");
    check(false, "No submission available for grading notification test");
  }

  // ─── TRIGGER 5: Review → formateur notification ────────────────
  console.log("\n--- TRIGGER 5: Review → formateur notification ---");

  // Find a formation where etudiant1 is enrolled and hasn't left a review
  const [reviewFormations] = await pool.query(
    `SELECT f.id_formation, f.titre, f.id_formateur
     FROM inscriptions i
     INNER JOIN formations f ON i.id_formation = f.id_formation
     WHERE i.id_utilisateur = ?
     ORDER BY i.id_inscription DESC LIMIT 10`,
    [etudiant1.id],
  );

  let testReviewFormation = null;
  for (const f of reviewFormations) {
    const [revCheck] = await pool.query(
      `SELECT id_avis FROM avis WHERE id_utilisateur = ? AND id_formation = ?`,
      [etudiant1.id, f.id_formation],
    );
    if (revCheck.length === 0) {
      testReviewFormation = f;
      break;
    }
  }

  if (testReviewFormation) {
    const beforeRevCount = await getUnreadCount(testReviewFormation.id_formateur);

    const revRes = await req("POST", "/reviews", etudiant1.token, {
      id_utilisateur: etudiant1.id,
      id_formation: testReviewFormation.id_formation,
      note: 4,
      commentaire: "Très bonne formation !",
    });

    check(revRes.success, "Review created successfully");

    const afterRevNotifs = await getNotifications(testReviewFormation.id_formateur);
    const revNotif = findNotification(afterRevNotifs, "Nouvel avis");
    check(revNotif != null, "Formateur received 'Nouvel avis' notification");
    if (revNotif) {
      createdNotifIds.push(revNotif.id_notification);
      check(
        revNotif.contenu.includes(etudiant1.prenom) && revNotif.contenu.includes(testReviewFormation.titre),
        "Review notification contains student name and formation title",
      );
    }

    const afterRevCount = await getUnreadCount(testReviewFormation.id_formateur);
    check(afterRevCount > beforeRevCount, "Formateur unread count increased after review");
  } else {
    console.log("  No eligible formation for review test");
    check(false, "No formation available for review notification test");
  }

  // ─── COUNTER TEST: Mark as read ────────────────────────────────
  console.log("\n--- COUNTER TEST: Mark as read ---");

  const unreadBeforeMark = await getUnreadCount(formateur1.id);
  // Mark the first unread notification as read
  const firstUnread = (await getNotifications(formateur1.id)).find((n) => !n.lu);
  if (firstUnread) {
    await req("PATCH", `/notifications/${firstUnread.id_notification}/lu`, formateur1.token);
    const unreadAfterMark = await getUnreadCount(formateur1.id);
    check(unreadAfterMark < unreadBeforeMark, "Unread count decreased after marking as read");
  } else {
    check(true, "No unread notifications to mark (acceptable)");
  }

  // Cleanup
  await cleanup(...createdNotifIds);

  // ─── RESULTS ───────────────────────────────────────────────────
  console.log("\n==============================");
  let pass = 0;
  let fail = 0;
  for (const r of results) {
    const icon = r.ok ? "PASS" : "FAIL";
    console.log(`${icon}  ${r.label}`);
    if (r.ok) pass++; else fail++;
  }
  console.log(`\nRÉSULTATS : ${pass} PASS / ${fail} FAIL`);
  return fail === 0 ? 0 : 1;
}

run()
  .then((code) => {
    pool.end();
    process.exit(code);
  })
  .catch((err) => {
    console.error("Fatal:", err);
    pool.end();
    process.exit(1);
  });
