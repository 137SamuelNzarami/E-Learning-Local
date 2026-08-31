const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto("http://localhost:5180/formateur/formations", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // cleanup all
  for (let i = 0; i < 10; i++) {
    const cards = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" });
    if (await cards.count() === 0) break;
    await cards.first().locator("div.mt-4 button").last().click();
    await page.waitForTimeout(600);
    await page.locator("button", { hasText: "Confirmer" }).click();
    await page.waitForTimeout(1500);
  }

  await page.click('button:has-text("Nouvelle formation")');
  await page.waitForTimeout(600);
  await page.fill('input[placeholder*="Introduction à la programmation"]', "Formation RTE E2E");
  await page.fill('textarea[placeholder*="Décrivez brièvement"]', "probe");
  const sel = page.locator("form select.select");
  if (await sel.count() > 0) {
    const opts = await sel.locator("option").evaluateAll((o) => o.map((x) => x.value));
    if (opts.length > 1) await sel.selectOption(opts[1]);
  }
  await page.click('button:has-text("Créer la formation")');
  await page.locator('button:has-text("Créer la formation")').waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  await page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).first().locator("a", { hasText: "Construire" }).click();
  await page.waitForTimeout(2500);

  const addChapterBtn = page.locator("button.btn-primary", { hasText: "Chapitre" }).first();
  for (const titre of ["Chapitre 1 — Fondamentaux", "Chapitre 2 — Approfondissement"]) {
    await addChapterBtn.click();
    await page.waitForTimeout(600);
    await page.fill("#builder-form input.input", titre);
    await page.click('button[form="builder-form"]');
    await page.waitForTimeout(2000);
  }

  console.log("h3 chapitres:", JSON.stringify(await page.locator("h3", { hasText: "Chapitres" }).first().innerText()));

  // dump all ghost buttons + their text in main content
  const ghosts = page.locator("button.btn-ghost");
  console.log("nb button.btn-ghost:", await ghosts.count());
  console.log(await ghosts.evaluateAll((bs) => bs.map((b) => JSON.stringify(b.textContent.trim()))));

  // dump any button whose text is exactly 'Section'
  const sectBtns = page.locator("button", { hasText: /Section/ });
  console.log("boutons contenant 'Section':", await sectBtns.evaluateAll((bs) => bs.map((b) => JSON.stringify({ t: b.textContent.trim(), c: b.className.slice(0, 40) }))));

  // try clicking the first Section create button (btn-ghost, hasText /^Section$/)
  const addSectionBtn = page.locator("button.btn-ghost", { hasText: /^Section$/ });
  console.log("addSectionBtn count:", await addSectionBtn.count());
  try {
    await addSectionBtn.nth(0).click({ timeout: 8000 });
    await page.waitForTimeout(1200);
    console.log("clic section OK — modal:", await page.locator("#builder-form").count(), "| titre:", JSON.stringify(await page.locator("#builder-form h3").first().innerText().catch(() => "?")));
    await page.screenshot({ path: "D:\\E-LearnigLocal\\screenshots\\rte-e2e\\probe-section-modal.png", fullPage: false });
  } catch (e) {
    console.log("clic section KO:", e.message.split("\n")[0]);
  }

  const overlays = page.locator(".fixed.inset-0");
  console.log("overlays:", await overlays.count());
  if (await overlays.count() > 0) {
    console.log("overlay title:", await overlays.first().locator("h3").first().innerText().catch(() => "?"));
  }
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });