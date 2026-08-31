const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('429')) errors.push('CONSOLE: ' + msg.text().substring(0, 150)); });

  await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#email', 'grace.wayire@tutore.local');
  await page.fill('#mot_de_passe', 'Grace@EUL2026!');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 15000 });
  console.log('Logged in as:', await page.locator('body').innerText().then(t => t.substring(0, 30).replace(/\n/g, ' ')));

  // Enumerate all chapters to find one with unanswered quiz
  const chapters = [2, 3, 4];
  for (const id of chapters) {
    await page.goto(`http://localhost:5180/etudiant/chapitre/${id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const title = await page.locator('h1').first().innerText().catch(() => '');
    const quizBtn = await page.locator('#chapitre-quiz button').allTextContents();
    console.log(`\n=== Chapitre ${id}: "${title}" | quiz buttons: ${JSON.stringify(quizBtn)}`);
    if (quizBtn.some(b => b.includes('Commencer') && !b.includes('Refaire'))) {
      console.log('>>> Found a chapter with unanswered quiz: chapitre', id);
      // Click through the quiz
      await page.locator('#chapitre-quiz button', { hasText: 'Commencer' }).first().click();
      await page.waitForTimeout(800);
      const qCount = await page.locator('#chapitre-quiz .question, #chapitre-quiz [class*=question], .quiz-question').count();
      console.log('Quiz started. Question containers:', qCount);
      const options = await page.locator('#chapitre-quiz label, #chapitre-quiz [class*=option]').allTextContents();
      console.log('Options sample:', options.length, '->', JSON.stringify(options.slice(0, 8)).substring(0, 300));
      // Check if there's a submit button
      const submitBtn = await page.locator('button', { hasText: 'Valider' }).count() || await page.locator('button', { hasText: 'Confirmer' }).count();
      console.log('Submit button found:', submitBtn > 0);
      break;
    }
  }

  console.log('\nPage errors:', errors.length);
  errors.forEach(e => console.log('  ', e.substring(0, 200)));
  await browser.close();
})();