const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE-ERR:", m.text().slice(0, 300)); });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message.slice(0, 300)));

  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto("http://localhost:5180/formateur/formations", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Observe any .fixed.inset-0 overlay additions/removals
  await page.evaluate(() => {
    window.__events = [];
    const obs = new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.classList.contains("fixed") && n.classList.contains("inset-0")))
          window.__events.push("ADD:" + new Date().toISOString().slice(17, 23));
      }
      for (const n of m.removedNodes) {
        if (n.nodeType === 1 && (n.classList.contains("fixed") && n.classList.contains("inset-0")))
          window.__events.push("REMOVE:" + new Date().toISOString().slice(17, 23));
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });

  const del = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).first().locator("div.mt-4 button").last();
  await del.click();
  await page.waitForTimeout(1500);
  const evts = await page.evaluate(() => window.__events);
  console.log("événements overlay:", JSON.stringify(evts));

  const overlays = page.locator(".fixed.inset-0");
  console.log("overlays maintenant:", await overlays.count());
  const body = await page.locator("body").innerText();
  console.log("body contient 'Supprimer cette formation ?':", body.includes("Supprimer cette formation ?"));

  // Cliquer Publier (toggle) pour comparer
  const pub = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).first().locator("div.mt-4 button").first();
  await pub.click();
  await page.waitForTimeout(2000);
  const txt = await page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).first().innerText();
  console.log("après Publier, carte contient 'Publiée':", txt.includes("Publiée"));

  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });