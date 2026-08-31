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

  const del = page.locator("div.card-interactive", { hasText: "Formation RTE E2E" }).first().locator("div.mt-4 button").last();

  // programmatic DOM click
  await del.evaluate((el) => el.click());
  await page.waitForTimeout(1000);
  console.log("après el.click(): overlays =", await page.locator(".fixed.inset-0").count());
  console.log("body contient 'Supprimer cette formation ?':", (await page.locator("body").innerText()).includes("Supprimer cette formation ?"));
  await page.locator(".fixed.inset-0 button", { hasText: "Annuler" }).click().catch(() => {});
  await page.waitForTimeout(500);

  // playwright real click, longer wait
  await del.click();
  await page.waitForTimeout(2500);
  console.log("après playwright click (2,5s): overlays =", await page.locator(".fixed.inset-0").count());
  await page.screenshot({ path: "D:\\E-LearnigLocal\\screenshots\\rte-e2e\\debug-del-ouvert.png", fullPage: false });

  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });