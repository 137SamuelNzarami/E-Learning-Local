import mysql from "mysql2/promise";
const c = await mysql.createConnection({ host: "localhost", user: "root", password: "", database: "elearningdb" });
const q = async (sql) => { const [r] = await c.query(sql); return r; };
const h = (t) => console.log("\n" + "=".repeat(60) + "\n" + t + "\n" + "=".repeat(60));

const STUDENTS = "(7,8,9,10,11,12)";
const TARGET = "(3,7,8,9,10,11,12)";

h("D1 — CONVERSATIONS DES ÉTUDIANTS CIBLÉS (participants détaillés)");
const convIds = [1, 3];
for (const cid of convIds) {
  console.log(`\n  Conv ${cid}:`);
  const conv = await q(`SELECT * FROM conversations WHERE id_conversation = ${cid}`);
  if (conv.length) console.log(`    sujet="${conv[0].sujet}" created_at=${conv[0].created_at}`);
  const parts = await q(`SELECT pc.id_utilisateur, u.prenom, u.nom, u.email FROM participant_conversations pc INNER JOIN utilisateurs u ON pc.id_utilisateur = u.id_utilisateur WHERE pc.id_conversation = ${cid}`);
  for (const p of parts) console.log(`    participant: id=${p.id_utilisateur} ${p.prenom} ${p.nom} <${p.email}>`);
  const msgs = await q(`SELECT m.id_message, m.id_expediteur, m.contenu, m.created_at FROM messages m WHERE m.id_conversation = ${cid} ORDER BY m.created_at`);
  for (const m of msgs) console.log(`    msg id=${m.id_message} from=${m.id_expediteur} "${m.contenu}" at=${m.created_at}`);
}

h("D2 — CONVERSATION DE GRACE (conv participant = Grace)");
const graceConvParts = await q(`SELECT pc.id_conversation, pc.id_utilisateur, u.prenom, u.nom, u.email, c.sujet FROM participant_conversations pc INNER JOIN utilisateurs u ON pc.id_utilisateur = u.id_utilisateur INNER JOIN conversations c ON pc.id_conversation = c.id_conversation WHERE pc.id_utilisateur = 3`);
for (const p of graceConvParts) {
  console.log(`  conv ${p.id_conversation} "${p.sujet}" → participant: id=${p.id_utilisateur} ${p.prenom} ${p.nom}`);
  const otherParts = await q(`SELECT pc.id_utilisateur, u.prenom, u.nom, u.email FROM participant_conversations pc INNER JOIN utilisateurs u ON pc.id_utilisateur = u.id_utilisateur WHERE pc.id_conversation = ${p.id_conversation} AND pc.id_utilisateur != 3`);
  for (const o of otherParts) console.log(`    autre participant: id=${o.id_utilisateur} ${o.prenom} ${o.nom} <${o.email}>`);
  const msgs = await q(`SELECT m.id_message, m.id_expediteur, m.contenu, m.created_at FROM messages m WHERE m.id_conversation = ${p.id_conversation} ORDER BY m.created_at`);
  for (const m of msgs) console.log(`    msg id=${m.id_message} from=${m.id_expediteur} "${m.contenu}"`);
}

h("D3 — SOUMISSIONS AVEC FICHIERS");
const soums = await q(`SELECT s.*, d.titre as devoir_titre FROM soumissions s INNER JOIN devoirs d ON s.id_devoir = d.id_devoir`);
for (const s of soums) console.log(`  id=${s.id_soumission} user=${s.id_utilisateur} devoir="${s.devoir_titre}" file="${s.fichier}" note=${s.note}`);

h("D4 — TENTATIVES DÉTAILLÉES");
const tents = await q(`SELECT t.*, qz.titre as quiz_titre, u.prenom, u.nom FROM tentatives t INNER JOIN quiz qz ON t.id_quiz = qz.id_quiz INNER JOIN utilisateurs u ON t.id_utilisateur = u.id_utilisateur`);
for (const t of tents) console.log(`  id=${t.id_tentative} user=${t.id_utilisateur} (${t.prenom} ${t.nom}) quiz="${t.quiz_titre}" note=${t.note}`);

h("D5 — QUIZ QUESTIONS + BONNES RÉPONSES (quiz de Grace)");
const graceQuiz = [6, 7, 11];
for (const qid of graceQuiz) {
  const quiz = await q(`SELECT * FROM quiz WHERE id_quiz = ${qid}`);
  if (!quiz.length) continue;
  console.log(`\n  Quiz ${qid} "${quiz[0].titre}" (lecon ${quiz[0].id_lecon}):`);
  const qs = await q(`SELECT * FROM questions WHERE id_quiz = ${qid}`);
  for (const qq of qs) {
    console.log(`    Q${qq.id_question}: "${qq.enonce}"`);
    const rs = await q(`SELECT * FROM reponses WHERE id_question = ${qq.id_question}`);
    for (const r of rs) console.log(`      R${r.id_reponse}: "${r.texte}" ${r.est_correcte ? "✓" : ""}`);
  }
}

h("D6 — TOUTES LES INSCRIPTIONS (pour identifier les autres étudiants à ne PAS supprimer)");
const allIns = await q(`SELECT i.*, u.prenom, u.nom, u.email, f.titre as formation_titre FROM inscriptions i INNER JOIN utilisateurs u ON i.id_utilisateur = u.id_utilisateur INNER JOIN formations f ON i.id_formation = f.id_formation ORDER BY i.id_formation, i.id_utilisateur`);
for (const i of allIns) {
  const target = "(3,7,8,9,10,11,12)".includes(String(i.id_utilisateur)) ? "← CIBLE" : "";
  console.log(`  user=${i.id_utilisateur} ${i.prenom} ${i.nom} → formation ${i.id_formation} "${i.formation_titre}" ${target}`);
}

h("D7 — NOTIFICATIONS DÉTAILLÉES");
const allNotif = await q(`SELECT n.*, u.prenom, u.nom FROM notifications n INNER JOIN utilisateurs u ON n.id_utilisateur = u.id_utilisateur`);
for (const n of allNotif) console.log(`  id=${n.id_notification} user=${n.id_utilisateur} (${n.prenom} ${n.nom}) type=${n.type} "${n.titre}" read=${n.read_at} at=${n.created_at}`);

h("D8 — RÉPONSES ÉTUDIANTES DÉTAILLÉES");
const re = await q(`SELECT re.*, qq.enonce, r.contenu as reponse_texte, r.est_correcte, t.id_utilisateur FROM reponses_etudiants re INNER JOIN questions qq ON re.id_question = qq.id_question INNER JOIN reponses r ON re.id_reponse = r.id_reponse INNER JOIN tentatives t ON re.id_tentative = t.id_tentative ORDER BY t.id_utilisateur`);
for (const r of re) console.log(`  user=${r.id_utilisateur} tentative=${r.id_tentative} Q="${r.enonce}" → "${r.reponse_texte}" ${r.est_correcte ? "✓" : "✗"}`);

h("D9 — VÉRIFICATION IDs UTILISATEURS ATTENDUS vs RÉELS");
console.log("  Attendu par la mission:");
console.log("    id=7 Ilunga Sarah <sarah@tutore.local>");
console.log("    id=8 Kasongo Rachel <rachel@tutore.local>");
console.log("    id=9 Mutombo Kevin <kevin@tutore.local>");
console.log("    id=10 Mbayo Esther <esther@tutore.local>");
console.log("    id=11 Ngoma Fabrice <fabrice@tutore.local>");
console.log("    id=12 Mwamba Aline <aline@tutore.local>");
console.log("  Réellement dans la DB:");
for (const u of await q(`SELECT id_utilisateur, email, nom, prenom FROM utilisateurs WHERE id_utilisateur IN ${STUDENTS}`))
  console.log(`    id=${u.id_utilisateur} ${u.prenom} ${u.nom} <${u.email}>`);

await c.end();
