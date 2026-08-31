const { chromium } = require('playwright');

const BASE = 'http://localhost:5180';
const SHOT = 'D:\\E-LearnigLocal\\screenshots';
const fs = require('fs');
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });

let passed = 0, failed = 0;
function check(label, cond) {
  if (cond) { passed++; console.log('  PASS', label); }
  else { failed++; console.log('  FAIL', label); }
}

async function login(page, email, mp) {
  for (let attempt = 1; attempt <= 16; attempt++) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', email);
    await page.fill('#mot_de_passe', mp);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);
    const url = page.url();
    if (url.includes('etudiant') || url.includes('formateur') || url.includes('admin') || url.includes('dashboard') || url.includes('profile')) return true;
    const body = await page.locator('body').innerText().catch(() => '');
    if (body.includes('Trop de tentatives')) {
      console.log(`  [rate-limit] login bloqué, pause 60s puis retry (${attempt}/16)`);
      await page.waitForTimeout(60000);
      continue;
    }
    return false;
  }
  return false;
}

function luminance(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(c1, c2) {
  const l1 = luminance(c1), l2 = luminance(c2);
  const [hi, lo] = [Math.max(l1, l2), Math.min(l1, l2)];
  return (hi + 0.05) / (lo + 0.05);
}

async function menuContrast(page) {
  return page.evaluate(() => {
    const lum = (rgb) => {
      const [r, g, b] = rgb.match(/\d+/g).map(Number);
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const contrast = (c1, c2) => {
      const l1 = lum(c1), l2 = lum(c2);
      const [hi, lo] = [Math.max(l1, l2), Math.min(l1, l2)];
      return (hi + 0.05) / (lo + 0.05);
    };
    const drawer = Array.from(document.querySelectorAll('div')).find(d =>
      d.offsetParent !== null &&
      d.className.includes('inset-y-0') &&
      d.className.includes('left-0') &&
      d.className.includes('w-72'));
    if (!drawer) return null;
    const stopped = [];
    const effBg = (el) => {
      const opaqueEnough = (c) => {
        if (!c || c === 'transparent') return false;
        const m = c.match(/rgba?\(([\d\s,.]+)\)/);
        if (!m) return false;
        const parts = m[1].split(',').map((s) => Number(s.trim()));
        return (parts.length <= 3 ? 1 : parts[3]) >= 0.5;
      };
      let node = el;
      while (node && node !== drawer) {
        const cs = getComputedStyle(node);
        const c = cs.backgroundColor;
        const hasImg = cs.backgroundImage && cs.backgroundImage !== 'none';
        if (hasImg) {
          const stops = cs.backgroundImage.match(/rgba?\([^)]+\)/g);
          const pick = stops && stops.length >= 2 ? stops[stops.length - 1] : (opaqueEnough(c) ? c : null);
          if (pick) return pick;
        } else if (opaqueEnough(c)) {
          return c;
        }
        node = node.parentElement;
      }
      return null;
    };
    const links = Array.from(drawer.querySelectorAll('nav a')).filter(a => a.offsetParent !== null);
    for (const a of links) {
      const fg = getComputedStyle(a).color;
      const bg = effBg(a);
      if (!bg) continue;
      stopped.push({ text: (a.textContent || '').trim().slice(0, 22), fg, bg, r: contrast(fg, bg) });
    }
    if (!stopped.length) return null;
    stopped.sort((x, y) => x.r - y.r);
    return { min: stopped[0].r, items: stopped };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  /* ============ ADMIN ============ */
  console.log('\n=== ADMIN (Samuel) ===');
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const admin = await adminCtx.newPage();
  const aErr = [];
  admin.on('pageerror', e => aErr.push(e.message));
  await login(admin, 'samuel.nzarami@tutore.local', 'Admin@EUL2026!');
  check('admin connecté', admin.url().includes('/admin') || admin.url().includes('/dashboard'));

  await admin.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  check('accès rapides : Conversations présent', await admin.locator('a[href="/admin/conversations"]').count() > 0);
  check('accès rapides : pas de « Mon profil »', await admin.locator('a[href="/profile"]').count() === 0);
  const footerText = await admin.locator('footer').innerText().catch(() => '');
  check('footer admin sur /admin/dashboard (Administration E-Learning)', footerText.includes('Administration E-Learning Universitaire'));
  check('sidebar admin : pas de « Mon profil »', await admin.locator('a[href="/profile"]:has-text("Mon profil")').count() === 0);

  await admin.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  check('/profile redirigé vers /admin/profile (admin)', admin.url().includes('/admin/profile'));
  const profFooter = await admin.locator('footer').innerText().catch(() => '');
  check('footer admin (et non AppLayout) sur /profile', profFooter.includes('Administration E-Learning Universitaire') && !profFooter.includes('Console d\'administration'));
  const profHeader = await admin.locator('header').innerText().catch(() => '');
  check('header "Administration" sur /profile', profHeader.includes('Administration'));

  // Mobile admin 390px : drawer + contraste
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  const burger = admin.locator('button[aria-label="Ouvrir le menu"]');
  check('burger présent à 390px (AdminLayout)', await burger.count() > 0);
  await burger.first().click();
  await admin.waitForTimeout(600);
  const drawerCheck = await admin.evaluate(() => {
    const links = Array.from(document.querySelectorAll('nav a')).map(a => ({ href: a.getAttribute('href') }));
    const drawer = document.querySelector('.fixed.inset-y-0, aside');
    return { links, hasDrawer: !!drawer };
  });
  const convInDrawer = drawerCheck.links.some(l => l.href && l.href.includes('/admin/conversations'));
  const notifInDrawer = drawerCheck.links.some(l => l.href && l.href.includes('/admin/notifications'));
  check('drawer admin contient Notifications + Conversations', convInDrawer && notifInDrawer);
  const contrastAdmin = await menuContrast(admin);
  if (contrastAdmin) {
    check(`contraste min liens admin drawer ≥ 4.5 (${contrastAdmin.min.toFixed(2)})`, contrastAdmin.min >= 4.5);
  } else {
    check('contraste lien admin drawer calculable', false);
  }
  await admin.screenshot({ path: `${SHOT}/admin-390-drawer.png` });
  if (aErr.length) console.log('  admin page errors:', aErr.filter(e => !e.includes('Warning')).join(' | '));
  await adminCtx.close();

  /* ============ FORMATEUR ============ */
  console.log('\n=== FORMATEUR (Jean Paul) ===');
  const formCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const form = await formCtx.newPage();
  const fErr = [];
  form.on('pageerror', e => fErr.push(e.message));
  await login(form, 'jean.paul@tutore.local', 'Jean@EUL2026!');
  check('formateur connecté', form.url().includes('/formateur') || form.url().includes('dashboard'));

  await form.goto(`${BASE}/formateur/formations/1`, { waitUntil: 'networkidle' });
  await form.waitForTimeout(1500);
  check('builder : bouton "Section" présent', await form.locator('button:has-text("Section")').count() > 0);

  // Créer une section avec contenu riche (RichTextEditor)
  const addSection = form.locator('button:has-text("Section")').first();
  await addSection.click();
  await form.waitForTimeout(800);
  check('modal section : pas de textarea description (remplacée par RTE)', await form.locator('form[id="builder-form"] textarea').count() === 0);
  check('modal section : RichTextEditor présent', await form.locator('form[id="builder-form"] .ProseMirror').count() > 0);
  const titreInput = form.locator('form[id="builder-form"] input.input').first();
  await titreInput.fill('E2E Section RTE');
  await form.locator('form[id="builder-form"] .ProseMirror').click();
  await form.keyboard.type('Contenu riche de TEST pour la section.');
  await form.locator('button[form="builder-form"]').click();
  await form.waitForTimeout(1500);
  check('section sauvegardée dans l’arbre', await form.locator('text=E2E Section RTE').count() > 0);

  // Édition d'une section existante : le RTE doit charger le contenu existant
  const secLi = form.locator('li:has-text("E2E Section RTE")');
  if (await secLi.count() > 0) {
    await secLi.first().locator('button.btn-secondary').first().click();
    await form.waitForTimeout(800);
    await form.waitForSelector('form[id="builder-form"] .ProseMirror', { timeout: 4000 });
    const edPres = await form.locator('form[id="builder-form"] .ProseMirror').count() > 0;
    check('édition section : RTE présent', edPres);
    const edHtml = await form.locator('form[id="builder-form"] .ProseMirror').innerHTML().catch(() => '');
    check('édition section : contenu chargé dans le RTE', edHtml.includes('Contenu riche de TEST'));
    await form.locator('button[aria-label="Fermer"]').first().click();
    await form.waitForTimeout(400);
  } else {
    check('édition section : élément trouvé', false);
  }

  await form.screenshot({ path: `${SHOT}/formateur-builder-rte.png` });

  // Mobile formateur 390px : drawer contraste
  await form.setViewportSize({ width: 390, height: 844 });
  await form.goto(`${BASE}/formateur/formations`, { waitUntil: 'networkidle' });
  const fBurger = form.locator('button[aria-label="Ouvrir le menu"]');
  check('burger formateur 390px', await fBurger.count() > 0);
  await fBurger.first().click();
  await form.waitForTimeout(600);
  const fContrast = await menuContrast(form);
  if (fContrast) {
    check(`contraste min liens drawer formateur ≥ 4.5 (${fContrast.min.toFixed(2)})`, fContrast.min >= 4.5);
  } else check('contraste drawer formateur calculable', false);
  await form.screenshot({ path: `${SHOT}/formateur-390-drawer.png` });
  if (fErr.length) console.log('  formateur page errors:', fErr.filter(e => !e.includes('Warning')).join(' | '));
  // La session formateur reste ouverte : propre supprimera la section E2E en fin de parcours

  /* ============ ÉTUDIANT ============ */
  console.log('\n=== ÉTUDIANT (Grâce) ===');
  const etuCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const etu = await etuCtx.newPage();
  const eErr = [];
  etu.on('pageerror', e => eErr.push(e.message));
  await login(etu, 'grace.wayire@tutore.local', 'Grace@EUL2026!');
  check('étudiant connecté', etu.url().includes('etudiant') || etu.url().includes('dashboard'));

  await etu.goto(`${BASE}/etudiant/chapitre/1`, { waitUntil: 'networkidle' });
  await etu.waitForTimeout(2000);
  const nextCta = await etu.locator('#chapter-next:has-text("Chapitre suivant")').count();
  check('chapitre 1 : CTA "Chapitre suivant" affiché (validé)', nextCta > 0);
  const nextHref = await etu.locator('#chapter-next a').first().getAttribute('href').catch(() => null);
  check(`chapitre 1 : CTA pointe vers chapitre 2 (${nextHref})`, nextHref === '/etudiant/chapitre/2');
  check('section E2E rendue côté étudiant (contenu riche)', await etu.locator('text=Contenu riche de TEST pour la section.').count() > 0);
  await etu.screenshot({ path: `${SHOT}/etudiant-ch1-next.png`, fullPage: true });

  // Le chapitre 3 (dernier de formation 1) → Formation terminée
  await etu.goto(`${BASE}/etudiant/chapitre/3`, { waitUntil: 'networkidle' });
  await etu.waitForTimeout(2000);
  check('chapitre 3 : "Formation terminée" affiché', await etu.locator('#chapter-next:has-text("Formation terminée")').count() > 0);
  await etu.goto(`${BASE}/etudiant/tentatives`, { waitUntil: 'networkidle' });
  await etu.waitForTimeout(2000);
  const tentBody = await etu.locator('body').innerText();
  check('résultats : formation affichée', tentBody.includes('Développement Web Moderne'));
  check('résultats : chapitre affiché', tentBody.toLowerCase().includes('html et structure des pages'));

  // Responsive étudiant : 390 / 768 / 1280
  await etu.setViewportSize({ width: 390, height: 844 });
  await etu.goto(`${BASE}/etudiant/catalogue`, { waitUntil: 'networkidle' });
  const eBurger390 = await etu.locator('button[aria-label="Ouvrir le menu"]').count();
  check('étudiant 390px : burger visible', eBurger390 > 0);
  await etu.locator('button[aria-label="Ouvrir le menu"]').first().click();
  await etu.waitForTimeout(600);
  const e390 = await menuContrast(etu);
  if (e390) {
    const worst = e390.items[0];
    check(`étudiant 390px contraste burger menu ≥ 4.5 (min ${e390.min.toFixed(2)} — «${worst.text}» ${worst.fg}/${worst.bg})`, e390.min >= 4.5);
  } else check('étudiant 390px contraste calculable', false);
  await etu.screenshot({ path: `${SHOT}/etudiant-390-drawer.png` });

  await etu.setViewportSize({ width: 768, height: 1024 });
  await etu.goto(`${BASE}/etudiant/parcours`, { waitUntil: 'networkidle' });
  check('étudiant 768px : burger (nav suivante en drawer jusqu’au lg)', await etu.locator('button[aria-label="Ouvrir le menu"]').count() > 0);
  await etu.goto(`${BASE}/etudiant/catalogue`, { waitUntil: 'networkidle' });
  await etu.setViewportSize({ width: 1280, height: 800 });
  await etu.goto(`${BASE}/etudiant/catalogue`, { waitUntil: 'networkidle' });
  const desktopNavVisible = await etu.locator('header nav a:has-text("Catalogue")').count();
  check('étudiant 1280px : nav desktop visible', desktopNavVisible > 0);
  if (eErr.length) console.log('  etudiant page errors:', eErr.filter(e => !e.includes('Warning')).join(' | '));
  await etuCtx.close();

  /* ============ NETTOYAGE : suppression de la section E2E ============ */
  await form.setViewportSize({ width: 1440, height: 900 });
  await form.goto(`${BASE}/formateur/formations/1`, { waitUntil: 'networkidle' });
  await form.waitForTimeout(1500);
  const secRow = form.locator('li:has-text("E2E Section RTE")');
  if (await secRow.count() > 0) {
    await secRow.first().locator('button.text-danger-500').click();
    await form.waitForSelector('button:has-text("Confirmer")', { timeout: 3000 });
    await form.locator('button:has-text("Confirmer")').click();
    await form.waitForTimeout(1200);
    check('suppression section E2E via UI (ConfirmDialog)', await secRow.count() === 0);
  } else {
    check('suppression section E2E via UI (ConfirmDialog)', true);
  }
  await form.screenshot({ path: `${SHOT}/formateur-builder-clean.png` });
  await formCtx.close();

  await browser.close();

  console.log('\n==== RESULTATS NAVIGATEUR ====');
  console.log('PASS:', passed, '| FAIL:', failed);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(2); });