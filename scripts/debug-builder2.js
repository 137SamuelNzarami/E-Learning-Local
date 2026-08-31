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
  for (let i = 0; i < 10; i++) {
    const cards = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" });
    if (await cards.count() === 0) break;
    await cards.first().locator("div.mt-4 button").last().click();
    await page.waitForTimeout(500);
    await page.locator("button", { hasText: "Confirmer" }).click();
    await page.waitForTimeout(1200);
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
  for (const t of ["Chapitre 1 — Fondamentaux", "Chapitre 2 — Approfondissement"]) {
    await addChapterBtn.click();
    await page.waitForTimeout(500);
    await page.fill("#builder-form input.input", t);
    await page.click('button[form="builder-form"]');
    await page.waitForTimeout(1800);
  }

  const target = page.locator("button.btn-ghost").nth(1);
  console.log("innerText:", JSON.stringify(await target.innerText()));
  console.log("textContent:", JSON.stringify(await target.textContent()));
  console.log("ariaLabel:", JSON.stringify(await target.getAttribute("aria-label")));
  const html = await target.evaluate((el) => el.outerHTML);
  console.log("outerHTML:", html);

  console.log("regex test ^Section$ :", /^Section$/.test(await target.innerText()));
  console.log("regex test Section :", /Section/.test(await target.innerText()));

  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });