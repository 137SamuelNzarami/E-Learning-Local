/**
 * TEST — Interface Admin UNIFIÉE (une seule interface).
 *
 * - connexion administrateur (samuel.nzarami@tutore.local) ;
 * - vérification de la redirection vers /admin/dashboard ;
 * - présence du menu latéral Admin complet (nouvelle interface) ;
 * - les anciennes routes AppLayout deviennent inaccessibles pour l'admin :
 *   /dashboard, /notifications, /messagerie(+/conversation/:id), /profile ;
 * - absence de tout lien « étudiant / formateur » chez l'admin ;
 * - absence de « Mon profil » dans le header/footer admin.
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
    const url = await login(page, 'samuel.nzarami@tutore.local', 'Admin@EUL2026!');
    check('connexion admin + redirection /admin/dashboard', url === `${BASE}/admin/dashboard`);

    // Menu latéral de la NOUVELLE interface admin (nav dédiée)
    const sidebar = await page.locator('nav[aria-label="Navigation administration"]').innerText().catch(() => '');
    const menus = ['Utilisateurs', 'Formations', 'Catégories', 'Avis', 'Progressions', 'Notifications', 'Conversations'];
    for (const m of menus) check(`menu admin « ${m} » présent`, sidebar.includes(m));

    // Aucun menu « étudiant / formateur »
    check('absence du menu « Catalogue » (étudiant)', !sidebar.includes('Catalogue'));
    check('absence du menu « Mes formations » (formateur)', !sidebar.includes('Mes formations'));
    check('absence du menu « Corrections » (formateur)', !sidebar.includes('Corrections'));

    // Anciennes routes AppLayout : l'admin n'a plus accès
    const redirects = {
      '/dashboard': '/admin/dashboard',
      '/notifications': '/admin/notifications',
      '/messagerie': '/admin/conversations',
      '/messagerie/conversation/1': '/admin/conversations',
      '/profile': '/admin/profile',
    };
    for (const [from, to] of Object.entries(redirects)) {
      await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const cur = new URL(page.url()).pathname;
      check(`redirection ${from} -> ${to}`, cur === to);
    }

    // Header admin : pas de « Mon profil », pas de lien étudiant/formateur
    const header = await page.locator('header').innerText().catch(() => '');
    check("header admin : pas de « Mon profil »", !header.includes('Mon profil'));

    // Footer admin (liens de repli)
    const footer = await page.locator('footer').innerText().catch(() => '');
    check('footer admin présent', footer.length > 0);
    check('footer admin : pas de lien dupliqué étudiant/formateur', !footer.includes('Catalogue') && !footer.includes('Mes formations'));

    await page.screenshot({ path: `${SHOT}\\admin-unifie.png`, fullPage: true });
  } catch (e) {
    failed++;
    console.log('  FAIL exception:', e.message);
    await page.screenshot({ path: `${SHOT}\\fail-admin-unifie.png`, fullPage: true }).catch(() => {});
  }

  if (errors.length) { failed++; console.log('  FAIL page errors:', errors.length); }
  console.log('\n=== RESULTATS admin-unifie :', passed, 'PASS /', failed, 'FAIL ===');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();