import mysql from "mysql2/promise";

const c = await mysql.createConnection({ host: "localhost", user: "root", password: "", database: "elearningdb" });
const q = async (sql) => { const [r] = await c.query(sql); return r; };
const h = (t) => console.log("\n" + "=".repeat(60) + "\n" + t + "\n" + "=".repeat(60));

// ─── 1. LISTE COMPLÈTE DES UTILISATEURS ───
h("1 — TOUS LES UTILISATEURS (id, nom, prenom, email, role)");
const allUsers = await q(`SELECT id_utilisateur, nom, prenom, email, id_role FROM utilisateurs ORDER BY id_utilisateur`);
for (const u of allUsers) console.log(`  id=${u.id_utilisateur} | ${u.prenom} ${u.nom} | ${u.email} | role=${u.id_role}`);

// ─── 2. CIBLES HISTORIQUES vs RÉEL ───
h("2 — CORRESPONDANCE CIBLES HISTORIQUES vs RÉEL");
const targets = [
  { id: 3,  expectedNom: "Kabongo", expectedPrenom: "Grace",   expectedEmail: "grace@tutore.local" },
  { id: 7,  expectedNom: "Ilunga",  expectedPrenom: "Sarah",   expectedEmail: "sarah@tutore.local" },
  { id: 8,  expectedNom: "Kasongo", expectedPrenom: "Rachel",  expectedEmail: "rachel@tutore.local" },
  { id: 9,  expectedNom: "Mutombo", expectedPrenom: "Kevin",   expectedEmail: "kevin@tutore.local" },
  { id: 10, expectedNom: "Mbayo",   expectedPrenom: "Esther",  expectedEmail: "esther@tutore.local" },
  { id: 11, expectedNom: "Ngoma",   expectedPrenom: "Fabrice", expectedEmail: "fabrice@tutore.local" },
  { id: 12, expectedNom: "Mwamba",  expectedPrenom: "Aline",   expectedEmail: "aline@tutore.local" },
];
for (const t of targets) {
  const rows = await q(`SELECT id_utilisateur, nom, prenom, email, id_role FROM utilisateurs WHERE id_utilisateur = ${t.id}`);
  if (!rows.length) {
    console.log(`  id=${t.id} — ABSENT de la DB ! (cible: ${t.expectedPrenom} ${t.expectedNom} <${t.expectedEmail}>)`);
  } else {
    const u = rows[0];
    const nomOk = u.nom === t.expectedNom || u.prenom === t.expectedNom;
    const prenomOk = u.prenom === t.expectedPrenom || u.nom === t.expectedPrenom;
    const emailOk = u.email === t.expectedEmail;
    const status = (nomOk && prenomOk && emailOk) ? "✅ CONFORME" : "⚠️  NON-CONFORME";
    console.log(`  id=${t.id} — ${status}`);
    console.log(`    attendu: ${t.expectedPrenom} ${t.expectedNom} <${t.expectedEmail}>`);
    console.log(`    réel:    ${u.prenom} ${u.nom} <${u.email}> role=${u.id_role}`);
    if (!nomOk || !prenomOk) console.log(`    ❌ NOM/PRENOM ne correspondent PAS`);
    if (!emailOk) console.log(`    ❌ EMAIL ne correspond PAS`);
  }
}

// ─── 3. RECHERCHE DE SARAH (tout ID, tout email) ───
h("3 — RECHERCHE DE SARAH (nom ou email)");
const sarahNom = await q(`SELECT id_utilisateur, nom, prenom, email, id_role FROM utilisateurs WHERE nom LIKE '%Sarah%' OR prenom LIKE '%Sarah%'`);
console.log(`  Par nom/prénom "Sarah": ${sarahNom.length} résultat(s)`);
for (const u of sarahNom) console.log(`    id=${u.id_utilisateur} ${u.prenom} ${u.nom} <${u.email}> role=${u.id_role}`);
const sarahEmail = await q(`SELECT id_utilisateur, nom, prenom, email, id_role FROM utilisateurs WHERE email = 'sarah@tutore.local'`);
console.log(`  Par email "sarah@tutore.local": ${sarahEmail.length} résultat(s)`);
for (const u of sarahEmail) console.log(`    id=${u.id_utilisateur} ${u.prenom} ${u.nom} <${u.email}> role=${u.id_role}`);
const sarahFuzzy = await q(`SELECT id_utilisateur, nom, prenom, email, id_role FROM utilisateurs WHERE email LIKE '%sarah%' OR nom LIKE '%ilunga%' OR prenom LIKE '%ilunga%'`);
console.log(`  Par fuzzy (email=%sarah% ou nom/prenom=%ilunga%): ${sarahFuzzy.length} résultat(s)`);
for (const u of sarahFuzzy) console.log(`    id=${u.id_utilisateur} ${u.prenom} ${u.nom} <${u.email}> role=${u.id_role}`);

// ─── 4. DOSSIER COMPLET DE L'ID 7 ───
h("4 — DOSSIER COMPLET: ID 7 (Mbuyi Patrick <patrick.mbuyi@tutore.local>)");

const u7 = (await q(`SELECT * FROM utilisateurs WHERE id_utilisateur = 7`))[0];
console.log(`  Utilisateur: ${u7.prenom} ${u7.nom} <${u7.email}> role=${u7.id_role} created=${u7.created_at}`);

const ins7 = await q(`SELECT i.*, f.titre FROM inscriptions i INNER JOIN formations f ON i.id_formation = f.id_formation WHERE i.id_utilisateur = 7`);
console.log(`\n  Inscriptions (${ins7.length}):`);
for (const i of ins7) console.log(`    inscription id=${i.id_inscription} → formation ${i.id_formation} "${i.titre}"`);

const prog7 = await q(`SELECT p.*, f.titre FROM progressions p INNER JOIN formations f ON p.id_formation = f.id_formation WHERE p.id_utilisateur = 7`);
console.log(`\n  Progressions (${prog7.length}):`);
for (const p of prog7) console.log(`    formation ${p.id_formation} "${p.titre}" progression=${p.progression}%`);

const progL7 = await q(`SELECT pl.*, l.titre as lecon_titre FROM progression_lecons pl INNER JOIN lecons l ON pl.id_lecon = l.id_lecon WHERE pl.id_utilisateur = 7`);
console.log(`\n  Progression leçons (${progL7.length}):`);
for (const p of progL7) console.log(`    leçon ${p.id_lecon} "${p.prenom}" ...`);

const tent7 = await q(`SELECT t.*, qz.titre as quiz_titre FROM tentatives t INNER JOIN quiz qz ON t.id_quiz = qz.id_quiz WHERE t.id_utilisateur = 7`);
console.log(`\n  Tentatives quiz (${tent7.length}):`);
for (const t of tent7) console.log(`    tentative id=${t.id_tentative} quiz="${t.quiz_titre}" note=${t.note} date=${t.date_tentative}`);

const repEtu7 = await q(`SELECT re.*, qq.enonce, r.contenu as reponse, r.est_correcte, qz.titre as quiz_titre FROM reponses_etudiants re INNER JOIN tentatives t ON re.id_tentative = t.id_tentative INNER JOIN questions qq ON re.id_question = qq.id_question INNER JOIN reponses r ON re.id_reponse = r.id_reponse INNER JOIN quiz qz ON qq.id_quiz = qz.id_quiz WHERE t.id_utilisateur = 7`);
console.log(`\n  Réponses étudiantes (${repEtu7.length}):`);
for (const r of repEtu7) console.log(`    quiz="${r.quiz_titre}" Q: "${r.enonce}" → "${r.reponse}" ${r.est_correcte ? "✓" : "✗"}`);

const soum7 = await q(`SELECT s.*, d.titre as devoir_titre, l.titre as lecon_titre FROM soumissions s INNER JOIN devoirs d ON s.id_devoir = d.id_devoir INNER JOIN lecons l ON d.id_lecon = l.id_lecon WHERE s.id_utilisateur = 7`);
console.log(`\n  Soumissions (${soum7.length}):`);
for (const s of soum7) console.log(`    soumission id=${s.id_soumission} devoir="${s.devoir_titre}" leçon="${s.lecon_titre}" file="${s.fichier}" note=${s.note}`);

const avis7 = await q(`SELECT a.*, f.titre as formation_titre FROM avis a INNER JOIN formations f ON a.id_formation = f.id_formation WHERE a.id_utilisateur = 7`);
console.log(`\n  Avis (${avis7.length}):`);
for (const a of avis7) console.log(`    avis id=${a.id_avis} formation="${a.formation_titre}" note=${a.note} commentaire="${a.commentaire}"`);

const notif7 = await q(`SELECT * FROM notifications WHERE id_utilisateur = 7`);
console.log(`\n  Notifications (${notif7.length}):`);
for (const n of notif7) console.log(`    id=${n.id_notification} type=${n.type} titre="${n.titre}"`);

const conv7 = await q(`SELECT pc.id_conversation, c.sujet, c.created_at FROM participant_conversations pc INNER JOIN conversations c ON pc.id_conversation = c.id_conversation WHERE pc.id_utilisateur = 7`);
console.log(`\n  Conversations (${conv7.length}):`);
for (const cv of conv7) {
  console.log(`    conv ${cv.id_conversation} "${cv.sujet}"`);
  const parts = await q(`SELECT pc.id_utilisateur, u.prenom, u.nom FROM participant_conversations pc INNER JOIN utilisateurs u ON pc.id_utilisateur = u.id_utilisateur WHERE pc.id_conversation = ${cv.id_conversation}`);
  for (const p of parts) console.log(`      participant: id=${p.id_utilisateur} ${p.prenom} ${p.nom}`);
  const msgs = await q(`SELECT m.id_message, m.id_expediteur, m.contenu, m.created_at FROM messages m WHERE m.id_conversation = ${cv.id_conversation} ORDER BY m.created_at`);
  for (const m of msgs) console.log(`      msg id=${m.id_message} from=${m.id_expediteur} "${m.contenu}"`);
}

const msgBy7 = await q(`SELECT m.*, c.sujet as conv_sujet FROM messages m INNER JOIN conversations c ON m.id_conversation = c.id_conversation WHERE m.id_expediteur = 7`);
console.log(`\n  Messages envoyés par id=7 (${msgBy7.length}):`);
for (const m of msgBy7) console.log(`    conv "${m.conv_sujet}" msg id=${m.id_message} "${m.contenu}"`);

// ─── 5. VÉRIFICATION DES AUTRES UTILISATEURS NON-CIBLES ───
h("5 — UTILISATEURS NON-CIBLES (à ne PAS supprimer)");
const nonTargets = allUsers.filter(u => ![3, 7, 8, 9, 10, 11, 12].includes(u.id_utilisateur));
for (const u of nonTargets) console.log(`  id=${u.id_utilisateur} | ${u.prenom} ${u.nom} | ${u.email} | role=${u.id_role}`);

await c.end();
