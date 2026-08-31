const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("console", (m) => {
    const t = m.text();
    if (t.includes("[RTE")) logs.push(t);
  });

  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !String(u.pathname).startsWith("/login"), { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);

  await page.goto("http://localhost:5180/formateur/formations/1", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('aside button[aria-label="Développer"]').first().click();
  await page.waitForTimeout(1200);
  await page.locator("button", { hasText: "Sous-section" }).first().click();
  await page.waitForTimeout(800);

  const editor = page.locator('#builder-form [contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.type("Titre principal E2E");
  console.log("--- h1 toggle ---");
  await page.keyboard.press("Control+A");
  await page.locator('button[title="Titre principal"]').first().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  console.log("--- para ---");
  await page.keyboard.type("Paragraphe de démonstration du RichTextEditor (E2E).");
  console.log("--- APRES PARA : editor html ---");
  console.log(await editor.innerHTML());

  console.log("--- LOGS RTE ---");
  logs.forEach((l) => console.log("  " + l.slice(0, 340)));
  await browser.close();
})().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});