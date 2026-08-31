const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('  CONSOLE:', msg.text().substring(0, 200)); });
  
  // Login as admin
  await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'samuel.nzarami@tutore.local');
  await page.fill('#mot_de_passe', 'Admin@EUL2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('After login URL:', page.url());
  
  // Check localStorage
  const token = await page.evaluate(() => localStorage.getItem('eul_token'));
  const user = await page.evaluate(() => localStorage.getItem('eul_user'));
  console.log('Token exists:', !!token, 'Token length:', token?.length);
  console.log('User:', user);
  
  // Now navigate to admin page
  await page.goto('http://localhost:5180/admin/users', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('\nAfter goto /admin/users URL:', page.url());
  
  const token2 = await page.evaluate(() => localStorage.getItem('eul_token'));
  console.log('Token still exists:', !!token2);
  
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body text:', bodyText.substring(0, 200));
  
  const url = page.url();
  console.log('Final URL:', url);
  
  console.log('\nPage errors:', errors.length);
  errors.forEach(e => console.log('  ', e.substring(0, 200)));
  
  await browser.close();
})();
