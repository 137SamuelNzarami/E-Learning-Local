const { chromium } = require('playwright');

async function testMobile(email, password, route, label) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 15000 });
  await page.goto(`http://localhost:5180${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Open mobile menu (find hamburger button)
  const burger = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], header button').last();
  if (await burger.count()) {
    await burger.click();
    await page.waitForTimeout(800);
  }

  // Inspect nav link colors inside the drawer
  const colors = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a, [class*=drawer] a, aside a, header a'));
    const out = [];
    for (const a of links) {
      const cs = getComputedStyle(a);
      out.push({ text: a.innerText.substring(0, 20), color: cs.color, bg: a.closest('nav,header,aside')?.className?.substring(0, 80) });
    }
    return out;
  });
  const visible = colors.filter(c => c.text.trim());
  console.log(`\n=== ${label} (${email}) mobile nav ===`);
  visible.slice(0, 10).forEach(c => console.log(`   "${c.text}": color=${c.color}`));
  const darkCount = visible.filter(c => c.text.trim() && parseInt(c.color.match(/\d+/)[0]) < 120 && c.color !== 'rgba(0, 0, 0, 1)').length;
  console.log(`   Dark-contrast+ links on drawer: ${darkCount}`);

  await page.screenshot({ path: `D:/E-LearnigLocal/screenshots/mobile-${label}.png` });
  await browser.close();
}

(async () => {
  await testMobile('grace.wayire@tutore.local', 'Grace@EUL2026!', '/etudiant/parcours', 'etudiant');
  await testMobile('jean.paul@tutore.local', 'Jean@EUL2026!', '/formateur/formations', 'formateur');
})();