/**
 * TEST — Quiz QCM : correction 100% automatique (sans LIBRE, sans A_CORRIGER).
 *
 * Scénario (compte réel) :
 * - connexion étudiante (grace.wayire@tutore.local) ;
 * - ouverture du chapitre 5 (formation « JavaScript pour débutants », accessible
 *   car chapitre 4 validé) qui possède le quiz 5 (1 question QCM, 1 pt) ;
 * - démarrage du quiz, vérification qu'aucun « Réponse libre » ne s'affiche ;
 * - bonne réponse (Q11 → id 26 « function ») ;
 * - soumission → note 100/100, statut REUSSIE immédiat, aucune mention
 *   « À corriger » / « En attente de correction ».
 *
 * Lancement :  node scripts/test-quiz-qcm.js
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:5180';
const SHOT = 'D:\\E-LearnigLocal\\screenshots';
const fs = require('fs');
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });

let passed = 0, failed = 0;
function check(label, cond) {
  if (cond) { passed++; console.log('  PASS ', label); }
  else { failed++; console.log('  FAIL ', label); }
}

async function login(page, email, mp) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', mp);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  return page.url();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && !/429/.test(msg.text()) && !/favicon/.test(msg.text()))
      console.log('  CONSOLE ERROR:', msg.text().substring(0, 200));
  });

  try {
    const url = await login(page, 'grace.wayire@tutore.local', 'Grace@EUL2026!');
    check('connexion étudiante (URL parcours/catalogue)', url.includes('/etudiant/') || url.includes('/dashboard'));

    await page.goto(`${BASE}/etudiant/chapitre/5`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const quizBox = page.locator('#chapitre-quiz');
    check('bloc quiz présent en fin de chapitre', await quizBox.count() === 1);

    const pageText = await page.locator('body').innerText().catch(() => '');
    check("aucune mention « Réponse libre »", !pageText.includes('Réponse libre'));
    check("aucune mention « À corriger »", !pageText.includes('À corriger'));

    const startBtn = quizBox.locator('button', { hasText: 'Commencer le quiz' }).first();
    if (await startBtn.count() === 0) {
      // Quiz déjà REUSSIE lors d'un passage précédent : le bouton ne se relance pas.
      // On accepte l'absence tant que l'API confirme un historique REUSSIE.
      const histBefore = await page.evaluate(async (idQuiz) => {
        const token = localStorage.getItem('eul_token');
        const res = await fetch(`http://localhost:3010/api/attempts/quiz/${idQuiz}/mine`, { headers: { Authorization: 'Bearer ' + token } });
        if (!res.ok) return null;
        return res.json();
      }, 5);
      const dejaReussi = histBefore && histBefore.data && histBefore.data.tentatives.some((t) => t.statut === 'REUSSIE');
      check('bouton « Commencer le quiz » (déjà réussi, non relancé)', dejaReussi);
    } else {
      check('bouton « Commencer le quiz » disponible', true);
      await startBtn.click();
      await page.waitForTimeout(2000);

      const answerPhase = quizBox.locator('[contenteditable="true"]').first();
      const qcmCount = await quizBox.locator('input[type="checkbox"]').count();
      check('questions QCM rendues (cases à cocher)', qcmCount > 0);

      const body2 = await page.locator('body').innerText().catch(() => '');
      check('aucune zone « Rédigez votre réponse » (LIBRE)', !body2.includes('Rédigez votre réponse'));

      // coche la bonne réponse « function » (id_reponse 26)
      const goodLabel = quizBox.locator('label', { hasText: 'function' }).first();
      if (await goodLabel.count() > 0) {
        await goodLabel.click();
        await page.waitForTimeout(400);
      }
      check('bonne réponse cochée', await quizBox.locator('input[type="checkbox"]:checked').count() === 1);

      await quizBox.locator('button', { hasText: 'Valider mes réponses' }).click();
      await page.waitForTimeout(3000);

      const result = await page.locator('body').innerText().catch(() => '');
      check('résultat affiché « Félicitations »', result.includes('Félicitations'));
      check('note 100/100 affichée', result.includes('Note : 100/100'));
      check('statut REUSSIE (Chapitre validé)', result.includes('Chapitre validé'));
      check('aucune attente de correction', !result.includes('En attente de correction') && !result.includes('À corriger'));
    }

    // Historique après soumission
    const hist = await page.evaluate(async (idQuiz) => {
      const token = localStorage.getItem('eul_token');
      const res = await fetch(`http://localhost:3010/api/attempts/quiz/${idQuiz}/mine`, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) return null;
      return res.json();
    }, 5);
    check('historique API : dernier statut REUSSIE', hist && hist.data && hist.data.tentatives.some((t) => t.statut === 'REUSSIE'));
    check('historique API : aucune A_CORRIGER', !(hist && hist.data && hist.data.tentatives.some((t) => t.statut === 'A_CORRIGER')));

  } catch (e) {
    failed++;
    console.log('  FAIL exception:', e.message);
    await page.screenshot({ path: `${SHOT}\\fail-quiz-qcm.png`, fullPage: true }).catch(() => {});
  }

  if (errors.length) { failed++; console.log('  FAIL page errors:', errors.length); }
  console.log('\n=== RESULTATS quiz-qcm :', passed, 'PASS /', failed, 'FAIL ===');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();