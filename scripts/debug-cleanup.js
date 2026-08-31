const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message.slice(0, 200)));
  page.on("dialog", (d) => { console.log("DIALOG:", d.type(), d.message().slice(0, 120)); d.dismiss().catch(() => {}); });

  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto("http://localhost:5180/formateur/formations", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const cards = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" });
  const n = await cards.count();
  console.log("cartes RTE E2E:", n);
  for (let i = 0; i < n && i < 20; i++) {
    const cur = await cards.count();
    if (cur === 0) { console.log("plus de cartes à l'itération", i); break; }
    const first = cards.first();
    const titre = await first.locator("h3").innerText().catch(() => "?");
    console.log("itération", i, "- titre:", JSON.stringify(titre), "- nb cartes:", cur);
    const del = first.locator("div.mt-4.flex.items-center.gap-2 button").last();
    await del.click();
    await page.waitForTimeout(800);
    const modalCount = await page.locator(".fixed.inset-0").count();
    console.log("  overlays visibles:", modalCount);
    const btns = await page.locator(".fixed.inset-0 button").evaluateAll((bs) => bs.map((b) => b.textContent.trim()).filter(Boolean));
    console.log("  boutons overlay:", JSON.stringify(btns));
    const conf = page.locator("button", { hasText: "Confirmer" });
    if (await conf.count() > 0) {
      await conf.click();
      await page.waitForTimeout(1800);
      console.log("  confirm cliqué");
    } else {
      console.log("  AUCUN bouton Confirmer — abandon");
      await page.screenshot({ path: "D:\\E-LearnigLocal\\screenshots\\rte-e2e\\probe-cleanup.png", fullPage: true });
      break;
    }
  }
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });