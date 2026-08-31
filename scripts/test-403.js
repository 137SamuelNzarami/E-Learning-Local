const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#email', 'grace.wayire@tutore.local');
  await page.fill('#mot_de_passe', 'Grace@EUL2026!');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 15000 });
  for (const id of [2, 3, 4]) {
    await page.goto(`http://localhost:5180/etudiant/chapitre/${id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
  }
  const counts = bad.reduce((a, u) => { a[u] = (a[u] || 0) + 1; return a; }, {});
  console.log('Requests >= 400:');
  Object.entries(counts).forEach(([u, n]) => console.log(`  ${n}x ${u}`));
  await browser.close();
})();