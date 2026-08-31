const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5180';

async function testPage(ctx, email, password, routes) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  const results = [];
  for (const route of routes) {
    errors.length = 0;
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);
    
    const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
    const hasContent = text.length > 10;
    results.push({
      route,
      url: page.url(),
      hasContent,
      errors: errors.filter(e => !e.includes('Warning:')),
      text: text.substring(0, 100)
    });
    if (errors.length > 0) {
      console.log(`  ERRORS at ${route}:`, errors.filter(e => !e.includes('Warning:')).join('\n  '));
    }
  }
  await page.close();
  return results;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('\n=== ADMIN PAGES ===');
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminResults = await testPage(adminCtx, 'samuel.nzarami@tutore.local', 'Admin@EUL2026!', [
    '/admin/dashboard', '/admin/users', '/admin/formations', '/admin/categories',
    '/admin/reviews', '/admin/progressions', '/admin/notifications', '/admin/conversations'
  ]);
  adminResults.forEach(r => console.log(`  ${r.route}: ${r.hasContent ? 'OK' : 'BLANK'} | ${r.text.substring(0, 80)}`));
  await adminCtx.close();

  console.log('\n=== FORMATEUR PAGES ===');
  const formCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const formResults = await testPage(formCtx, 'jean.paul@tutore.local', 'Jean@EUL2026!', [
    '/formateur/formations', '/formateur/formations/1', '/formateur/quizzes', '/formateur/corrections'
  ]);
  formResults.forEach(r => console.log(`  ${r.route}: ${r.hasContent ? 'OK' : 'BLANK'} | ${r.text.substring(0, 80)}`));
  await formCtx.close();

  console.log('\n=== ETUDIANT PAGES ===');
  const etuCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const etuResults = await testPage(etuCtx, 'grace.wayire@tutore.local', 'Grace@EUL2026!', [
    '/etudiant/catalogue', '/etudiant/parcours', '/etudiant/formation/1',
    '/etudiant/chapitre/1', '/etudiant/tentatives'
  ]);
  etuResults.forEach(r => console.log(`  ${r.route}: ${r.hasContent ? 'OK' : 'BLANK'} | ${r.text.substring(0, 80)}`));
  await etuCtx.close();

  await browser.close();
  console.log('\nDone');
})();
