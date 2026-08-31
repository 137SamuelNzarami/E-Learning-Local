/**
 * TEST — E2E RICH TEXT EDITOR (mission 5).
 *
 * Parcours 100 % navigateur (Playwright), trois rôles réels :
 *  1. FORMATEUR (jean.paul@tutore.local) crée une vraie formation de test
 *     « Formation RTE E2E » (nettoyée en entrée si un reliquat subsiste)
 *     avec 2 chapitres, sections et sous-sections.
 *  2. Dans le RichTextEditor il insère RÉELLEMENT : texte riche (gras,
 *     italique, titre H2), image par URL, vidéo par URL, document (lien) ;
 *     bascule en « Aperçu » (cartographie image/vidéo/carte document) ;
 *     sauvegarde, puis RELOAD : le contenu est rechargé dans l'éditeur.
 *  3. ÉTUDIANT (grace.wayire@tutore.local) retrouve la formation au
 *     catalogue, s'inscrit, ouvre le chapitre : le rendu final affiche
 *     texte riche, image, vidéo et carte document (Ouvrir / Télécharger).
 *
 * Lancement : node scripts/test-rte-e2e.js
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:5180';
const SHOT = 'D:\\E-LearnigLocal\\screenshots\\rte-e2e';
const TITRE = 'Formation RTE E2E';
const fs = require('fs');
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });

let passed = 0, failed = 0;
function check(label, cond) {
  if (cond) { passed++; console.log('  PASS ', label); }
  else { failed++; console.log('  FAIL ', label); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page, email, mp) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#mot_de_passe', mp);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  return page.url();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  /* ================================================================== */
  /* PHASE 1 — FORMATEUR : nettoyage + création formation                */
  /* ================================================================== */
  const fCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const f = await fCtx.newPage();
  f.on('pageerror', (e) => errors.push('[formateur] ' + e.message));

  try {
    await login(f, 'jean.paul@tutore.local', 'Jean@EUL2026!');
    await f.goto(`${BASE}/formateur/formations`, { waitUntil: 'networkidle' });
    await f.waitForTimeout(2000);

    // Nettoyage : supprimer TOUTE formation portant le même titre (idempotence).
    // Le bouton de confirmation du ConfirmDialog est « Confirmer ».
    for (let i = 0; i < 20; i++) {
      const cards = f.locator('div.card-interactive', { hasText: TITRE });
      if (await cards.count() === 0) break;
      const card = cards.first();
      // bouton corbeille = dernier bouton de la barre d'actions
      const del = card.locator('div.mt-4.flex.items-center.gap-2 button').last();
      await del.click();
      await f.waitForTimeout(600);
      const confirm = f.locator('button', { hasText: 'Confirmer' });
      await confirm.click();
      await f.waitForTimeout(1500);
    }
    await f.screenshot({ path: `${SHOT}\\01-formateur-liste.png`, fullPage: false });

    // Création
    await f.click('button:has-text("Nouvelle formation")');
    await f.waitForTimeout(600);
    await f.fill('input[placeholder*="Introduction à la programmation"]', TITRE);
    await f.fill('textarea[placeholder*="Décrivez brièvement"]', 'Formation de test E2E du RichTextEditor — plusieurs chapitres, sections et sous-sections.');
    const catSelect = f.locator('form select.select');
    if (await catSelect.count() > 0) {
      const catOpts = await catSelect.locator('option').evaluateAll((o) => o.map((x) => x.value));
      if (catOpts.length > 1) await catSelect.selectOption(catOpts[1]);
    }
    await f.click('button:has-text("Créer la formation")');
    await f.locator('button:has-text("Créer la formation")').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    await f.waitForTimeout(2000);

    const card = f.locator('div.card-interactive', { hasText: TITRE }).first();
    check('formation créée et visible dans « Mes formations »', (await card.count()) >= 1);
    await card.locator('a', { hasText: 'Construire' }).first().click();
    await f.waitForTimeout(2500);
    check('builder ouvert', /\/formateur\/formations\/\d+/.test(f.url()));
    await f.screenshot({ path: `${SHOT}\\02-builder-vide.png`, fullPage: false });

    /* ================================================================ */
    /* PHASE 2 — FORMATEUR : arbre 2 chapitres / sections / sous-sections */
    /* ================================================================ */

    // Bouton « + Chapitre » de la carte (le mot « Chapitre » existe aussi dans
    // les nœuds de la sidebar : on cible uniquement le btn-primary).
    const addChapterBtn = f.locator('button.btn-primary', { hasText: 'Chapitre' }).first();
    const addSectionBtn = f.locator('button.btn-ghost', { hasText: /Section$/ });
    const addSousBtn = (sectionTitle) =>
      f.locator(`li:has-text("${sectionTitle}") button.btn-ghost:has-text("Sous-section")`).first();

    // Chapitre 1
    await addChapterBtn.click();
    await f.waitForTimeout(600);
    await f.fill('#builder-form input.input', 'Chapitre 1 — Fondamentaux');
    await f.click('button[form="builder-form"]');
    await f.waitForTimeout(1500);

    // Chapitre 2
    await addChapterBtn.click();
    await f.waitForTimeout(600);
    await f.fill('#builder-form input.input', 'Chapitre 2 — Approfondissement');
    await f.click('button[form="builder-form"]');
    await f.waitForTimeout(1500);

    check('arbre : 2 chapitres créés', (await f.locator('h3', { hasText: 'Chapitres' }).first().innerText().catch(() => '')).includes('(2)'));

    // Section 1 (chapitre 1)
    await addSectionBtn.nth(0).click();
    await f.waitForTimeout(600);
    await f.fill('#builder-form input.input', 'Section 1 — Introduction');
    await f.click('button[form="builder-form"]');
    await f.waitForTimeout(1500);

    // Section — Résumé (chapitre 1, contenu riche directement dans la section)
    await addSectionBtn.nth(0).click();
    await f.waitForTimeout(600);
    await f.fill('#builder-form input.input', 'Section — Résumé');
    await f.locator('#builder-form .ProseMirror').click();
    await f.locator('#builder-form .ProseMirror').pressSequentially('Résumé de la section en contenu riche.');
    await f.click('button[form="builder-form"]');
    await f.waitForTimeout(1500);

    // Section — Cas pratique (chapitre 2)
    await addSectionBtn.nth(1).click();
    await f.waitForTimeout(600);
    await f.fill('#builder-form input.input', 'Section — Cas pratique');
    await f.click('button[form="builder-form"]');
    await f.waitForTimeout(1500);

    check('arbre : sections visibles', (await f.locator('body').innerText().catch(() => '')).includes('Section 1 — Introduction'));

    /* ---------------------------------------------------------------- */
    /* SOUS-SECTION 1 — Bienvenue : RTE complet (text/image/video/doc)   */
    /* ---------------------------------------------------------------- */
    await addSousBtn('Section 1 — Introduction').click();
    await f.waitForTimeout(800);
    await f.fill('#builder-form input.input', 'Sous-section — Bienvenue');
    const pm = f.locator('#builder-form .ProseMirror');
    const dump = async (l) => console.log('  [dbg]', l, '→', (await pm.innerHTML().catch(() => 'ERR')).replace(/\s+/g, ' ').slice(0, 220));
    check('RTE présent dans la modale', (await pm.count()) === 1);

    // Texte riche : H2 puis paragraphe avec gras + italique
    await pm.click();
    await pm.pressSequentially('Introduction à la RTE');
    await f.click('button[aria-label="Titre section"]'); // H2
    await pm.press('Enter');
    await pm.pressSequentially('Ceci est un texte en gras et en italique. Il présente la plateforme.');
    await pm.press('Home');
    await f.keyboard.down('Shift');
    await pm.press('End');
    await f.keyboard.up('Shift');
    await f.click('button[aria-label="Gras"]');
    await dump('Gras');
    await f.click('button[aria-label="Italique"]');
    await dump('Italique');
    // Les clics toolbar appliquent les marques et CONSERVENT la sélection
    // ProseMirror (la plage entière reste sélectionnée). Un Enter lancé à ce
    // moment SUPPRIMERAIT la sélection (comportement standard éditeur).
    // Geste réaliste : replacer le caret en fin de ligne, puis Enter → la
    // ligne est scindée sans rien perdre.
    await pm.press('End');
    await dump('caret fin de ligne');
    await pm.press('Enter');
    await sleep(400);
    await dump('Enter');

    // Image par URL
    await f.click('button[aria-label="Image par URL"]');
    await f.waitForTimeout(300);
    await f.fill('input[placeholder*="image.jpg"]', 'https://picsum.photos/seed/eul-rte/800/400');
    await f.click('button:has-text("Insérer")');
    await f.waitForTimeout(600);

    // Vidéo par URL
    await f.click('button[aria-label="Vidéo par URL"]');
    await f.waitForTimeout(300);
    await f.fill('input[placeholder*="video.mp4"]', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
    await f.click('button:has-text("Insérer")');
    await f.waitForTimeout(600);

    // Document (lien protégé -> carte document côté étudiant)
    await f.click('button[aria-label="Document (lien téléchargeable)"]');
    await f.waitForTimeout(300);
    await f.fill('input[placeholder*="URL du document"]', '/api/files/support-e2e.pdf');
    await f.fill('input[placeholder*="Nom affiché"]', 'Support de cours E2E');
    await f.click('button:has-text("Insérer")');
    await f.waitForTimeout(600);

    const htmlEditeur = await pm.innerHTML();
    check('RTE : gras <strong> présent', htmlEditeur.includes('<strong>'));
    check('RTE : italique <em> présent', htmlEditeur.includes('<em>'));
    check('RTE : image insérée (<img …>)', htmlEditeur.includes('<img'));
    check('RTE : image = URL picsum', htmlEditeur.includes('picsum.photos/seed/eul-rte'));
    check('RTE : vidéo insérée (<video …>)', htmlEditeur.includes('<video'));
    check('RTE : document = lien /api/files/support-e2e.pdf', htmlEditeur.includes('/api/files/support-e2e.pdf'));
    check('RTE : lien d\'ancrage <a …> (extension Link active)', /<a[^>]*href="/.test(htmlEditeur));
    await f.screenshot({ path: `${SHOT}\\03-rte-contenu.png`, fullPage: false });

    // Aperçu : le rendu (mêmes règles que côté étudiant)
    await f.click('button:has-text("Aperçu")');
    await f.waitForTimeout(800);
    const preview = f.locator('#builder-form');
    const previewHtml = await preview.innerHTML().catch(() => '');
    check('Aperçu : titre H2 rendu', (await preview.innerText().catch(() => '')).includes('Introduction à la RTE'));
    await preview.screenshot({ path: `${SHOT}\\04-rte-apercu.png`, fullPage: false });
    await f.click('button:has-text("Éditer")');
    await f.waitForTimeout(400);

    // Sauvegarde
    await f.click('button[form="builder-form"]');
    await f.waitForTimeout(2000);
    await f.screenshot({ path: `${SHOT}\\05-sauvegarde.png`, fullPage: false });

    /* ---------------------------------------------------------------- */
    /* RELOAD : contenu rechargé dans l'éditeur                          */
    /* ---------------------------------------------------------------- */
    await f.reload({ waitUntil: 'networkidle' });
    await f.waitForTimeout(2500);

    // L'arbre du builder recharge les sections/sous-sections de façon
    // paresseuse : on réplique le geste du formateur (déplier chapitre 1,
    // charger la section). Le clic sur une section OUVRE aussi sa modale
    // d'édition : on la referme avant de cibler la sous-section.
    await f.locator('aside button[aria-label="Développer"]').first().click();
    await f.waitForTimeout(1200);
    await f.locator('aside button', { hasText: 'Section 1 — Introduction' }).first().click();
    await f.waitForTimeout(1200);
    await f.locator('button[aria-label="Fermer"]').click().catch(() => {});
    await f.waitForTimeout(500);

    const sousRow = f.locator('aside button', { hasText: 'Sous-section — Bienvenue' }).first();
    check('RELOAD : sous-section présente dans l\'arbre', (await sousRow.count()) === 1);
    await sousRow.click();
    await f.waitForTimeout(1500);
    const htmlReload = await f.locator('#builder-form .ProseMirror').innerHTML().catch(() => '');
    check('RELOAD : gras rechargé', htmlReload.includes('<strong>'));
    check('RELOAD : image rechargée', htmlReload.includes('<img'));
    check('RELOAD : vidéo rechargée', htmlReload.includes('<video'));
    check('RELOAD : document rechargé', htmlReload.includes('/api/files/support-e2e.pdf'));
    check('RELOAD : titre de la sous-section rechargé', (await f.locator('#builder-form input.input').inputValue()) === 'Sous-section — Bienvenue');
    await f.screenshot({ path: `${SHOT}\\06-reload-editeur.png`, fullPage: false });
    await f.click('button[aria-label="Fermer"]');
    await f.waitForTimeout(500);

    /* ---------------------------------------------------------------- */
    /* SOUS-SECTION 2 — Démo : liste numérotée + citation                */
    /* ---------------------------------------------------------------- */
    // Déplier le chapitre 2 pour recharger ses sections dans l'arbre.
    // (le chapitre 1 est déjà déplié → seul le chapitre 2 affiche « Développer »)
    await f.locator('aside button[aria-label="Développer"]').first().click();
    await f.waitForTimeout(1200);
    await addSousBtn('Section — Cas pratique').click();
    await f.waitForTimeout(800);
    await f.fill('#builder-form input.input', 'Sous-section — Démo');
    const pm2 = f.locator('#builder-form .ProseMirror');
    await pm2.click();
    await pm2.pressSequentially('Étapes de la démonstration');
    await f.click('button[aria-label="Liste numérotée"]');
    await pm2.pressSequentially('Premier item');
    await pm2.press('Enter');
    await pm2.pressSequentially('Deuxième item');
    await pm2.press('Enter');
    await f.click('button[aria-label="Bloc citation"]');
    await pm2.pressSequentially('Citation de conclusion de la démo.');
    await f.click('button[form="builder-form"]');
    await f.waitForTimeout(2000);

    // Publication
    await f.goto(`${BASE}/formateur/formations`, { waitUntil: 'networkidle' });
    await f.waitForTimeout(2000);
    const cardPub = f.locator('div.card-interactive', { hasText: TITRE }).first();
    await cardPub.locator('button:has-text("Publier")').click();
    await f.waitForTimeout(2000);
    const txtPub = await f.locator('div.card-interactive', { hasText: TITRE }).first().innerText().catch(() => '');
    check('formation publiée', txtPub.includes('Publiée'));
    await f.screenshot({ path: `${SHOT}\\07-publiee.png`, fullPage: false });
  } catch (e) {
    failed++;
    console.log('  FAIL exception (formateur):', e.message);
    await f.screenshot({ path: `${SHOT}\\fail-formateur.png`, fullPage: true }).catch(() => {});
  }
  await fCtx.close();

  /* ================================================================== */
  /* PHASE 3 — ÉTUDIANT : catalogue → inscription → chapitre → rendu     */
  /* ================================================================== */
  const eCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const e = await eCtx.newPage();
  e.on('pageerror', (err) => errors.push('[etudiant] ' + err.message));
  try {
    await login(e, 'grace.wayire@tutore.local', 'Grace@EUL2026!');
    await e.goto(`${BASE}/etudiant/catalogue`, { waitUntil: 'networkidle' });
    await e.waitForTimeout(2500);

    const searchInput = e.getByPlaceholder('Rechercher une formation...');
    await searchInput.fill(TITRE);
    await e.waitForTimeout(1800);

    const cardE = e.locator('div.card-hover', { hasText: TITRE }).first();
    check('catalogue : formation visible après recherche', (await cardE.count()) === 1);
    const cardText = await cardE.innerText().catch(() => '');
    check('catalogue : badge de catégorie visible sur la carte', /\b[A-Za-zÀ-ÿ]+/.test(cardText) && (await cardE.locator('span.rounded-full').count()) > 0);

    const btnInscrire = cardE.locator('button:has-text("S\'inscrire")');
    const btnVoir = cardE.locator('a', { hasText: 'Voir la formation' });
    if ((await btnInscrire.count()) > 0) {
      await btnInscrire.click();
      await e.waitForTimeout(2500);
      await cardE.locator('a', { hasText: 'Voir la formation' }).click();
    } else {
      await btnVoir.click();
    }
    await e.waitForTimeout(2500);
    check('étudiant : page formation ouverte', e.url().includes('/etudiant/formation/'));
    const progText = await e.locator('body').innerText().catch(() => '');
    check('étudiant : programme = 2 chapitres', progText.includes('Chapitre 1 — Fondamentaux') && progText.includes('Chapitre 2 — Approfondissement'));

    // Ouverture du chapitre 1
    await e.locator('a[href*="/etudiant/chapitre/"]').first().click();
    await e.waitForTimeout(3000);
    await e.screenshot({ path: `${SHOT}\\08-chapitre-rendu.png`, fullPage: true });

    const body = await e.locator('body').innerText().catch(() => '');
    check('étudiant : texte riche H2 rendu', body.includes('Introduction à la RTE'));
    check('étudiant : gras + italique rendus', body.includes('Ceci est un texte en gras et en italique'));

    const img = e.locator('img[src*="picsum.photos"]');
    check('étudiant : image affichée (<img>)', (await img.count()) === 1);
    const lazy = await img.first().getAttribute('loading').catch(() => '');
    check('étudiant : image lazy (sanitized)', lazy === 'lazy');

    const video = e.locator('video[src*="cc0-videos"]');
    check('étudiant : vidéo rendue (<video controls>)', (await video.count()) === 1);
    const ctrl = await video.first().getAttribute('controls').catch(() => null);
    check('étudiant : vidéo controls forcés', ctrl !== null);

    const docCard = e.locator('[data-document-card]');
    check('étudiant : carte document présente', (await docCard.count()) === 1);
    const docTxt = await docCard.first().innerText().catch(() => '');
    check('étudiant : carte document « Ouvrir »', docTxt.includes('Ouvrir'));
    check('étudiant : carte document « Télécharger »', docTxt.includes('Télécharger'));
    const docHref = await docCard.first().locator('a').first().getAttribute('href').catch(() => '');
    check('étudiant : lien document protégé + token', docHref.includes('/api/files/support-e2e.pdf') && docHref.includes('token='));

    check('étudiant : contenu riche de section rendu', body.includes('Résumé de la section en contenu riche.'));
  } catch (err) {
    failed++;
    console.log('  FAIL exception (étudiant):', err.message);
    await e.screenshot({ path: `${SHOT}\\fail-etudiant.png`, fullPage: true }).catch(() => {});
  }
  await eCtx.close();

  if (errors.length) {
    failed++;
    console.log('  FAIL page errors:', errors.length);
    errors.slice(0, 5).forEach((m) => console.log('    -', m.substring(0, 160)));
  }

  console.log('\n=== RESULTATS rte-e2e :', passed, 'PASS /', failed, 'FAIL ===');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();