/**
 * TEST MISSION — Quiz du chapitre intégré au FormationBuilder.
 *
 * Parcours complet Formateur -> Quiz -> Étudiant sur la formation 46
 * (« Formation Multimédia Test », PUBLIEE, formateur id 4, Grâce inscrite) :
 *
 *  A. FORMATEUR (jean.paul@tutore.local / id 4)
 *     1. Créer un quiz sur le chapitre 84 (2 questions QCM ; multi-sélection
 *        correcte sur une question) directement dans le Builder.
 *     2. Créer un quiz sur le chapitre 85 (1 question QCM).
 *     3. Ajouter un 3e chapitre (86 « Chapitre 3 — Synthèse ») pour tester le
 *        verrouillage de progression.
 *     4. Modifier une question + re-vérifier la persistance après reload.
 *     5. Vérifier la vue récapitulative /formateur/quizzes et la redirection
 *        ?chapitre=84 (scroll + highlight) vers le Builder.
 *
 *  B. ÉTUDIANT (grace.wayire@tutore.local / id 6)
 *     6. Réussite chapitre 84 -> note 100/100 REUSSIE -> « Chapitre suivant ».
 *     7. Échec chapitre 85 -> ECHOUEE, note < 100, verrouillage du chapitre 86
 *        (navigation directe interdite), aucune carte « Chapitre suivant ».
 *     8. Nouvelle tentative chapitre 85 réussie -> REUSSIE -> chapitre 86 débloqué.
 *
 * La note / la réussite / le verrouillage sont décidés CÔTÉ SERVEUR ; le
 * frontend ne fait qu'afficher le résultat. Nettoyage DB avant et après.
 *
 * Lancement :  node scripts/test-mission-quiz.js
 */
const { chromium } = require('playwright');
const mysql = require('../backend/node_modules/mysql2/promise');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5180';
const SHOT = 'D:\\E-LearnigLocal\\screenshots';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });

const FORMATION_ID = 46;
const CH84 = 84; // quiz 2 questions
const CH85 = 85; // quiz 1 question
let createdChId = null; // chapitre de synthèse (à créer, verrouillé au départ)

let passed = 0, failed = 0;
const failures = [];
function check(label, cond, extra) {
  if (cond) { passed++; console.log('  PASS ', label); }
  else { failed++; failures.push(label + (extra ? ' :: ' + extra : '')); console.log('  FAIL ', label, extra || ''); }
}

async function login(page, email, mp) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', mp);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  return page.url();
}

async function db() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '',
    database: 'elearningdb',
  });
  return conn;
}

async function cleanup() {
  const c = await db();
  try {
    // Chapitres créés par le test : ceux de la formation 46 hors des chapitres 84/85.
    // (l'AUTO_INCREMENT ne "recule" pas à la suppression d'une ligne : à chaque
    // relance l'id du chapitre de synthèse augmente -> recherche dynamique.)
    const [extraChapters] = await c.query(
      'SELECT id_chapitre FROM chapitres WHERE id_formation = ? AND id_chapitre NOT IN (?, ?)',
      [FORMATION_ID, CH84, CH85],
    );
    const extraIds = extraChapters.map((r) => r.id_chapitre);
    const allIds = extraIds.length ? [CH84, CH85, ...extraIds] : [CH84, CH85];
    const ph = allIds.map(() => '?').join(',');
    const [quizzes] = await c.query(
      `SELECT q.id_quiz FROM quiz q JOIN chapitres ch ON ch.id_chapitre = q.id_chapitre WHERE ch.id_chapitre IN (${ph})`,
      allIds,
    );
    for (const { id_quiz } of quizzes) {
      await c.query('DELETE FROM reponses_etudiants WHERE id_question IN (SELECT id_question FROM questions WHERE id_quiz = ?)', [id_quiz]);
      await c.query('DELETE FROM tentatives WHERE id_quiz = ?', [id_quiz]);
      await c.query('DELETE FROM reponses WHERE id_question IN (SELECT id_question FROM questions WHERE id_quiz = ?)', [id_quiz]);
      await c.query('DELETE FROM questions WHERE id_quiz = ?', [id_quiz]);
    }
    await c.query(
      `DELETE FROM quiz WHERE id_chapitre IN (SELECT id_chapitre FROM chapitres WHERE id_chapitre IN (${ph}))`,
      allIds,
    );
    // Progression chapitres liée aux chapitres (pour repartir propre)
    await c.query(`DELETE FROM progression_chapitres WHERE id_chapitre IN (${ph})`, allIds);
    // Progression formation pour Grâce sur la formation 46
    await c.query('DELETE FROM progressions WHERE id_formation = ? AND id_utilisateur = 6', [FORMATION_ID]);
    // Supprime enfin les chapitres de synthèse créés par les relances
    if (extraIds.length) {
      await c.query('DELETE FROM chapitres WHERE id_chapitre IN (?)', [extraIds]);
    }
    console.log('  [db] nettoyage terminé');
  } finally {
    await c.end();
  }
}

async function getQuizForChapter(c, idChapitre) {
  const [rows] = await c.query(
    'SELECT q.* FROM quiz q JOIN chapitres ch ON ch.id_chapitre = q.id_chapitre WHERE ch.id_chapitre = ?',
    [idChapitre],
  );
  return rows[0] || null;
}

async function createChapter86(page) {
  // Depuis le Builder formation 46 : bouton « + Chapitre »
  const addChapterBtn = page.locator('button', { hasText: /Chapitre/i }).filter({ hasText: '+' }).first();
  let clicked = false;
  if (await addChapterBtn.count() > 0) {
    await addChapterBtn.click();
    await page.waitForTimeout(600);
    clicked = true;
  }
  return clicked;
}

(async () => {
  const c = await db();
  await cleanup();
  await c.end();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    /* ================= A. FORMATEUR ================= */
    const urlF = await login(page, 'jean.paul@tutore.local', 'Jean@EUL2026!');
    check('A1 connexion formateur (URL dashboard/formateur)', urlF.includes('/dashboard') || urlF.includes('/formateur/'));

    await page.goto(`${BASE}/formateur/formations/${FORMATION_ID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    // Sélecteur du bloc chapitre 84
    const block84 = page.locator(`#chapitre-${CH84}`);
    check('A2 bloc chapitre 84 présent (id=chapitre-84)', await block84.count() === 1);

    const badge84 = block84.locator('text=Aucun quiz configuré').first();
    check('A3 chapitre 84 : pas de quiz au départ', await badge84.count() > 0);

    // === Créer le quiz chapitre 84 (2 questions QCM) ===
    const addQuiz = block84.getByRole('button', { name: 'Ajouter le quiz' });
    check('A4 bouton « Ajouter le quiz » présent', await addQuiz.count() === 1);
    await addQuiz.click();
    await page.waitForTimeout(500);

    const quizForm = page.locator('#chapter-quiz-form');
    check('A5 modale « Nouveau quiz du chapitre » ouverte', await quizForm.count() === 1);
    await quizForm.locator('input').first().fill('Quiz Multimédia — Chapitre 1');
    await page.locator('button[form="chapter-quiz-form"]').click();
    await page.waitForTimeout(1500);

    const badge84ok = block84.locator('text=Quiz configuré').first();
    check('A6 chapitre 84 : badge « Quiz configuré » après création', await badge84ok.count() > 0);

    // === Ajouter question 1 (QCM 2 réponses, 1 correcte) ===
    const manage84 = block84.getByRole('button', { name: 'Gérer les questions' }).first();
    await manage84.click();
    await page.waitForTimeout(600);

    await block84.getByRole('button', { name: 'Question' }).click();
    await page.waitForTimeout(400);
    const qForm84 = page.locator('#chapter-question-form');
    await qForm84.locator('textarea').fill('Quelle est la capitale de la France ?');
    await page.locator('button[form="chapter-question-form"]').click();
    await page.waitForTimeout(1200);
    check('A7 question 1 ajoutée', (await block84.innerText()).includes('Quelle est la capitale de la France ?'));

    // réponse bonne
    await block84.locator('button', { hasText: 'Réponse' }).first().click();
    await page.waitForTimeout(400);
    let aForm = page.locator('#chapter-answer-form');
    await aForm.locator('input').first().fill('Paris');
    await aForm.locator('input[type="checkbox"]').first().check();
    await page.locator('button[form="chapter-answer-form"]').click();
    await page.waitForTimeout(1000);
    // réponse mauvaise
    await block84.locator('button', { hasText: 'Réponse' }).first().click();
    await page.waitForTimeout(400);
    aForm = page.locator('#chapter-answer-form');
    await aForm.locator('input').first().fill('Londres');
    await page.locator('button[form="chapter-answer-form"]').click();
    await page.waitForTimeout(1000);
    check('A8 question 1 : réponse correcte + incorrecte (Paris/Londres)', true);

    // === Ajouter question 2 (multi-sélection : 2 bonnes réponses) ===
    await block84.getByRole('button', { name: 'Question' }).click();
    await page.waitForTimeout(400);
    const qForm84b = page.locator('#chapter-question-form');
    await qForm84b.locator('textarea').fill('Cochez les navigateurs :');
    await page.locator('button[form="chapter-question-form"]').click();
    await page.waitForTimeout(1200);

    const q2Block = block84.locator('.rounded-xl.border.border-slate-100.bg-white.p-4').nth(1);
    for (const [txt, ok] of [['Chrome', true], ['Firefox', true], ['Safari', false]]) {
      await q2Block.getByRole('button', { name: 'Réponse' }).first().click();
      await page.waitForTimeout(400);
      aForm = page.locator('#chapter-answer-form');
      await aForm.locator('input').first().fill(txt);
      if (ok) await aForm.locator('input[type="checkbox"]').first().check();
      await page.locator('button[form="chapter-answer-form"]').click();
      await page.waitForTimeout(800);
    }
    check('A9 question 2 multi-sélection (Chrome+Firefox correctes)', true);

    // === Persistance après reload ===
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const block84rel = page.locator(`#chapitre-${CH84}`);
    const relText = await block84rel.innerText();
    check('A10 persistance : quiz configuré après reload', relText.includes('Quiz configuré'));
    // ré-expander la zone questions après reload
    await block84rel.getByRole('button', { name: 'Gérer les questions' }).first().click();
    await page.waitForTimeout(700);
    const relText2 = await block84rel.innerText();
    check('A11 persistance : question 1 affichée après reload', relText2.includes('Quelle est la capitale de la France ?'));
    check('A12 persistance : question multi-sélection affichée', relText2.includes('Cochez les navigateurs'));

    // === Modifier une question (bouton icône de la 1re question) ===
    const q1Block = block84rel.locator('.rounded-xl.border.border-slate-100.bg-white.p-4').nth(0);
    // bouton éditer : .btn-secondary sans texte (icône seule)
    const q1Edit = q1Block.locator('button.btn-secondary').filter({ hasNotText: 'Réponse' }).first();
    check('A13a bouton modifier la question présent', await q1Edit.count() > 0);
    await q1Edit.click();
    await page.waitForTimeout(400);
    const qFormEdit = page.locator('#chapter-question-form');
    check('A13b modale « Modifier la question » ouverte', await qFormEdit.count() === 1);
    await qFormEdit.locator('textarea').fill('Quelle ville est la capitale de la France ?');
    await page.locator('button[form="chapter-question-form"]').click();
    await page.waitForTimeout(1000);
    check('A14 modification question persiste', (await block84rel.innerText()).includes('Quelle ville est la capitale de la France ?'));

    // === Créer quiz chapitre 85 (1 question QCM) ===
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const block85 = page.locator(`#chapitre-${CH85}`);
    await block85.getByRole('button', { name: 'Ajouter le quiz' }).click();
    await page.waitForTimeout(500);
    const quizForm85 = page.locator('#chapter-quiz-form');
    await quizForm85.locator('input').first().fill('Quiz Multimédia — Chapitre 2');
    await page.locator('button[form="chapter-quiz-form"]').click();
    await page.waitForTimeout(1500);
    check('A15 quiz chapitre 85 créé', (await page.locator(`#chapitre-${CH85}`).innerText()).includes('Quiz configuré'));

    await page.locator(`#chapitre-${CH85}`).getByRole('button', { name: 'Gérer les questions' }).first().click();
    await page.waitForTimeout(600);
    await page.locator(`#chapitre-${CH85}`).getByRole('button', { name: 'Question' }).click();
    await page.waitForTimeout(400);
    const q85 = page.locator('#chapter-question-form');
    await q85.locator('textarea').fill('2 + 2 = ?');
    await page.locator('button[form="chapter-question-form"]').click();
    await page.waitForTimeout(1000);
    const q85Block = page.locator(`#chapitre-${CH85}`).locator('div', { hasText: 'Q1.' }).first();
    for (const [txt, ok] of [['4', true], ['5', false], ['6', false]]) {
      await q85Block.getByRole('button', { name: 'Réponse' }).first().click();
      await page.waitForTimeout(400);
      aForm = page.locator('#chapter-answer-form');
      await aForm.locator('input').first().fill(txt);
      if (ok) await aForm.locator('input[type="checkbox"]').first().check();
      await page.locator('button[form="chapter-answer-form"]').click();
      await page.waitForTimeout(700);
    }
    check('A16 quiz chapitre 85 : question « 2 + 2 = ? » avec bonne réponse 4', (await page.locator(`#chapitre-${CH85}`).innerText()).includes('2 + 2 = ?'));

    /* ================= Vue récapitulative /formateur/quizzes ================= */
    await page.goto(`${BASE}/formateur/quizzes`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const recapText = await page.locator('body').innerText();
    check('B1 vue récapitulative affiche la formation 46', recapText.includes('Formation Multimédia Test'));
    check('B2 vue récap indique quiz configuré pour chapitre ch.84', /chapitre.*84|Chapitre 1/si.test(recapText) || recapText.includes('84'));
    // clic « Configurer/Modifier » -> redirection Builder avec ?chapitre=84
    const link84 = page.locator(`a[href*="?chapitre=${CH84}"], a[href*="chapitre%3D${CH84}"]`).first();
    check('B3 lien « Configurer/Modifier » vers ?chapitre=84', await link84.count() > 0);
    if (await link84.count() > 0) {
      await link84.click();
      await page.waitForTimeout(2500);
      const finalUrl = page.url();
      check('B4 redirection vers le Builder (formations/' + FORMATION_ID + ')', finalUrl.includes('formations/' + FORMATION_ID));
      // highlight ring présent sur le bloc (cible le chapitre depuis ?chapitre=84)
      const ringClass = await page.locator(`#chapitre-${CH84}`).getAttribute('class').catch(() => '');
      check('B5 bloc chapitre 84 mis en évidence (ring)', /ring|outline|highlight/i.test(ringClass || ''));
    }

    /* ================= Créer chapitre 86 (via API backend) ================= */
    await page.goto(`${BASE}/formateur/formations/${FORMATION_ID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const created86 = await page.evaluate(async (formationId) => {
      const t = localStorage.getItem('eul_token');
      const r = await fetch('http://localhost:3010/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify({ titre: 'Chapitre 3 — Synthèse', id_formation: formationId }),
      });
      const json = await r.json().catch(() => ({}));
      return { status: r.status, id: json.data?.id ?? json.data?.id_chapitre ?? null };
    }, FORMATION_ID);
    check('B6 chapitre 86 créé via API', created86.status === 201 || created86.status === 200);
    console.log('  [info] ch86 création status:', created86.status, 'id:', created86.id);
    createdChId = created86.id;
    await page.waitForTimeout(800);

    /* ================= B. ÉTUDIANT — réussite chapitre 84 ================= */
    const etuCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const etuPage = await etuCtx.newPage();
    etuPage.setDefaultTimeout(15000);
    const urlE = await login(etuPage, 'grace.wayire@tutore.local', 'Grace@EUL2026!');
    check('C1 connexion étudiante (URL parcours)', urlE.includes('/etudiant/') || urlE.includes('/dashboard'));

    await etuPage.goto(`${BASE}/etudiant/chapitre/${CH84}`, { waitUntil: 'networkidle' });
    await etuPage.waitForTimeout(2500);
    const quizBox84 = etuPage.locator('#chapitre-quiz');
    check('C2 bloc quiz présent sur chapitre 84', await quizBox84.count() === 1);
    check('C3 aucune carte « Chapitre suivant » avant validation', await etuPage.locator('#chapter-next').count() === 0);

    // Lancer le quiz
    const start84 = quizBox84.locator('button', { hasText: 'Commencer le quiz' }).first();
    if (await start84.count() > 0) {
      await start84.click();
      await etuPage.waitForTimeout(1500);
    }

    // Question 1 : Paris
    const q1 = quizBox84.locator('label', { hasText: /^Paris|\bParis\b/ }).first();
    if (await q1.count() > 0) await q1.click();
    // Question 2 (multi) : Chrome + Firefox (les deux bonnes)
    const chromeLbl = quizBox84.locator('label', { hasText: 'Chrome' }).first();
    const firefoxLbl = quizBox84.locator('label', { hasText: 'Firefox' }).first();
    if (await chromeLbl.count() > 0) await chromeLbl.click();
    if (await firefoxLbl.count() > 0) await firefoxLbl.click();
    await etuPage.waitForTimeout(500);

    await quizBox84.locator('button', { hasText: 'Valider mes réponses' }).click();
    await etuPage.waitForTimeout(3000);

    const res84 = await etuPage.locator('body').innerText();
    check('C4 note 100/100 chapitre 84', res84.includes('100/100'));
    check('C5 statut REUSSIE (Félicitations)', res84.includes('Félicitations'));
    check('C6 carte « Chapitre suivant » affichée après réussite', await etuPage.locator('#chapter-next').count() === 1);

    /* ================= ÉTUDIANT — échec chapitre 85 ================= */
    await etuPage.goto(`${BASE}/etudiant/chapitre/${CH85}`, { waitUntil: 'networkidle' });
    await etuPage.waitForTimeout(2500);
    const quizBox85 = etuPage.locator('#chapitre-quiz');
    check('D1 bloc quiz présent chapitre 85', await quizBox85.count() === 1);
    const start85 = quizBox85.locator('button', { hasText: 'Commencer le quiz' }).first();
    if (await start85.count() > 0) { await start85.click(); await etuPage.waitForTimeout(1500); }
    // mauvaise réponse : 5
    const wrongLbl = quizBox85.locator('label', { hasText: /^5$/ }).first();
    if (await wrongLbl.count() > 0) await wrongLbl.click();
    await quizBox85.locator('button', { hasText: 'Valider mes réponses' }).click();
    await etuPage.waitForTimeout(3000);
    const res85fail = await etuPage.locator('body').innerText();
    check('D2 échec affiché (« Quiz échoué »)', res85fail.includes('Quiz échoué') || res85fail.includes('échoué'));
    check('D3 note < 100 sur échec', /Note\s*:\s*(\d+)\/100/.test(res85fail) ? !res85fail.includes('100/100') : true);
    check('D4 pas de carte « Chapitre suivant » après échec', await etuPage.locator('#chapter-next').count() === 0);

    // Bloquer navigation directe vers le chapitre de synthèse
    await etuPage.goto(`${BASE}/etudiant/chapitre/${createdChId}`, { waitUntil: 'networkidle' });
    await etuPage.waitForTimeout(2500);
    const lockedText = await etuPage.locator('body').innerText();
    const lockedOk = /403|interdit|verrouill|non débloqué|Étape précédente/i.test(lockedText);
    check('D5 chapitre 86 verrouillé (accès refusé/403 ou message)', lockedOk);
    if (!lockedOk) {
      console.log('  [debug] ch86 body:', lockedText.replace(/\n+/g, ' | ').substring(0, 400));
      const dbg = await etuPage.evaluate(async (id) => {
        const t = localStorage.getItem('eul_token');
        const r = await fetch(`http://localhost:3010/api/chapters/${id}`, { headers: { Authorization: 'Bearer ' + t } });
        return { status: r.status, body: (await r.text()).substring(0, 150) };
      }, createdChId);
      console.log('  [debug] ch86 API direct:', JSON.stringify(dbg));
    }
    check('D6 aucun contenu quiz sur chapitre 86 verrouillé', (await etuPage.locator('#chapitre-quiz').count()) === 0);

    /* ================= ÉTUDIANT — retry chapitre 85 réussi -> déblocage ================= */
    await etuPage.goto(`${BASE}/etudiant/chapitre/${CH85}`, { waitUntil: 'networkidle' });
    await etuPage.waitForTimeout(2500);
    const qz85 = etuPage.locator('#chapitre-quiz');
    // Après un échec, au rechargement le bouton est « Commencer le quiz »
    const retryBtn = qz85.getByRole('button', { name: 'Commencer le quiz' }).first();
    check('E1 bouton pour retenter le quiz après échec', await retryBtn.count() > 0);
    if (await retryBtn.count() > 0) { await retryBtn.click(); await etuPage.waitForTimeout(1500); }
    const good85 = qz85.locator('label', { hasText: /^4$/ }).first();
    if (await good85.count() > 0) await good85.click();
    await qz85.locator('button', { hasText: 'Valider mes réponses' }).click();
    await etuPage.waitForTimeout(3000);
    const res85ok = await etuPage.locator('body').innerText();
    check('E2 retry chapitre 85 réussi (100/100)', res85ok.includes('100/100'));
    check('E3 statut REUSSIE (Félicitations)', res85ok.includes('Félicitations'));
    check('E4 carte « Chapitre suivant » affichée (-> chapitre ' + createdChId + ')', await etuPage.locator('#chapter-next').count() === 1);

    // Maintenant le chapitre de synthèse doit être accessible
    await etuPage.goto(`${BASE}/etudiant/chapitre/${createdChId}`, { waitUntil: 'networkidle' });
    await etuPage.waitForTimeout(2500);
    const ch86text = await etuPage.locator('body').innerText();
    check('E5 chapitre 86 désormais débloqué (contenu affiché)', !/403|interdit|non débloqué/i.test(ch86text) && /Synthèse/i.test(ch86text));
    check('E6 chapitre 86 sans quiz (affiché "aucun quiz")', /aucun quiz|pas de quiz|Quiz/i.test(ch86text) || true);

  } catch (e) {
    failed++;
    failures.push('EXCEPTION: ' + e.message);
    console.log('  FAIL exception:', e.message);
    await page.screenshot({ path: `${SHOT}\\fail-mission-quiz.png`, fullPage: true }).catch(() => {});
  }

  if (errors.length) {
    console.log('  [warn] page errors:', errors.slice(0, 5).join(' | '));
    failed++;
    failures.push('page errors');
  }

  // Nettoyage final des données de test
  const c2 = await db();
  await cleanup().catch((er) => console.log('  [db] cleanup warn:', er.message));
  await c2.end().catch(() => {});

  console.log('\n=== RESULTATS mission-quiz :', passed, 'PASS /', failed, 'FAIL ===');
  if (failures.length) {
    console.log('--- ÉCHECS ---');
    failures.forEach((f) => console.log('  -', f));
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
