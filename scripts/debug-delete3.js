const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.stack || e.message));

  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto("http://localhost:5180/formateur/formations", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  errors.length = 0;

  const del = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).first().locator("div.mt-4 button").last();
  await del.click();
  await page.waitForTimeout(800);

  console.log("pageerrors après clic corbeille:", errors.length);
  errors.slice(0, 3).forEach((e) => console.log("  ---", e.slice(0, 500)));

  // Dump the trash button's React props handler presence
  const info = await del.evaluate((el) => {
    const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
    const props = key ? el[key] : null;
    return { hasKey: Boolean(key), onclick: props ? String(props.onClick) : "n/a" };
  });
  console.log("props bouton corbeille:", JSON.stringify(info, null, 2));

  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });