const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  // Login as etudiant
  await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#email', 'grace.wayire@tutore.local');
  await page.fill('#mot_de_passe', 'Grace@EUL2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('After login:', page.url());
  
  // Go to tentatives
  await page.goto('http://localhost:5180/etudiant/tentatives', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('Tentatives URL:', page.url());
  console.log('Page title:', await page.title());
  
  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('Body inner text (first 500):', await page.evaluate(() => document.body.innerText.substring(0, 500)));
  console.log('Body innerHTML (first 1000):', await page.evaluate(() => document.body.innerHTML.substring(0, 1000)));
  
  console.log('\nConsole errors:');
  errors.forEach(e => console.log('  ERROR:', e));
  
  await browser.close();
})();
