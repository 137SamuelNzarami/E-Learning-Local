import mysql from "mysql2/promise";

const TARGET = "(3, 8, 9, 10, 11, 12)";
const STUDENTS_NO7 = "(8, 9, 10, 11, 12)";
const GRACE_ID = 3;
const GRACE_FORMATIONS = "(3, 6)";
const GRACE_MODULES = "(5, 6, 10)";
const GRACE_CHAPITRES = "(6, 7, 11)";
const GRACE_LECONS = "(6, 7, 11)";
const GRACE_QUIZ = "(6, 7, 11)";

const c = await mysql.createConnection({ host: "localhost", user: "root", password: "", database: "elearningdb" });
c.config.timezone = "+00:00";

const q = async (sql, label) => {
  const [r] = await c.query(sql);
  if (r.affectedRows > 0) console.log(`  ✓ ${label}: ${r.affectedRows} ligne(s) supprimée(s)`);
  else console.log(`  · ${label}: 0 ligne`);
  return r.affectedRows;
};

const h = (t) => console.log("\n" + "=".repeat(60) + "\n" + t + "\n" + "=".repeat(60));
let totalDeleted = 0;

try {
  await c.beginTransaction();
  console.log("TRANSACTION DÉMARRÉE\n");

  // ─── PHASE 1 — Activité des étudiants cibles (8,9,10,11,12) ───
  h("PHASE 1 — Activité des étudiants cibles");

  totalDeleted += await q(
    `DELETE re FROM reponses_etudiants re INNER JOIN tentatives t ON re.id_tentative = t.id_tentative WHERE t.id_utilisateur IN ${STUDENTS_NO7}`,
    "reponses_etudiants (via tentatives étudiants)"
  );

  totalDeleted += await q(
    `DELETE FROM tentatives WHERE id_utilisateur IN ${STUDENTS_NO7}`,
    "tentatives étudiants"
  );

  totalDeleted += await q(
    `DELETE FROM soumissions WHERE id_utilisateur IN ${STUDENTS_NO7}`,
    "soumissions étudiants"
  );

  totalDeleted += await q(
    `DELETE FROM progression_lecons WHERE id_utilisateur IN ${STUDENTS_NO7}`,
    "progression_lecons étudiants"
  );

  totalDeleted += await q(
    `DELETE FROM notifications WHERE id_utilisateur IN ${STUDENTS_NO7}`,
    "notifications étudiants"
  );

  // ─── PHASE 2 — Activité de Grace (id=3) ───
  h("PHASE 2 — Activité de Grace");

  totalDeleted += await q(
    `DELETE FROM notifications WHERE id_utilisateur = ${GRACE_ID}`,
    "notifications Grace"
  );

  // ─── PHASE 3 — Cascade formations de Grace (enfants avant parents) ───
  h("PHASE 3 — Cascade formations de Grace");

  // 3a. reponses → questions → quiz (chain FK la plus profonde)
  totalDeleted += await q(
    `DELETE r FROM reponses r INNER JOIN questions q ON r.id_question = q.id_question INNER JOIN quiz qz ON q.id_quiz = qz.id_quiz WHERE qz.id_lecon IN ${GRACE_LECONS}`,
    "reponses (quiz de Grace)"
  );

  totalDeleted += await q(
    `DELETE q FROM questions q INNER JOIN quiz qz ON q.id_quiz = qz.id_quiz WHERE qz.id_lecon IN ${GRACE_LECONS}`,
    "questions (quiz de Grace)"
  );

  totalDeleted += await q(
    `DELETE FROM quiz WHERE id_lecon IN ${GRACE_LECONS}`,
    "quiz (leçons de Grace)"
  );

  // 3b. contenus des leçons
  totalDeleted += await q(
    `DELETE FROM videos WHERE id_lecon IN ${GRACE_LECONS}`,
    "videos (leçons de Grace)"
  );

  totalDeleted += await q(
    `DELETE FROM documents WHERE id_lecon IN ${GRACE_LECONS}`,
    "documents (leçons de Grace)"
  );

  totalDeleted += await q(
    `DELETE FROM devoirs WHERE id_lecon IN ${GRACE_LECONS}`,
    "devoirs (leçons de Grace)"
  );

  // 3c. leçons → chapitres → modules → formations
  totalDeleted += await q(
    `DELETE FROM lecons WHERE id_chapitre IN ${GRACE_CHAPITRES}`,
    "leçons (chapitres de Grace)"
  );

  totalDeleted += await q(
    `DELETE FROM chapitres WHERE id_module IN ${GRACE_MODULES}`,
    "chapitres (modules de Grace)"
  );

  totalDeleted += await q(
    `DELETE FROM modules WHERE id_formation IN ${GRACE_FORMATIONS}`,
    "modules (formations de Grace)"
  );

  // ─── PHASE 4 — Références aux formations de Grace (AVANT suppression formations) ───
  h("PHASE 4 — Références aux formations de Grace");

  totalDeleted += await q(
    `DELETE FROM avis WHERE id_formation IN ${GRACE_FORMATIONS}`,
    "avis sur formations de Grace"
  );

  totalDeleted += await q(
    `DELETE FROM inscriptions WHERE id_formation IN ${GRACE_FORMATIONS}`,
    "inscriptions aux formations de Grace"
  );

  totalDeleted += await q(
    `DELETE FROM progressions WHERE id_formation IN ${GRACE_FORMATIONS}`,
    "progressions formations de Grace"
  );

  totalDeleted += await q(
    `DELETE FROM progression_lecons WHERE id_lecon IN ${GRACE_LECONS}`,
    "progression_lecons leçons de Grace"
  );

  // 3d. Supprimer les formations
  totalDeleted += await q(
    `DELETE FROM formations WHERE id_formation IN ${GRACE_FORMATIONS}`,
    "formations de Grace"
  );

  // ─── PHASE 5 — Conversations ───
  h("PHASE 5 — Conversations");

  totalDeleted += await q(
    `DELETE FROM messages WHERE id_expediteur IN ${TARGET}`,
    "messages envoyés par cibles"
  );

  totalDeleted += await q(
    `DELETE FROM participant_conversations WHERE id_utilisateur IN ${TARGET}`,
    "participants ciblés dans conversations"
  );

  // Supprimer les conversations orphelines (sans aucun participant)
  totalDeleted += await q(
    `DELETE c FROM conversations c LEFT JOIN participant_conversations pc ON c.id_conversation = pc.id_conversation WHERE pc.id_conversation IS NULL`,
    "conversations orphelines (0 participants)"
  );

  // ─── PHASE 6 — Données résiduelles des utilisateurs cibles ───
  h("PHASE 6 — Données résiduelles des utilisateurs cibles");

  totalDeleted += await q(
    `DELETE FROM avis WHERE id_utilisateur IN ${TARGET}`,
    "avis résiduels cibles"
  );

  totalDeleted += await q(
    `DELETE FROM inscriptions WHERE id_utilisateur IN ${TARGET}`,
    "inscriptions résiduelles cibles"
  );

  totalDeleted += await q(
    `DELETE FROM progressions WHERE id_utilisateur IN ${TARGET}`,
    "progressions résiduelles cibles"
  );

  totalDeleted += await q(
    `DELETE FROM progression_lecons WHERE id_utilisateur IN ${TARGET}`,
    "progression_lecons résiduelles cibles"
  );

  totalDeleted += await q(
    `DELETE FROM notifications WHERE id_utilisateur IN ${TARGET}`,
    "notifications résiduelles cibles"
  );

  // ─── PHASE 7 — Suppression des utilisateurs ───
  h("PHASE 7 — Suppression des utilisateurs");

  totalDeleted += await q(
    `DELETE FROM utilisateurs WHERE id_utilisateur IN ${TARGET}`,
    "utilisateurs cibles"
  );

  // ─── COMMIT ───
  await c.commit();
  h("TRANSACTION COMMITTÉE");
  console.log(`\n  TOTAL: ${totalDeleted} ligne(s) supprimée(s)`);

} catch (err) {
  console.error("\n❌ ERREUR — ROLLBACK EN COURS");
  console.error(`  Code: ${err.code}`);
  console.error(`  Message: ${err.sqlMessage || err.message}`);
  console.error(`  SQL: ${err.sql || "N/A"}`);
  await c.rollback();
  console.error("  → Rollback effectué. Aucune donnée modifiée.");
} finally {
  await c.end();
}
