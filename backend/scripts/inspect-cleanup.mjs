import mysql from "mysql2/promise";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const c = await mysql.createConnection({ host: "localhost", user: "root", password: "", database: "elearningdb" });
const TARGET = "(3,7,8,9,10,11,12)";
const STUDENTS = "(7,8,9,10,11,12)";

const q = async (sql) => { const [r] = await c.query(sql); return r; };
const h = (t) => console.log("\n" + "=".repeat(60) + "\n" + t + "\n" + "=".repeat(60));

h("A1 — UTILISATEURS CIBLÉS");
for (const u of await q(`SELECT id_utilisateur, email, nom, prenom, id_role FROM utilisateurs WHERE id_utilisateur IN ${TARGET}`))
  console.log(`  id=${u.id_utilisateur} ${u.prenom} ${u.nom} <${u.email}> role=${u.id_role}`);

h("A2 — CLÉS ÉTRANGÈRES");
const fks = await q(`SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = 'elearningdb' ORDER BY REFERENCED_TABLE_NAME, TABLE_NAME`);
const byRef = {};
for (const fk of fks) {
  const key = fk.REFERENCED_TABLE_NAME;
  if (!byRef[key]) byRef[key] = [];
  byRef[key].push(`${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
}
for (const [ref, children] of Object.entries(byRef).sort())
  console.log(`\n  ${ref}: ${children.join(", ")}`);

h("A3 — FORMATIONS DE GRACE (id=3)");
const graceF = await q(`SELECT id_formation, titre FROM formations WHERE id_formateur = 3`);
for (const f of graceF) console.log(`  id=${f.id_formation} "${f.titre}"`);
const gIds = graceF.map(f => f.id_formation);

if (gIds.length) {
  const GS = gIds.join(",");
  let lIds = [], qIds = [], dIds = [];

  h("A3a — Modules de Grace");
  const mods = await q(`SELECT id_module, titre, id_formation FROM modules WHERE id_formation IN (${GS})`);
  for (const m of mods) console.log(`  id=${m.id_module} "${m.titre}" (formation ${m.id_formation})`);
  const mIds = mods.map(m => m.id_module);

  if (mIds.length) {
    const MS = mIds.join(",");
    h("A3b — Chapitres de Grace");
    const chaps = await q(`SELECT id_chapitre, titre, id_module FROM chapitres WHERE id_module IN (${MS})`);
    for (const c of chaps) console.log(`  id=${c.id_chapitre} "${c.titre}" (module ${c.id_module})`);
    const cIds = chaps.map(c => c.id_chapitre);

    if (cIds.length) {
      const CS = cIds.join(",");
      h("A3c — Leçons de Grace");
      const lecs = await q(`SELECT id_lecon, titre, id_chapitre FROM lecons WHERE id_chapitre IN (${CS})`);
      for (const l of lecs) console.log(`  id=${l.id_lecon} "${l.titre}" (chapitre ${l.id_chapitre})`);
      lIds = lecs.map(l => l.id_lecon);

      if (lIds.length) {
        const LS = lIds.join(",");
        h("A3d — Videos / Documents / Quiz / Devoirs de Grace");
        const vids = await q(`SELECT id_video, titre, chemin_video, id_lecon FROM videos WHERE id_lecon IN (${LS})`);
        const docs = await q(`SELECT id_document, titre, chemin_document, id_lecon FROM documents WHERE id_lecon IN (${LS})`);
        console.log(`  videos: ${vids.length}`);
        for (const v of vids) console.log(`    vid id=${v.id_video} "${v.titre}" file="${v.chemin_video}" (lecon ${v.id_lecon})`);
        console.log(`  documents: ${docs.length}`);
        for (const d of docs) console.log(`    doc id=${d.id_document} "${d.titre}" file="${d.chemin_document}" (lecon ${d.id_lecon})`);
        const quizz = await q(`SELECT id_quiz, titre, id_lecon FROM quiz WHERE id_lecon IN (${LS})`);
        const devs = await q(`SELECT id_devoir, titre, id_lecon FROM devoirs WHERE id_lecon IN (${LS})`);
        console.log(`  videos: ${vids[0].n}, documents: ${docs[0].n}`);
        for (const q of quizz) console.log(`  quiz id=${q.id_quiz} "${q.titre}" (lecon ${q.id_lecon})`);
        for (const d of devs) console.log(`  devoir id=${d.id_devoir} "${d.titre}" (lecon ${d.id_lecon})`);

        const qIdsRaw = quizz.map(q => q.id_quiz).filter(Boolean);
        qIds = qIdsRaw;
        const dIdsRaw = devs.map(d => d.id_devoir).filter(Boolean);
        dIds = dIdsRaw;

        if (qIds.length) {
          const QS = qIds.join(",");
          const qCount = await q(`SELECT COUNT(*) as n FROM questions WHERE id_quiz IN (${QS})`);
          const rCount = await q(`SELECT COUNT(*) as n FROM reponses rq INNER JOIN questions qq ON rq.id_question = qq.id_question WHERE qq.id_quiz IN (${QS})`);
          const tCount = await q(`SELECT COUNT(*) as n FROM tentatives WHERE id_quiz IN (${QS})`);
          console.log(`  questions: ${qCount[0].n}, réponses: ${rCount[0].n}, tentatives: ${tCount[0].n}`);
          const tRows = await q(`SELECT id_tentative, id_utilisateur, id_quiz FROM tentatives WHERE id_quiz IN (${QS})`);
          const reIds = tRows.map(t => t.id_tentative).filter(Boolean);
          if (reIds.length) {
            const RS = reIds.join(",");
            const reCount = await q(`SELECT COUNT(*) as n FROM reponses_etudiants WHERE id_tentative IN (${RS})`);
            console.log(`  réponses_etudiants: ${reCount[0].n}`);
          }
        }
        if (dIds.length) {
          const DS = dIds.join(",");
          const sCount = await q(`SELECT COUNT(*) as n FROM soumissions WHERE id_devoir IN (${DS})`);
          console.log(`  soumissions: ${sCount[0].n}`);
        }
      }
    }
  }

  h("A3e — Inscriptions aux formations de Grace");
  const enr = await q(`SELECT i.*, u.prenom, u.nom, u.email FROM inscriptions i INNER JOIN utilisateurs u ON i.id_utilisateur = u.id_utilisateur WHERE i.id_formation IN (${GS})`);
  for (const e of enr) console.log(`  id=${e.id_inscription} ${e.prenom} ${e.nom} <${e.email}> → formation ${e.id_formation}`);

  h("A3f — Progressions pour les formations de Grace");
  const progs = await q(`SELECT p.*, u.prenom, u.nom FROM progressions p INNER JOIN utilisateurs u ON p.id_utilisateur = u.id_utilisateur WHERE p.id_formation IN (${GS})`);
  for (const p of progs) console.log(`  ${p.prenom} ${p.nom}: ${p.pourcentage}% (formation ${p.id_formation})`);

  h("A3g — Avis sur les formations de Grace");
  const avs = await q(`SELECT a.*, u.prenom, u.nom FROM avis a INNER JOIN utilisateurs u ON a.id_utilisateur = u.id_utilisateur WHERE a.id_formation IN (${GS})`);
  for (const a of avs) console.log(`  ${a.prenom} ${a.nom}: note=${a.note} (formation ${a.id_formation})`);

  h("A3h — Progression leçons pour les leçons de Grace");
  if (lIds.length) {
    const LS = lIds.join(",");
    const pl = await q(`SELECT pl.*, u.prenom, u.nom FROM progression_lecons pl INNER JOIN utilisateurs u ON pl.id_utilisateur = u.id_utilisateur WHERE pl.id_lecon IN (${LS})`);
    for (const p of pl) console.log(`  ${p.prenom} ${p.nom}: lecon ${p.id_lecon} completed_at=${p.completed_at}`);
  }
}

h("A5 — DONNÉES DES ÉTUDIANTS CIBLÉS (partout)");

const eIns = await q(`SELECT COUNT(*) as n FROM inscriptions WHERE id_utilisateur IN ${STUDENTS}`);
console.log(`  inscriptions: ${eIns[0].n}`);
const eProg = await q(`SELECT COUNT(*) as n FROM progressions WHERE id_utilisateur IN ${STUDENTS}`);
console.log(`  progressions: ${eProg[0].n}`);
const ePL = await q(`SELECT COUNT(*) as n FROM progression_lecons WHERE id_utilisateur IN ${STUDENTS}`);
console.log(`  progression_lecons: ${ePL[0].n}`);
const eTent = await q(`SELECT COUNT(*) as n FROM tentatives WHERE id_utilisateur IN ${STUDENTS}`);
console.log(`  tentatives: ${eTent[0].n}`);
const eRe = await q(`SELECT COUNT(*) as n FROM reponses_etudiants re INNER JOIN tentatives t ON re.id_tentative = t.id_tentative WHERE t.id_utilisateur IN ${STUDENTS}`);
console.log(`  reponses_etudiants: ${eRe[0].n}`);
const eSoum = await q(`SELECT COUNT(*) as n FROM soumissions WHERE id_utilisateur IN ${STUDENTS}`);
console.log(`  soumissions: ${eSoum[0].n}`);
const eAvis = await q(`SELECT COUNT(*) as n FROM avis WHERE id_utilisateur IN ${STUDENTS}`);
console.log(`  avis: ${eAvis[0].n}`);
const eNotif = await q(`SELECT COUNT(*) as n FROM notifications WHERE id_utilisateur IN ${STUDENTS}`);
console.log(`  notifications: ${eNotif[0].n}`);

const eConv = await q(`SELECT DISTINCT pc.id_conversation FROM participant_conversations pc WHERE pc.id_utilisateur IN ${STUDENTS}`);
console.log(`  conversations: ${eConv.length}`);
const eConvIds = eConv.map(c => c.id_conversation);
if (eConvIds.length) {
  const CIS = eConvIds.join(",");
  const eMsg = await q(`SELECT COUNT(*) as n FROM messages WHERE id_conversation IN (${CIS})`);
  const ePC = await q(`SELECT COUNT(*) as n FROM participant_conversations WHERE id_conversation IN (${CIS})`);
  console.log(`    messages: ${eMsg[0].n}, participants: ${ePC[0].n}`);
  for (const conv of await q(`SELECT * FROM conversations WHERE id_conversation IN (${CIS})`))
    console.log(`    conv id=${conv.id_conversation} "${conv.sujet}"`);
}

h("A6 — DONNÉES DE GRACE (notifications, conversations)");
const gNotif = await q(`SELECT COUNT(*) as n FROM notifications WHERE id_utilisateur = 3`);
console.log(`  notifications: ${gNotif[0].n}`);
const gConv = await q(`SELECT DISTINCT pc.id_conversation FROM participant_conversations pc WHERE pc.id_utilisateur = 3`);
console.log(`  conversations: ${gConv.length}`);
const gConvIds = gConv.map(c => c.id_conversation);
if (gConvIds.length) {
  const GCS = gConvIds.join(",");
  const gPC = await q(`SELECT pc.*, u.prenom, u.nom, c.sujet FROM participant_conversations pc INNER JOIN utilisateurs u ON pc.id_utilisateur = u.id_utilisateur INNER JOIN conversations c ON pc.id_conversation = c.id_conversation WHERE pc.id_conversation IN (${GCS})`);
  for (const p of gPC) console.log(`    conv "${p.sujet}" participant: ${p.prenom} ${p.nom} (id=${p.id_utilisateur})`);
}

h("A7 — FICHIERS PHYSIQUES");
const uploadDir = "D:\\Project\\projetTutore\\ProjetTutore\\backend\\src\\uploads";

const countFiles = (dir) => {
  let n = 0;
  try { for (const f of readdirSync(dir)) { const s = statSync(join(dir, f)); n += s.isDirectory() ? countFiles(join(dir, f)) : 1; } } catch {}
  return n;
};
console.log(`  Total fichiers dans uploads: ${countFiles(uploadDir)}`);

h("A8 — RÉSUMÉ CIBLE");
console.log("  Utilisateurs à supprimer: 3 (Grace), 7 (Sarah), 8 (Rachel), 9 (Kevin), 10 (Esther), 11 (Fabrice), 12 (Aline)");
console.log(`  Formations de Grace: ${gIds.length} (${gIds.join(",")})`);

await c.end();
console.log("\nInspection terminée.");
