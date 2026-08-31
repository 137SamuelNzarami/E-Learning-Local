const { chromium } = require("playwright");

const BASE = "http://localhost:5180";
const TITRE = "Formation RTE E2E";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message.slice(0, 300)));

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  await page.goto(`${BASE}/formateur/formations`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // cleanup
  for (let i = 0; i < 5; i++) {
    const cards = page.locator("div.card-interactive", { hasText: TITRE });
    if (await cards.count() === 0) { console.log("cleanup: plus de carte"); break; }
    const del = cards.first().locator("div.mt-4.flex.items-center.gap-2 button").last();
    await del.click();
    await page.waitForTimeout(600);
    const confirm = page.locator("button", { hasText: "Confirmer" });
    if (await confirm.count() > 0) { await confirm.click(); await page.waitForTimeout(1500); }
    console.log("cleanup: carte supprimée");
  }

  await page.click('button:has-text("Nouvelle formation")');
  await page.waitForTimeout(600);
  await page.fill('input[placeholder*="Introduction à la programmation"]', TITRE);
  await page.fill('textarea[placeholder*="Décrivez brièvement"]', "Formation de test E2E du RichTextEditor.");
  const catSelect = page.locator("form select.select");
  if (await catSelect.count() > 0) {
    const opts = await catSelect.locator("option").evaluateAll((o) => o.map((x) => x.value));
    console.log("options catégorie:", JSON.stringify(opts));
    if (opts.length > 1) await catSelect.selectOption(opts[1]);
  }
  await page.click('button:has-text("Créer la formation")');
  await page.waitForTimeout(2500);

  const card = page.locator("div.card-interactive", { hasText: TITRE }).first();
  console.log("carte présente:", await card.count());
  await card.locator("a", { hasText: "Construire" }).click();
  await page.waitForTimeout(2500);
  console.log("URL builder:", page.url());

  // add chapter 1
  await page.click('button:has-text("Chapitre")').catch((e) => console.log("click Chapitre 1 ERR:", e.message.slice(0, 200)));
  await page.waitForTimeout(800);
  console.log("[ch1] modal présente:", await page.locator("#builder-form").count());
  console.log("[ch1] boutons 'Enregistrer':", await page.locator("button:has-text('Enregistrer')").count());
  await page.fill("#builder-form input.input", "Chapitre 1 — Fondamentaux");
  await page.click('button[form="builder-form"]');
  await page.waitForTimeout(2000);
  let h3 = await page.locator("h3", { hasText: "Chapitres" }).innerText().catch((e) => "H3ERR:" + e.message.slice(0, 100));
  console.log("[ch1] h3 =", JSON.stringify(h3));

  // add chapter 2
  const chBtns = await page.locator("button:has-text('Chapitre')").count();
  console.log("[avant ch2] nombre boutons contenant 'Chapitre':", chBtns);
  await page.click('button:has-text("Chapitre")').catch((e) => console.log("click Chapitre 2 ERR:", e.message.slice(0, 200)));
  await page.waitForTimeout(800);
  console.log("[ch2] modal présente:", await page.locator("#builder-form").count());
  console.log("[ch2] input présent:", await page.locator("#builder-form input.input").count());
  await page.fill("#builder-form input.input", "Chapitre 2 — Approfondissement");
  await page.click('button[form="builder-form"]').catch((e) => console.log("click save ch2 ERR:", e.message.slice(0, 200)));
  await page.waitForTimeout(2000);
  h3 = await page.locator("h3", { hasText: "Chapitres" }).innerText().catch((e) => "H3ERR:" + e.message.slice(0, 100));
  console.log("[ch2] h3 =", JSON.stringify(h3));
  console.log("[ch2] modal encore ouverte:", await page.locator("#builder-form").count());

  const sectBtns = page.locator("button", { hasText: /Section$/ });
  console.log("[fin] boutons 'Section':", await sectBtns.count());
  const chCount = await page.locator("h3", { hasText: "Chapitres" }).innerText().catch(() => "");
  console.log("[fin] h3 final =", JSON.stringify(chCount));

  await page.screenshot({ path: "D:\\E-LearnigLocal\\screenshots\\rte-e2e\\debug-rte7.png", fullPage: true });
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });