const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('429')) errors.push('CONSOLE: ' + msg.text().substring(0, 150)); });

  // Login as student
  await page.goto('http://localhost:5180/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#email', 'grace.wayire@tutore.local');
  await page.fill('#mot_de_passe', 'Grace@EUL2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('Login URL:', page.url());

  // Go to chapter 2 (has sections + sous-sections + quiz)
  await page.goto('http://localhost:5180/etudiant/chapitre/1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  
  console.log('\n=== CHAPTER PAGE - URL:', page.url());
  
  // Check what content is rendered - all sous-sections should be on one page
  const content = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.innerText;
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.innerText.substring(0, 60));
    const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.innerText.substring(0, 60));
    const pCount = document.querySelectorAll('p').length;
    const quizSection = document.getElementById('chapitre-quiz');
    const sousSections = document.querySelectorAll('[id^="sous-section-"]');
    const sectionsRendered = document.querySelectorAll('[id^="section-"]');
    const totalContent = document.body.innerText.length;
    return { h1, h2s, h3s, pCount, hasQuiz: !!quizSection, sousSections: sousSections.length, sectionsRendered: sectionsRendered.length, totalContent };
  });
  console.log('H1:', content.h1);
  console.log('H2s:', JSON.stringify(content.h2s));
  console.log('H3s:', JSON.stringify(content.h3s));
  console.log('Paragraphs:', content.pCount);
  console.log('Quiz section present:', content.hasQuiz);
  console.log('Sous-sections rendered:', content.sousSections);
  console.log('Sections rendered:', content.sectionsRendered);
  console.log('Total text length:', content.totalContent);
  
  // Check if content has actual rich text content rendered
  const hasRichContent = await page.evaluate(() => {
    const rte = document.querySelector('.rte-content');
    return rte ? rte.innerText.substring(0, 200) : 'NO RTE';
  });
  console.log('Rich content sample:', hasRichContent);
  
  // Test scroll to sous-section via sidebar
  console.log('\n=== SCROLL TEST ===');
  const sidebarBtn = page.locator('aside button').first();
  if (await sidebarBtn.count()) {
    await sidebarBtn.click();
    await page.waitForTimeout(1500);
    const scrolled = await page.evaluate(() => window.scrollY);
    console.log('After sidebar click, scrollY:', scrolled);
  }
  
  // Check quiz button
  const quizBtn = page.locator('#chapitre-quiz button', { hasText: 'Commencer' });
  if (await quizBtn.count()) {
    console.log('Quiz start button found');
  } else {
    console.log('Quiz button states found:', await page.locator('#chapitre-quiz button').allTextContents());
  }
  
  console.log('\nPage errors:', errors.length);
  errors.forEach(e => console.log('  ', e.substring(0, 200)));
  
  // Take a screenshot
  await page.screenshot({ path: 'D:/E-LearnigLocal/screenshots/chapitre-1-full.png', fullPage: true });
  console.log('\nScreenshot saved');

  await browser.close();
})();