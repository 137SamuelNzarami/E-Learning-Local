const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().substring(0, 200)); });
  await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#email', 'grace.wayire@tutore.local');
  await page.fill('#mot_de_passe', 'Grace@EUL2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('URL after login:', page.url());
  const alerts = await page.locator('[role=alert], .alert, [class*=error], [class*=alert]').allTextContents();
  console.log('Alerts:', alerts);
  const bodyText = await page.locator('body').innerText();
  console.log('Body snippet:', bodyText.substring(0, 400));
  await browser.close();
})();