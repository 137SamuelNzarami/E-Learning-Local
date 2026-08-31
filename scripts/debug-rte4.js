const { chromium } = require("playwright");

async function main() {
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
  await page.keyboard.press("Control+A");
  await page.locator('button[title="Titre principal"]').first().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");

  console.log("===== STEP PARA =====");
  await page.keyboard.type("Paragraphe de démonstration du RichTextEditor (E2E).");
  console.log("[dom]", (await editor.innerHTML()).replace(/\s+/g, " "));

  console.log("===== STEP VISITEZ+LINK =====");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Visitez la ressource E2E");
  await page.keyboard.press("Shift+Home");
  await page.locator('button[title="Lien"]').first().click();
  await page.locator('input[placeholder^="https://exemple.com"]').fill("https://example.com");
  await page.locator('button:has-text("OK")').click();
  await editor.evaluate((el) => el.focus());
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  console.log("[dom]", (await editor.innerHTML()).replace(/\s+/g, " "));

  console.log("===== STEP IMAGE =====");
  await page.locator('button[title="Image par URL"]').first().click();
  await page.locator('input[placeholder^="https://.../image.jpg"]').fill("https://picsum.photos/640/360");
  await page.locator('button:has-text("Insérer")').first().click();
  console.log("[dom]", (await editor.innerHTML()).replace(/\s+/g, " "));

  console.log("===== STEP VIDEO =====");
  await page.locator('button[title="Vidéo par URL"]').first().click();
  await page.locator('input[placeholder^="https://.../video.mp4"]').fill("https://www.w3schools.com/html/mov_bbb.mp4");
  await page.locator('button:has-text("Insérer")').first().click();
  console.log("[dom]", (await editor.innerHTML()).replace(/\s+/g, " "));

  console.log("===== STEP DOC =====");
  await page.locator('button[title="Document (lien téléchargeable)"]').first().click();
  await page.locator('input[placeholder^="URL du document"]').fill("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
  await page.locator('input[placeholder^="Nom affiché"]').fill("E2E Support PDF");
  await page.locator('button:has-text("Insérer")').first().click();
  await page.waitForTimeout(400);
  console.log("[dom]", (await editor.innerHTML()).replace(/\s+/g, " "));

  await page.locator("#builder-form button", { hasText: "Aperçu" }).click();
  await page.waitForTimeout(600);
  const p = page.locator("#builder-form .rte-content");
  if ((await p.count()) === 1) {
    console.log("[preview]", (await p.innerHTML()).replace(/\s+/g, " "));
  }

  console.log("===== LOGS RTE (lignes contenant img/video/h1 ou CHANGEMENTS DE DOC)=====");
  let prev = "";
  logs.forEach((l, i) => {
    const s = l.slice(0, 220);
    if (/h1|img|video|dummy|example\.com|<a /.test(s)) console.log("  ", s);
  });
  await browser.close();
}
main().catch((e) => { console.error("ERR", e); process.exit(1); });