const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !String(u.pathname).startsWith("/login"), { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
  const contenu = await page.evaluate(async () => {
    const token = localStorage.getItem("eul_token");
    const res = await fetch("http://localhost:3010/api/sous-sections/31", { headers: { Authorization: "Bearer " + token } });
    if (!res.ok) return "HTTP " + res.status;
    const json = await res.json();
    return JSON.stringify(json.data?.contenu ?? json);
  });
  console.log(contenu);
  await browser.close();
})().catch((e) => { console.error("ERR", e); process.exit(1); });