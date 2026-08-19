import mysql from "mysql2/promise";

const c = await mysql.createConnection({ host: "localhost", user: "root", password: "", database: "elearningdb" });
const q = async (sql) => { const [r] = await c.query(sql); return r; };
const h = (t) => console.log("\n" + "=".repeat(60) + "\n" + t + "\n" + "=".repeat(60));
let errors = 0;
const check = (ok, msg) => { if (ok) console.log(`  ✅ ${msg}`); else { console.log(`  ❌ ${msg}`); errors++; } };

h("V1 — UTILISATEURS SUPPRIMÉS (doivent être ABSENTS)");
const deleted = [3, 8, 9, 10, 11, 12];
for (const id of deleted) {
  const r = await q(`SELECT id_utilisateur FROM utilisateurs WHERE id_utilisateur = ${id}`);
  check(r.length === 0, `id=${id} supprimé`);
}

h("V2 — UTILISATEURS PROTÉGÉS (doivent EXISTER)");
const protectedIds = [1, 2, 4, 5, 6, 7];
const names = { 1: "Admin", 2: "Jean Mukendi", 4: "David Kabila", 5: "Samuel Nzara", 6: "Mbuyi Patrick (samnaram)", 7: "Mbuyi Patrick (patrick.mbuyi)" };
for (const id of protectedIds) {
  const r = await q(`SELECT id_utilisateur, nom, prenom, email FROM utilisateurs WHERE id_utilisateur = ${id}`);
  check(r.length === 1, `id=${id} ${names[id]} présent (${r.length > 0 ? r[0].email : "ABSENT"})`);
}

h("V3 — ID 7 INTACT (toutes ses données)");
const u7 = await q(`SELECT * FROM utilisateurs WHERE id_utilisateur = 7`);
check(u7.length === 1, `id=7 existe: ${u7[0]?.prenom} ${u7[0]?.nom} <${u7[0]?.email}>`);
const ins7 = await q(`SELECT COUNT(*) as c FROM inscriptions WHERE id_utilisateur = 7`);
check(ins7[0].c >= 1, `id=7 inscriptions: ${ins7[0].c}`);
const prog7 = await q(`SELECT COUNT(*) as c FROM progressions WHERE id_utilisateur = 7`);
check(prog7[0].c >= 1, `id=7 progressions: ${prog7[0].c}`);
const tent7 = await q(`SELECT COUNT(*) as c FROM tentatives WHERE id_utilisateur = 7`);
check(tent7[0].c >= 1, `id=7 tentatives: ${tent7[0].c}`);
const soum7 = await q(`SELECT COUNT(*) as c FROM soumissions WHERE id_utilisateur = 7`);
check(soum7[0].c >= 1, `id=7 soumissions: ${soum7[0].c}`);
const conv7 = await q(`SELECT pc.id_conversation FROM participant_conversations pc WHERE pc.id_utilisateur = 7`);
check(conv7.length >= 1, `id=7 conversations: ${conv7.length}`);
const msg7 = await q(`SELECT COUNT(*) as c FROM messages WHERE id_expediteur = 7`);
check(msg7[0].c >= 1, `id=7 messages: ${msg7[0].c}`);

h("V4 — FORMATIONS DE GRACE SUPPRIMÉES");
const graceForms = await q(`SELECT id_formation, titre FROM formations WHERE id_formation IN (3, 6)`);
check(graceForms.length === 0, `formations 3,6 supprimées (${graceForms.length} restantes)`);

h("V5 — AUCUNE RÉFÉRENCE AUX FORMATIONS SUPPRIMÉES");
const orphIns = await q(`SELECT COUNT(*) as c FROM inscriptions WHERE id_formation IN (3, 6)`);
check(orphIns[0].c === 0, `inscriptions orphelines formations 3,6: ${orphIns[0].c}`);
const orphProg = await q(`SELECT COUNT(*) as c FROM progressions WHERE id_formation IN (3, 6)`);
check(orphProg[0].c === 0, `progressions orphelines formations 3,6: ${orphProg[0].c}`);
const orphAvis = await q(`SELECT COUNT(*) as c FROM avis WHERE id_formation IN (3, 6)`);
check(orphAvis[0].c === 0, `avis orphelines formations 3,6: ${orphAvis[0].c}`);

h("V6 — AUCUNE RÉFÉRENCE AUX UTILISATEURS SUPPRIMÉS");
const orphInsU = await q(`SELECT COUNT(*) as c FROM inscriptions WHERE id_utilisateur IN (3,8,9,10,11,12)`);
check(orphInsU[0].c === 0, `inscriptions orphelines users supprimés: ${orphInsU[0].c}`);
const orphProgU = await q(`SELECT COUNT(*) as c FROM progressions WHERE id_utilisateur IN (3,8,9,10,11,12)`);
check(orphProgU[0].c === 0, `progressions orphelines: ${orphProgU[0].c}`);
const orphAvisU = await q(`SELECT COUNT(*) as c FROM avis WHERE id_utilisateur IN (3,8,9,10,11,12)`);
check(orphAvisU[0].c === 0, `avis orphelines: ${orphAvisU[0].c}`);
const orphTent = await q(`SELECT COUNT(*) as c FROM tentatives WHERE id_utilisateur IN (3,8,9,10,11,12)`);
check(orphTent[0].c === 0, `tentatives orphelines: ${orphTent[0].c}`);
const orphSoum = await q(`SELECT COUNT(*) as c FROM soumissions WHERE id_utilisateur IN (3,8,9,10,11,12)`);
check(orphSoum[0].c === 0, `soumissions orphelines: ${orphSoum[0].c}`);
const orphNotif = await q(`SELECT COUNT(*) as c FROM notifications WHERE id_utilisateur IN (3,8,9,10,11,12)`);
check(orphNotif[0].c === 0, `notifications orphelines: ${orphNotif[0].c}`);
const orphMsg = await q(`SELECT COUNT(*) as c FROM messages WHERE id_expediteur IN (3,8,9,10,11,12)`);
check(orphMsg[0].c === 0, `messages orphelines: ${orphMsg[0].c}`);
const orphPart = await q(`SELECT COUNT(*) as c FROM participant_conversations WHERE id_utilisateur IN (3,8,9,10,11,12)`);
check(orphPart[0].c === 0, `participant_conversations orphelines: ${orphPart[0].c}`);

h("V7 — CASCADE FORMATIONS GRACE PROPRE");
const orphQuiz = await q(`SELECT COUNT(*) as c FROM quiz WHERE id_lecon IN (6,7,11)`);
check(orphQuiz[0].c === 0, `quiz orphelnes leçons Grace: ${orphQuiz[0].c}`);
const orphQ = await q(`SELECT COUNT(*) as c FROM questions WHERE id_quiz IN (6,7,11)`);
check(orphQ[0].c === 0, `questions orphelines quiz Grace: ${orphQ[0].c}`);
const orphR = await q(`SELECT COUNT(*) as c FROM reponses r INNER JOIN questions q ON r.id_question = q.id_question INNER JOIN quiz qz ON q.id_quiz = qz.id_quiz WHERE qz.id_lecon IN (6,7,11)`);
check(orphR[0].c === 0, `réponses orphelines quiz Grace: ${orphR[0].c}`);
const orphVid = await q(`SELECT COUNT(*) as c FROM videos WHERE id_lecon IN (6,7,11)`);
check(orphVid[0].c === 0, `videos orphelines leçons Grace: ${orphVid[0].c}`);
const orphDoc = await q(`SELECT COUNT(*) as c FROM documents WHERE id_lecon IN (6,7,11)`);
check(orphDoc[0].c === 0, `documents orphelines leçons Grace: ${orphDoc[0].c}`);
const orphDev = await q(`SELECT COUNT(*) as c FROM devoirs WHERE id_lecon IN (6,7,11)`);
check(orphDev[0].c === 0, `devoirs orphelines leçons Grace: ${orphDev[0].c}`);
const orphLec = await q(`SELECT COUNT(*) as c FROM lecons WHERE id_chapitre IN (6,7,11)`);
check(orphLec[0].c === 0, `leçons orphelines chapitres Grace: ${orphLec[0].c}`);
const orphChap = await q(`SELECT COUNT(*) as c FROM chapitres WHERE id_module IN (5,6,10)`);
check(orphChap[0].c === 0, `chapitres orphelines modules Grace: ${orphChap[0].c}`);
const orphMod = await q(`SELECT COUNT(*) as c FROM modules WHERE id_formation IN (3,6)`);
check(orphMod[0].c === 0, `modules orphelines formations Grace: ${orphMod[0].c}`);

h("V8 — DONNÉES DAVID (id=4) INTACTES");
const davForms = await q(`SELECT COUNT(*) as c FROM formations WHERE id_formateur = 4`);
check(davForms[0].c >= 1, `formations de David: ${davForms[0].c}`);
const davModules = await q(`SELECT COUNT(*) as c FROM modules m INNER JOIN formations f ON m.id_formation = f.id_formation WHERE f.id_formateur = 4`);
check(davModules[0].c >= 1, `modules de David: ${davModules[0].c}`);

h("V9 — CONVERSATIONS RESTANTES");
const remainingConvs = await q(`SELECT c.id_conversation, c.sujet FROM conversations c INNER JOIN participant_conversations pc ON c.id_conversation = pc.id_conversation GROUP BY c.id_conversation, c.sujet`);
for (const cv of remainingConvs) {
  const parts = await q(`SELECT pc.id_utilisateur, u.prenom, u.nom FROM participant_conversations pc INNER JOIN utilisateurs u ON pc.id_utilisateur = u.id_utilisateur WHERE pc.id_conversation = ${cv.id_conversation}`);
  console.log(`  conv ${cv.id_conversation} "${cv.sujet}" → ${parts.map(p => `id=${p.id_utilisateur} ${p.prenom} ${p.nom}`).join(", ")}`);
}
const emptyConvs = await q(`SELECT c.id_conversation FROM conversations c LEFT JOIN participant_conversations pc ON c.id_conversation = pc.id_conversation WHERE pc.id_conversation IS NULL`);
check(emptyConvs.length === 0, `conversations orphelines: ${emptyConvs.length}`);

h("V10 — RÉSUMÉ GLOBAL");
const totalUsers = await q(`SELECT COUNT(*) as c FROM utilisateurs`);
const totalFormations = await q(`SELECT COUNT(*) as c FROM formations`);
const totalModules = await q(`SELECT COUNT(*) as c FROM modules`);
const totalQuiz = await q(`SELECT COUNT(*) as c FROM quiz`);
const totalConv = await q(`SELECT COUNT(*) as c FROM conversations`);
console.log(`  Utilisateurs: ${totalUsers[0].c}`);
console.log(`  Formations: ${totalFormations[0].c}`);
console.log(`  Modules: ${totalModules[0].c}`);
console.log(`  Quiz: ${totalQuiz[0].c}`);
console.log(`  Conversations: ${totalConv[0].c}`);

h(errors === 0 ? "✅ TOUTES LES VÉRIFICATIONS PASSÉES" : `❌ ${errors} ÉCHEC(S) DÉTECTÉ(S)`);

await c.end();
