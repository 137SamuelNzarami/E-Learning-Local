const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message.slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE-ERR:", m.text().slice(0, 200)); });

  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto("http://localhost:5180/formateur/formations", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const card = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).first();
  console.log("nb cartes:", await page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).count());

  const actionBtns = card.locator("div.mt-4 button");
  console.log("boutons de la barre d'actions:", await actionBtns.evaluateAll((bs) => bs.map((b) => ({ text: b.textContent.trim(), cls: b.className, disabled: b.disabled }))));

  const allBtns = card.locator("button");
  console.log("tous les boutons de la carte:", await allBtns.evaluateAll((bs) => bs.map((b) => ({ text: b.textContent.trim(), cls: b.className.slice(0, 60) }))));

  // click delete
  const del = card.locator("div.mt-4 button").last();
  await del.scrollIntoViewIfNeeded();
  await del.click();
  await page.waitForTimeout(1200);

  const overlays = page.locator(".fixed.inset-0");
  console.log("overlays après clic corbeille:", await overlays.count());
  if (await overlays.count() > 0) {
    console.log("title modal:", await page.locator(".fixed.inset-0 h3").first().innerText().catch(() => "?"));
    console.log("boutons:", await page.locator(".fixed.inset-0 button").evaluateAll((bs) => bs.map((b) => b.textContent.trim()).filter(Boolean)));
  }

  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });