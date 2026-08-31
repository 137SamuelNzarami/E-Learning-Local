const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (m) => {
    const t = m.type();
    if (t === "error" || t === "warning") logs.push("[" + t + "] " + m.text());
  });
  page.on("requestfailed", (r) =>
    logs.push("[REQFAIL] " + r.method() + " " + r.url() + " -> " + ((r.failure() || {}).errorText || "")),
  );
  page.on("response", (r) => {
    const s = r.status();
    if (s >= 400) logs.push("[HTTP " + s + "] " + r.url().replace("http://localhost:3010", "").replace("http://localhost:5180", ""));
  });
  page.on("pageerror", (e) => logs.push("[PAGEERR] " + e.message));

  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3500);
  console.log("URL apres login:", page.url());

  await page.goto("http://localhost:5180/formateur/formations/1", { waitUntil: "networkidle" });
  await page.waitForTimeout(6000);
  const body = await page.locator("body").innerText();
  console.log("HAS Aucun chapitre:", body.includes("Aucun chapitre"));
  console.log("HAS Chapitres:", body.includes("Chapitres"));
  console.log("HAS Sous-section:", body.includes("Sous-section"));
  console.log("--- LOGS ---");
  logs.slice(-30).forEach((x) => console.log("  " + x));
  console.log("--- TREE (extrait) ---");
  console.log(
    body
      .split("\n")
      .filter((l) => l.trim())
      .slice(-45)
      .join(" | ")
      .substring(0, 1800),
  );
  await browser.close();
})().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});