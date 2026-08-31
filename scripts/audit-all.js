const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5180';
const OUT = path.join(__dirname, '..', 'test-results');
fs.mkdirSync(OUT, { recursive: true });

const results = {};

async function login(ctx, email, password) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  return page;
}

async function audit(page, label) {
  const data = await page.evaluate(() => {
    const getLinks = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { found: false, links: [], text: '' };
      const anchors = el.querySelectorAll('a[href]');
      return {
        found: true,
        text: el.innerText.substring(0, 500),
        links: Array.from(anchors).map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim().substring(0, 50) }))
      };
    };
    
    // Get all nav links in the page
    const allLinks = Array.from(document.querySelectorAll('a[href]')).map(a => ({
      href: a.getAttribute('href'),
      text: a.innerText.trim().substring(0, 50)
    })).filter(l => l.href && l.href.startsWith('/'));
    
    // Check for layout structure
    const hasSidebar = !!document.querySelector('[class*="sidebar"], aside, nav');
    const hasHeader = !!document.querySelector('header');
    const hasFooter = !!document.querySelector('footer');
    
    // Get main content text
    const main = document.querySelector('main, [role="main"], .main-content');
    const mainText = main ? main.innerText.substring(0, 1000) : 'NO MAIN FOUND';
    
    // Get body classes  
    const bodyClasses = document.body.className;
    
    // Check for old patterns
    const hasOldHeader = !!document.querySelector('[class*="legacy"], .old-header');
    
    // Check all visible text for role mixing
    const bodyText = document.body.innerText.substring(0, 3000);
    
    return {
      url: window.location.href,
      title: document.title,
      allLinks,
      hasSidebar,
      hasHeader,
      hasFooter,
      mainText,
      bodyClasses,
      bodyText
    };
  });
  
  results[label] = data;
  console.log(`\n=== ${label} ===`);
  console.log(`URL: ${data.url}`);
  console.log(`Has sidebar: ${data.hasSidebar}, Header: ${data.hasHeader}, Footer: ${data.hasFooter}`);
  console.log(`Links on page: ${data.allLinks.length}`);
  console.log('All links:', JSON.stringify(data.allLinks, null, 2));
  console.log('Main content (first 500):', data.mainText.substring(0, 500));
  return data;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ===== ADMIN =====
  console.log('\n\n========== ADMIN AUDIT ==========');
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await login(adminCtx, 'samuel.nzarami@tutore.local', 'Admin@EUL2026!');
  await audit(adminPage, 'ADMIN-DASHBOARD');
  
  // Check dashboard quick links
  const dashData = await adminPage.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links.map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim().substring(0, 60) })).filter(l => l.href && l.href.startsWith('/'));
  });
  console.log('\nDashboard links:', JSON.stringify(dashData, null, 2));
  
  // Now check admin pages for student menu leakage
  await adminPage.goto(`${BASE}/admin/users`);
  await adminPage.waitForTimeout(1500);
  const usersAudit = await audit(adminPage, 'ADMIN-USERS');
  
  await adminPage.goto(`${BASE}/admin/formations`);
  await adminPage.waitForTimeout(1500);
  await audit(adminPage, 'ADMIN-FORMATIONS');

  // Check if footer has student links
  const footerCheck = await adminPage.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return 'NO FOOTER';
    return { text: footer.innerText, links: Array.from(footer.querySelectorAll('a')).map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim() })) };
  });
  console.log('\nFooter content:', JSON.stringify(footerCheck, null, 2));
  
  await adminCtx.close();

  // ===== FORMATEUR =====
  console.log('\n\n========== FORMATEUR AUDIT ==========');
  const formCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const formPage = await login(formCtx, 'jean.paul@tutore.local', 'Jean@EUL2026!');
  await audit(formPage, 'FORMATEUR-DASHBOARD');
  
  await formPage.goto(`${BASE}/formateur/formations`);
  await formPage.waitForTimeout(1500);
  await audit(formPage, 'FORMATEUR-FORMATIONS');
  
  await formPage.goto(`${BASE}/formateur/formations/1`);
  await formPage.waitForTimeout(1500);
  await audit(formPage, 'FORMATEUR-BUILDER');

  const formFooter = await formPage.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return 'NO FOOTER';
    return { text: footer.innerText.substring(0, 300), links: Array.from(footer.querySelectorAll('a')).map(a => a.getAttribute('href')) };
  });
  console.log('\nFormateur Footer:', JSON.stringify(formFooter, null, 2));

  await formCtx.close();

  // ===== ETUDIANT =====
  console.log('\n\n========== ETUDIANT AUDIT ==========');
  const etuCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const etuPage = await login(etuCtx, 'grace.wayire@tutore.local', 'Grace@EUL2026!');
  await audit(etuPage, 'ETUDIANT-DASHBOARD');
  
  await etuPage.goto(`${BASE}/etudiant/catalogue`);
  await etuPage.waitForTimeout(1500);
  await audit(etuPage, 'ETUDIANT-CATALOGUE');
  
  await etuPage.goto(`${BASE}/etudiant/chapitre/1`);
  await etuPage.waitForTimeout(1500);
  const chapAudit = await audit(etuPage, 'ETUDIANT-CHAPITRE');
  
  // Check chapitre page structure - does it show ALL sections on one page?
  const chapStructure = await etuPage.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    return headings.map(h => ({ tag: h.tagName, text: h.innerText.trim().substring(0, 80) }));
  });
  console.log('\nChapitre headings:', JSON.stringify(chapStructure, null, 2));
  
  await etuPage.goto(`${BASE}/etudiant/tentatives`);
  await etuPage.waitForTimeout(1500);
  const tentAudit = await audit(etuPage, 'ETUDIANT-TENTATIVES');
  
  const etuFooter = await etuPage.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return 'NO FOOTER';
    return { text: footer.innerText.substring(0, 300), links: Array.from(footer.querySelectorAll('a')).map(a => a.getAttribute('href')) };
  });
  console.log('\nEtudiant Footer:', JSON.stringify(etuFooter, null, 2));
  
  // Check nav mixing
  const navCheck = await etuPage.evaluate(() => {
    const allNavLinks = Array.from(document.querySelectorAll('a[href]'));
    const studentLinks = allNavLinks.filter(a => a.getAttribute('href')?.includes('/etudiant/')).map(a => a.getAttribute('href'));
    const adminLinks = allNavLinks.filter(a => a.getAttribute('href')?.includes('/admin/')).map(a => a.getAttribute('href'));
    const formateurLinks = allNavLinks.filter(a => a.getAttribute('href')?.includes('/formateur/')).map(a => a.getAttribute('href'));
    return { studentLinks, adminLinks, formateurLinks };
  });
  console.log('\nEtudiant page role mixing:', JSON.stringify(navCheck, null, 2));

  await etuCtx.close();
  await browser.close();
  
  // Write full results
  fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(results, null, 2));
  console.log('\n\nFull audit saved to', path.join(OUT, 'audit.json'));
})();
