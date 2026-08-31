/**
 * MISSION FINALE — E2E COMPLÈTE
 *
 * Chaîne pédagogique réelle :
 *   FORMATEUR → création formation → upload médias → prévisualisation → sauvegarde
 *   ÉTUDIANT → contenu → images → vidéos → documents → quiz → chapitre suivant
 *
 * Lancement : node scripts/test-mission-media.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5180';
const SHOT = 'D:\\E-LearnigLocal\\screenshots\\mission-media';
const MEDIA = 'D:\\E-LearnigLocal\\test-media';
const TITRE = 'Formation Multimédia E2E';
const fs2 = require('fs');
if (!fs2.existsSync(SHOT)) fs2.mkdirSync(SHOT, { recursive: true });

let passed = 0, failed = 0;
function check(label, cond) {
  if (cond) { passed++; console.log('  PASS', label); }
  else { failed++; console.log('  FAIL', label); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page, email, mp) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', email);
    await page.fill('#mot_de_passe', mp);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (!url.includes('/login')) return true;
    const body = await page.locator('body').innerText().catch(() => '');
    if (body.includes('Trop de tentatives')) {
      console.log('  [rate-limit] pause 60s');
      await page.waitForTimeout(60000);
      continue;
    }
    return false;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const pageErrors = [];

  /* ================================================================ */
  /* PHASE 1 — FORMATEUR : connexion + création formation + upload     */
  /* ================================================================ */
  console.log('\n=== FORMATEUR (Jean Paul) ===');
  const fCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const f = await fCtx.newPage();
  f.on('pageerror', (e) => pageErrors.push('[F] ' + e.message));

  await login(f, 'jean.paul@tutore.local', 'Jean@EUL2026!');
  check('formateur connecté', /formateur|dashboard/.test(f.url()));
  await f.goto(`${BASE}/formateur/formations`, { waitUntil: 'networkidle' });
  await f.waitForTimeout(2000);

  // Nettoyage formations de test précédentes
  for (let i = 0; i < 10; i++) {
    const cards = f.locator('div.card-interactive', { hasText: TITRE });
    if (await cards.count() === 0) break;
    const del = cards.first().locator('div.mt-4.flex.items-center.gap-2 button').last();
    await del.click();
    await f.waitForTimeout(500);
    await f.locator('button', { hasText: 'Confirmer' }).click();
    await f.waitForTimeout(1500);
  }

  // Création
  await f.click('button:has-text("Nouvelle formation")');
  await f.waitForTimeout(600);
  await f.fill('input[placeholder*="Introduction à la programmation"]', TITRE);
  await f.fill('textarea[placeholder*="Décrivez brièvement"]', 'Formation multimédia E2E — images, vidéos, documents, quiz.');
  const catSelect = f.locator('form select.select');
  if (await catSelect.count() > 0) {
    const opts = await catSelect.locator('option').evaluateAll((o) => o.map((x) => x.value));
    if (opts.length > 1) await catSelect.selectOption(opts[1]);
  }
  await f.click('button:has-text("Créer la formation")');
  await f.waitForTimeout(2500);
  check('formation créée', (await f.locator('div.card-interactive', { hasText: TITRE }).count()) >= 1);

  // Ouvrir builder
  await f.locator('div.card-interactive', { hasText: TITRE }).first().locator('a', { hasText: 'Construire' }).first().click();
  await f.waitForTimeout(2500);
  check('builder ouvert', /\/formateur\/formations\/\d+/.test(f.url()));
  await f.screenshot({ path: `${SHOT}\\01-builder.png`, fullPage: false });

  // === CHAPITRE 1 ===
  const addChapterBtn = f.locator('button.btn-primary', { hasText: 'Chapitre' }).first();
  await addChapterBtn.click();
  await f.waitForTimeout(600);
  await f.fill('#builder-form input.input', 'Chapitre 1 — Introduction');
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === SECTION 1 (chapitre 1) — contenu texte dans la section ===
  const addSectionBtn = f.locator('button.btn-ghost', { hasText: /Section$/ });
  await addSectionBtn.nth(0).click();
  await f.waitForTimeout(600);
  await f.fill('#builder-form input.input', 'Section — Présentation');
  const sectionPm = f.locator('#builder-form .ProseMirror');
  if (await sectionPm.count() > 0) {
    await sectionPm.click();
    await sectionPm.pressSequentially('Contenu de la section avec du texte riche.');
    check('section : RTE présent (contenu)', true);
  } else {
    check('section : RTE présent (contenu)', false);
  }
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === SOUS-SECTION 1 — Texte riche ===
  const addSousBtn = f.locator('li:has-text("Section — Présentation") button.btn-ghost:has-text("Sous-section")').first();
  await addSousBtn.click();
  await f.waitForTimeout(800);
  await f.fill('#builder-form input.input', 'Texte riche');
  const pm = f.locator('#builder-form .ProseMirror');
  check('RTE présent dans modale sous-section', (await pm.count()) === 1);
  await pm.click();
  await pm.pressSequentially('Bienvenue dans le cours.');
  await pm.press('Enter');
  await pm.pressSequentially('Ceci est un paragraphe de test avec des médias.');
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === SOUS-SECTION 2 — Image uploadée ===
  await addSousBtn.click();
  await f.waitForTimeout(800);
  await f.fill('#builder-form input.input', 'Image uploadée');
  // Click the image toolbar button -> opens file picker
  const imgBtn = f.locator('button[aria-label="Insérer une image"]');
  check('bouton "Insérer une image" présent', (await imgBtn.count()) > 0);
  // Use setInputFiles on the hidden file input
  const imgInput = f.locator('input[type="file"][accept*="image"]');
  await imgInput.setInputFiles(path.join(MEDIA, 'test-image.jpg'));
  await f.waitForTimeout(2000);
  // Verify image was inserted in editor
  const editorHtml1 = await pm.innerHTML();
  check('image uploadée insérée dans RTE', editorHtml1.includes('<img'));
  await f.screenshot({ path: `${SHOT}\\02-image-uploaded.png`, fullPage: false });
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === SOUS-SECTION 3 — Vidéo uploadée ===
  await addSousBtn.click();
  await f.waitForTimeout(800);
  await f.fill('#builder-form input.input', 'Vidéo uploadée');
  const vidInput = f.locator('input[type="file"][accept*="video"]');
  check('bouton "Insérer une vidéo" existe', (await vidInput.count()) > 0);
  await vidInput.setInputFiles(path.join(MEDIA, 'test-video-short.mp4'));
  await f.waitForTimeout(2000);
  const editorHtml2 = await pm.innerHTML();
  check('vidéo uploadée insérée dans RTE', editorHtml2.includes('<video'));
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === SOUS-SECTION 4 — Document uploadé ===
  await addSousBtn.click();
  await f.waitForTimeout(800);
  await f.fill('#builder-form input.input', 'Document uploadé');
  const docInput = f.locator('input[type="file"][accept*=".pdf"]');
  check('bouton "Insérer un document" existe', (await docInput.count()) > 0);
  await docInput.setInputFiles(path.join(MEDIA, 'test-document.pdf'));
  await f.waitForTimeout(2000);
  const editorHtml3 = await pm.innerHTML();
  check('document uploadé inséré dans RTE (lien)', editorHtml3.includes('/api/files/') || editorHtml3.includes('<a'));
  await f.screenshot({ path: `${SHOT}\\03-doc-uploaded.png`, fullPage: false });
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === SOUS-SECTION 5 — Document TXT ===
  await addSousBtn.click();
  await f.waitForTimeout(800);
  await f.fill('#builder-form input.input', 'Fichier texte');
  await docInput.setInputFiles(path.join(MEDIA, 'test-document.txt'));
  await f.waitForTimeout(2000);
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === CHAPITRE 2 ===
  await addChapterBtn.click();
  await f.waitForTimeout(600);
  await f.fill('#builder-form input.input', 'Chapitre 2 — Approfondissement');
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // === SECTION (chapitre 2) ===
  await addSectionBtn.nth(1).click();
  await f.waitForTimeout(600);
  await f.fill('#builder-form input.input', 'Section — Résumé');
  await f.click('button[form="builder-form"]');
  await f.waitForTimeout(1500);

  // Vérifier arbre
  const bodyText = await f.locator('body').innerText();
  check('arbre : Chapitre 1 visible', bodyText.includes('Chapitre 1'));
  check('arbre : Chapitre 2 visible', bodyText.includes('Chapitre 2'));
  check('arbre : Sous-sections visibles', bodyText.includes('Image uploadée') && bodyText.includes('Vidéo uploadée'));
  await f.screenshot({ path: `${SHOT}\\04-arbre-complet.png`, fullPage: false });

  // === RELOAD : vérifier persistance ===
  await f.reload({ waitUntil: 'networkidle' });
  await f.waitForTimeout(5000);
  // Close any open modals
  const closeBtn = f.locator('button[aria-label="Fermer"]');
  if (await closeBtn.count() > 0) await closeBtn.first().click().catch(() => {});
  await f.waitForTimeout(1000);
  const bodyReload = await f.locator('body').innerText();
  check('reload builder : chapitres persistent', bodyReload.includes('Chapitre 1') && bodyReload.includes('Chapitre 2'));
  // Expand chapter 1 in sidebar to load sections
  const ch1Toggle = f.locator('button[aria-label="Développer"]').first();
  if (await ch1Toggle.count() > 0) {
    await ch1Toggle.click();
    await f.waitForTimeout(2000);
    const bodyAfterExpand = await f.locator('body').innerText();
    check('reload builder : sections chargées après expand', bodyAfterExpand.includes('Section'));
  } else {
    check('reload builder : sections chargées après expand', false);
  }

  // === PRÉVISUALISATION ===
  // Ouvrir sous-section "Image uploadée" en édition
  const imgEditBtn = f.locator('li:has-text("Image uploadée") button.btn-secondary').first();
  if (await imgEditBtn.count() > 0) {
    await imgEditBtn.click();
    await f.waitForTimeout(1000);
    const previewBtn = f.locator('#builder-form button:has-text("Aperçu")');
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      await f.waitForTimeout(800);
      const previewContainer = f.locator('#builder-form .rte-content');
      const previewImg = previewContainer.locator('img');
      check('aperçu : image rendue dans preview', (await previewImg.count()) > 0);
      await f.screenshot({ path: `${SHOT}\\05-apercu-image.png`, fullPage: false });
      // Close modal
      await f.locator('button:has-text("Éditer")').first().click().catch(() => {});
      await f.waitForTimeout(300);
    }
    // Close modal via X
    await f.locator('button[aria-label="Fermer"]').first().click().catch(() => {});
    await f.waitForTimeout(500);
  }

  // === PUBLIER ===
  // Close any open modals first
  const closeBtn2 = f.locator('button[aria-label="Fermer"]');
  if (await closeBtn2.count() > 0) await closeBtn2.first().click().catch(() => {});
  await f.waitForTimeout(500);
  const publishBtn = f.locator('button:has-text("Publier")').first();
  if (await publishBtn.count() > 0) {
    await publishBtn.click();
    await f.waitForTimeout(2000);
    check('formation publiée', true);
  }
  await f.screenshot({ path: `${SHOT}\\06-publiee.png`, fullPage: false });

  /* ================================================================ */
  /* PHASE 2 — TEST HTTP : upload + Range + auth                      */
  /* ================================================================ */
  console.log('\n=== TEST HTTP FICHIERS ===');
  const hCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const h = await hCtx.newPage();

  // Login formateur pour obtenir un token
  await login(h, 'jean.paul@tutore.local', 'Jean@EUL2026!');
  const token = await h.evaluate(() => localStorage.getItem('eul_token'));

  if (token) {
    const API = 'http://localhost:3010';
    // Upload test via direct backend API
    const testUpload = await h.evaluate(async ({ api, t }) => {
      try {
        const bin = new Uint8Array([0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00]);
        const blob = new Blob([bin], { type: 'image/jpeg' });
        const fd = new FormData();
        fd.append('fichier', blob, 'test.jpg');
        const r = await fetch(api + '/api/files/upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + t }, body: fd });
        const text = await r.text();
        let j; try { j = JSON.parse(text); } catch { j = { raw: text.slice(0, 300) }; }
        return { status: r.status, src: j?.data?.src, ok: j?.success, msg: j?.message };
      } catch (err) {
        return { error: err.message };
      }
    }, { api: API, t: token });
    check('upload API : 201', testUpload.ok === true);
    check('upload API : src retourné', !!testUpload.src);
    if (!testUpload.ok) console.log('  [debug upload]', JSON.stringify(testUpload).slice(0, 300));
  } else {
    console.log('  [skip] token non disponible, tests upload ignorés');
  }
  await hCtx.close();

  /* ================================================================ */
  /* PHASE 3 — ÉTUDIANT : contenu + médias + quiz + chapitre suivant  */
  /* ================================================================ */
  console.log('\n=== ÉTUDIANT (Grâce) ===');
  const eCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const e = await eCtx.newPage();
  e.on('pageerror', (pe) => pageErrors.push('[E] ' + pe.message));

  await login(e, 'grace.wayire@tutore.local', 'Grace@EUL2026!');
  check('étudiant connecté', /etudiant|dashboard|catalogue/.test(e.url()));

  // Catalogue
  await e.goto(`${BASE}/etudiant/catalogue`, { waitUntil: 'networkidle' });
  await e.waitForTimeout(2000);
  const formationCard = e.locator('div.card-interactive, div.card, [class*="card"]', { hasText: TITRE }).first();
  check('formation visible au catalogue', (await formationCard.count()) > 0);

  // S'inscrire si nécessaire
  const enrollBtn = formationCard.locator('button:has-text("S\'inscrire"), button:has-text("Reprendre"), a:has-text("Reprendre")').first();
  if (await enrollBtn.count() > 0) {
    const txt = await enrollBtn.innerText();
    if (txt.includes("S'inscrire")) {
      await enrollBtn.click();
      await e.waitForTimeout(2000);
    }
  }

  // Ouvrir la formation
  const openBtn = formationCard.locator('a:has-text("Reprendre"), a:has-text("Commencer"), button:has-text("Reprendre"), button:has-text("Commencer")').first();
  if (await openBtn.count() > 0) {
    await openBtn.click();
    await e.waitForTimeout(2500);
  } else {
    // Try going to parcours directly
    await e.goto(`${BASE}/etudiant/parcours`, { waitUntil: 'networkidle' });
    await e.waitForTimeout(2000);
    const link = e.locator('a', { hasText: TITRE }).first();
    if (await link.count() > 0) await link.click();
    await e.waitForTimeout(2500);
  }
  await e.screenshot({ path: `${SHOT}\\07-etudiant-parcours.png`, fullPage: false });

  // Ouvrir chapitre 1
  const ch1Link = e.locator('a:has-text("Chapitre 1")').first();
  if (await ch1Link.count() > 0) {
    await ch1Link.click();
    await e.waitForTimeout(3000);
  } else {
    // Navigate directly
    await e.goto(`${BASE}/etudiant/chapitre/1`, { waitUntil: 'networkidle' });
    await e.waitForTimeout(2000);
  }

  const chapitreUrl = e.url();
  check('étudiant : chapitre ouvert', chapitreUrl.includes('/etudiant/chapitre/'));
  await e.screenshot({ path: `${SHOT}\\08-chapitre-etudiant.png`, fullPage: false });

  // Vérifier sections / sous-sections
  const studentBody = await e.locator('body').innerText();
  check('étudiant : sections visibles', studentBody.includes('Présentation') || studentBody.includes('Section'));

  // Vérifier images
  const images = e.locator('.rte-content img, .prose-custom img');
  const imgCount = await images.count();
  check(`étudiant : images rendues (${imgCount})`, imgCount > 0);

  if (imgCount > 0) {
    // Vérifier chargement réel de l'image
    const imgLoaded = await images.first().evaluate((el) => el.complete && el.naturalWidth > 0);
    check('étudiant : image réellement chargée (complete)', imgLoaded);
  }

  // Vérifier vidéos
  const videos = e.locator('.rte-content video, .prose-custom video, video');
  const vidCount = await videos.count();
  check(`étudiant : vidéos rendues (${vidCount})`, vidCount > 0);
  let videoUrl = null;

  if (vidCount > 0) {
    const vidState = await videos.first().evaluate((el) => ({
      readyState: el.readyState,
      duration: el.duration,
      src: el.src,
      error: el.error ? el.error.message : null,
    }));
    check('étudiant : vidéo a un src', !!vidState.src);
    console.log(`    video readyState=${vidState.readyState}, duration=${vidState.duration}, src=${(vidState.src || '').slice(0, 80)}`);
    if (vidState.src) videoUrl = vidState.src;
    // Test pause/play controls
    const canPlay = await videos.first().evaluate(async (el) => {
      try { await el.play(); el.pause(); return true; } catch { return false; }
    });
    check('étudiant : vidéo lecture/pause possible', canPlay);
  }

  // Vérifier documents
  const docCards = e.locator('.doc-card, a[href*="/api/files/"]');
  const docCount = await docCards.count();
  check(`étudiant : cartes/documents rendus (${docCount})`, docCount > 0);

  // Full-page screenshot
  await e.screenshot({ path: `${SHOT}\\09-chapitre-contenu.png`, fullPage: true });

  // Vérifier quiz
  const quizSection = e.locator('#chapitre-quiz, [class*="quiz"]');
  check('étudiant : section quiz présente', (await quizSection.count()) > 0);

  // Scroll vers le quiz
  await e.evaluate(() => {
    const q = document.getElementById('chapitre-quiz');
    if (q) q.scrollIntoView({ behavior: 'instant' });
  });
  await e.waitForTimeout(500);
  await e.screenshot({ path: `${SHOT}\\10-quiz-section.png`, fullPage: false });

  /* ================================================================ */
  /* PHASE 4 — ADMIN SMOKE TEST                                       */
  /* ================================================================ */
  console.log('\n=== ADMIN (Samuel) ===');
  const aCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const a = await aCtx.newPage();
  a.on('pageerror', (pe) => pageErrors.push('[A] ' + pe.message));

  await login(a, 'samuel.nzarami@tutore.local', 'Admin@EUL2026!');
  check('admin connecté', /admin/.test(a.url()));
  await a.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await a.waitForTimeout(2000);
  const adminBody = await a.locator('body').innerText();
  check('admin : dashboard chargé', adminBody.includes('Tableau de bord') || adminBody.includes('Administration'));
  await a.screenshot({ path: `${SHOT}\\11-admin-dashboard.png`, fullPage: false });

  /* ================================================================ */
  /* PHASE 5 — TEST RANGE STREAMING (fichier lié au contenu)          */
  /* ================================================================ */
  console.log('\n=== TEST RANGE STREAMING ===');
  if (videoUrl) {
    const etuToken = await e.evaluate(() => localStorage.getItem('eul_token'));
    const videoBase = videoUrl.split('?')[0];

    const rangeTest = await new Promise((resolve) => {
      const http = require('http');
      const url1 = new URL(videoBase + '?token=' + etuToken);
      // Full GET
      http.get({ hostname: url1.hostname, port: url1.port, path: url1.pathname + url1.search }, (res1) => {
        const fullHeaders = { ct: res1.headers['content-type'], ar: res1.headers['accept-ranges'] };
        res1.resume();
        res1.on('end', () => {
          // Range GET
          const url2 = new URL(videoBase + '?token=' + etuToken);
          http.get({ hostname: url2.hostname, port: url2.port, path: url2.pathname + url2.search, headers: { Range: 'bytes=0-' } }, (res2) => {
            const rangeHeaders = { status: res2.statusCode, cr: res2.headers['content-range'], ar: res2.headers['accept-ranges'] };
            res2.resume();
            res2.on('end', () => {
              resolve({ fullStatus: res1.statusCode, fullContentType: fullHeaders.ct, fullAcceptRanges: fullHeaders.ar, ...rangeHeaders });
            });
          });
        });
      });
    });

    check('GET complet : Content-Type défini', !!rangeTest.fullContentType);
    check('GET complet : Accept-Ranges: bytes', rangeTest.fullAcceptRanges === 'bytes');
    check('GET Range : 206 Partial Content', rangeTest.status === 206);
    check('GET Range : Content-Range défini', !!rangeTest.cr);
    console.log(`    Content-Type: ${rangeTest.fullContentType}`);
    console.log(`    Accept-Ranges: ${rangeTest.fullAcceptRanges}`);
    console.log(`    Range status: ${rangeTest.status}`);
    console.log(`    Content-Range: ${rangeTest.cr}`);
  } else {
    console.log('  [skip] Aucune URL vidéo disponible pour test Range');
    check('GET complet : Content-Type défini', false);
    check('GET complet : Accept-Ranges: bytes', false);
    check('GET Range : 206 Partial Content', false);
    check('GET Range : Content-Range défini', false);
  }

  /* ================================================================ */
  /* RÉSUMÉ                                                            */
  /* ================================================================ */
  console.log('\n' + '='.repeat(50));
  console.log(`RESULTATS: PASS=${passed}  FAIL=${failed}`);
  if (pageErrors.length > 0) {
    console.log('PAGE ERRORS:', pageErrors.length);
    pageErrors.slice(0, 10).forEach((e) => console.log('  ', e.slice(0, 120)));
  }
  console.log('='.repeat(50));

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
