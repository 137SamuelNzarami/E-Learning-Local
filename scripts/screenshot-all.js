const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5180';
const OUT = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function loginAndTest(ctx, email, password, role, routes) {
  const page = await ctx.newPage();
  console.log(`\n=== ${role} ===`);
  
  // Go to login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Fill login form
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForTimeout(3000);
  const url = page.url();
  console.log(`  After login: ${url}`);
  await page.screenshot({ path: path.join(OUT, `${role.toLowerCase()}-01-dashboard.png`), fullPage: false });
  
  // Navigate to each route
  for (let i = 0; i < routes.length; i++) {
    const [route, name] = routes[i];
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`  ${route} -> ${currentUrl}`);
    await page.screenshot({ path: path.join(OUT, `${role.toLowerCase()}-${String(i+2).padStart(2,'0')}-${name}.png`), fullPage: false });
  }
  
  return page;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ADMIN
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await loginAndTest(adminCtx, 'samuel.nzarami@tutore.local', 'Admin@EUL2026!', 'Admin', [
    ['/admin/users', 'users'],
    ['/admin/formations', 'formations'],
    ['/admin/categories', 'categories'],
    ['/admin/reviews', 'reviews'],
    ['/admin/progressions', 'progressions'],
    ['/admin/notifications', 'notifications'],
    ['/admin/conversations', 'conversations'],
  ]);
  await adminCtx.close();

  // FORMATEUR
  const formCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await loginAndTest(formCtx, 'jean.paul@tutore.local', 'Jean@EUL2026!', 'Formateur', [
    ['/formateur/formations', 'formations'],
    ['/formateur/formations/1', 'builder'],
    ['/formateur/quizzes', 'quizzes'],
    ['/formateur/corrections', 'corrections'],
  ]);
  await formCtx.close();

  // ETUDIANT
  const etuCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const etuPage = await loginAndTest(etuCtx, 'grace.wayire@tutore.local', 'Grace@EUL2026!', 'Etudiant', [
    ['/etudiant/catalogue', 'catalogue'],
    ['/etudiant/parcours', 'parcours'],
    ['/etudiant/formation/1', 'formation'],
    ['/etudiant/chapitre/1', 'chapitre'],
    ['/etudiant/quiz/1', 'quiz'],
    ['/etudiant/tentatives', 'tentatives'],
  ]);
  await etuCtx.close();

  // MOBILE
  const mobCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await loginAndTest(mobCtx, 'grace.wayire@tutore.local', 'Grace@EUL2026!', 'Mobile', [
    ['/etudiant/catalogue', 'catalogue'],
    ['/etudiant/chapitre/1', 'chapitre'],
  ]);
  await mobCtx.close();

  await browser.close();
  console.log('\nAll screenshots saved to', OUT);
})();
