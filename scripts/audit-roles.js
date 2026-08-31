const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5180';
const OUT = path.join(__dirname, '..', 'test-results');
fs.mkdirSync(OUT, { recursive: true });

async function auditRole(browser, email, password, role, routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const results = [];
  
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log(`\n=== ${role} ===`);
  console.log(`Login URL: ${page.url()}`);
  
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);
    
    const data = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim().substring(0, 40) }))
        .filter(l => l.href && l.href.startsWith('/'));
      const footer = document.querySelector('footer');
      const header = document.querySelector('header');
      return {
        url: location.href,
        links,
        footerText: footer ? footer.innerText.substring(0, 300) : 'NO FOOTER',
        headerLinks: header ? Array.from(header.querySelectorAll('a[href]')).map(a => a.getAttribute('href')) : [],
        bodyText: document.body.innerText.substring(0, 800)
      };
    });
    
    const studentLinks = data.links.filter(l => l.href.includes('/etudiant/'));
    const adminLinks = data.links.filter(l => l.href.includes('/admin/'));
    const formateurLinks = data.links.filter(l => l.href.includes('/formateur/'));
    
    results.push({
      route,
      url: data.url,
      studentLinks: studentLinks.map(l => l.href),
      adminLinks: adminLinks.map(l => l.href),
      formateurLinks: formateurLinks.map(l => l.href),
      firstLines: data.bodyText.substring(0, 150)
    });
  }
  
  await ctx.close();
  return results;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const admin = await auditRole(browser, 'samuel.nzarami@tutore.local', 'Admin@EUL2026!', 'ADMIN', [
    '/admin/dashboard', '/admin/users', '/admin/formations', '/admin/categories',
    '/admin/reviews', '/admin/progressions', '/admin/notifications', '/admin/conversations'
  ]);
  admin.forEach(r => console.log(`  ${r.route}:\n    URL: ${r.url}\n    student:${r.studentLinks.length} admin:${r.adminLinks.length} formateur:${r.formateurLinks.length}`));

  const formateur = await auditRole(browser, 'jean.paul@tutore.local', 'Jean@EUL2026!', 'FORMATEUR', [
    '/formateur/formations', '/formateur/formations/1', '/formateur/quizzes', '/formateur/corrections'
  ]);
  formateur.forEach(r => console.log(`  ${r.route}:\n    URL: ${r.url}\n    student:${r.studentLinks.length} admin:${r.adminLinks.length} formateur:${r.formateurLinks.length}`));

  const etudiant = await auditRole(browser, 'grace.wayire@tutore.local', 'Grace@EUL2026!', 'ETUDIANT', [
    '/etudiant/catalogue', '/etudiant/parcours', '/etudiant/formation/1', '/etudiant/chapitre/1', '/etudiant/tentatives'
  ]);
  etudiant.forEach(r => console.log(`  ${r.route}:\n    URL: ${r.url}\n    student:${r.studentLinks.length} admin:${r.adminLinks.length} formateur:${r.formateurLinks.length}`));

  await browser.close();
})();