/**
 * PROBE — constat navigateur de l'état réel (non bloquant, pas de PASS/FAIL).
 * Affiche pour chaque rôle : URL post-login, liens du header/sidebar/footer,
 * et prend des captures. Utilisé uniquement pour l'audit d'architecture.
 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:5180';
const SHOT = 'D:\\E-LearnigLocal\\screenshots\\probe';
const fs = require('fs');
const players = [
  { role: 'admin', email: 'samuel.nzarami@tutore.local', mp: 'Admin@EUL2026!' },
  { role: 'formateur', email: 'jean.paul@tutore.local', mp: 'Jean@EUL2026!' },
  { role: 'etudiant', email: 'grace.wayire@tutore.local', mp: 'Grace@EUL2026!' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let which = 0;
  for (const p of players) {
    which++;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', p.email);
    await page.fill('#mot_de_passe', p.mp);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log(`\n========== ${p.role.toUpperCase()} — URL post-login : ${page.url()}`);
    const links = await page.evaluate(() => {
      const out = { header: [], nav: [], footer: [], buttons: [] };
      document.querySelectorAll('header a').forEach(a => out.header.push(`${a.textContent.trim().replace(/\s+/g, ' ')} -> ${a.getAttribute('href')}`));
      document.querySelectorAll('nav a').forEach(a => out.nav.push(`${a.textContent.trim().replace(/\s+/g, ' ')} -> ${a.getAttribute('href')}`));
      document.querySelectorAll('footer a').forEach(a => out.footer.push(`${a.textContent.trim().replace(/\s+/g, ' ')} -> ${a.getAttribute('href')}`));
      document.querySelectorAll('footer button, header button').forEach(b => out.buttons.push(b.textContent.trim().replace(/\s+/g, ' ')));
      return out;
    });
    for (const k of ['header', 'nav', 'footer', 'buttons']) {
      console.log(`--- ${k} ---`);
      (links[k] || []).filter(Boolean).forEach(l => console.log('   ', l));
    }
    await page.screenshot({ path: `${SHOT}-${which}-${p.role}.png`, fullPage: false });

    if (p.role === 'admin') {
      await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log('--- admin accès /profile -> final URL :', page.url());
      await page.screenshot({ path: `${SHOT}-admin-profile-redirect.png`, fullPage: false });
    }
    if (p.role === 'admin') {
      await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SHOT}-admin-390.png`, fullPage: false });
    }
    await ctx.close();
  }
  console.log('\nPROBE TERMINÉ.');
  await browser.close();
})();