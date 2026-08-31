/**
 * TEST — Catalogue Étudiant : catégories visibles + filtrage fonctionnel.
 *
 * - connexion étudiante (grace.wayire@tutore.local) ;
 * - ouverture /etudiant/catalogue ;
 * - vérification que CHAQUE carte de formation affiche un badge de catégorie
 *   (auparavant absent : le backend ne renvoyait que nom_categorie ;
 *   désormais decorate() ajoute « categorie ») ;
 * - filtre « Toutes les catégories » -> une catégorie -> liste réduite ;
 * - retour à « Toutes les catégories » -> liste complète.
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
    if (msg.type() === 'error' && !/favicon/.test(msg.text()))
      console.log('  CONSOLE ERROR:', msg.text().substring(0, 200));
  });

  try {
    const url = await login(page, 'grace.wayire@tutore.local', 'Grace@EUL2026!');
    check('connexion étudiante', url.includes('/etudiant/') || url.includes('/dashboard'));

    await page.goto(`${BASE}/etudiant/catalogue`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const select = page.locator('select');
    check('filtre de catégories présent', await select.count() === 1);
    const options = await select.locator('option').evaluateAll((els) => els.map((o) => o.textContent.trim()));
    const realCats = options.slice(1);
    check('au moins 2 catégories en base', realCats.length >= 2);
    console.log('  catégories:', realCats.join(' | '));

    const cards = page.locator('div.card-hover');
    const nbCards = await cards.count();
    check('des formations publiées affichées', nbCards >= 2);

    const badges = await cards.evaluateAll(
      (els, cats) => els.map((c) => {
        const badge = [...c.querySelectorAll('span.rounded-full')]
          .map((s) => s.textContent.trim())
          .find((t) => cats.includes(t));
        return badge ?? null;
      }),
      realCats,
    );
    console.log('  badges de catégorie:', badges.join(' | '));
    check('chaque carte affiche un badge de catégorie', badges.every((b) => b !== null));

    // Filtre vers la 1re catégorie réelle
    await select.selectOption({ label: realCats[0] });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOT}\\catalogue-filtre.png`, fullPage: true });
    const nbAfter = await page.locator('div.card-hover').count();
    const afterBadges = await page.locator('div.card-hover').evaluateAll(
      (els, cat) => els.map((c) =>
        [...c.querySelectorAll('span.rounded-full')]
          .map((s) => s.textContent.trim())
          .find((t) => t === cat) ?? null,
      ),
      realCats[0],
    );
    check(`filtre « ${realCats[0]} » -> liste réduite`, nbAfter > 0 && nbAfter < nbCards);
    check(`cartes filtrées = uniquement « ${realCats[0]} »`, afterBadges.every((b) => b === realCats[0]));

    // Retour à toutes
    await select.selectOption({ label: options[0].trim() });
    await page.waitForTimeout(1500);
    const nbAll = await page.locator('div.card-hover').count();
    check('retour à « Toutes les catégories » -> liste complète', nbAll === nbCards);

    await page.screenshot({ path: `${SHOT}\\catalogue-categories.png`, fullPage: true });
  } catch (e) {
    failed++;
    console.log('  FAIL exception:', e.message);
    await page.screenshot({ path: `${SHOT}\\fail-catalogue.png`, fullPage: true }).catch(() => {});
  }

  if (errors.length) { failed++; console.log('  FAIL page errors:', errors.length); }
  console.log('\n=== RESULTATS catalogue :', passed, 'PASS /', failed, 'FAIL ===');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();