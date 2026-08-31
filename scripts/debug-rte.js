const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("pageerror", (e) => logs.push("[PAGEERR] " + e.message));

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

  console.log("[checkbox] #builder-form count:", await page.locator("#builder-form").count());
  console.log("[toolbar] boutons Titre principal:", await page.locator('button[title="Titre principal"]').count());
  console.log("[editor] contenteditable count:", await page.locator('#builder-form [contenteditable="true"]').count());

  const editor = page.locator('#builder-form [contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.type("Titre principal E2E");
  await page.keyboard.press("Control+A");
  await page.locator('button[title="Titre principal"]').first().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Paragraphe de démonstration du RichTextEditor (E2E).");
  await page.keyboard.press("Enter");

  const htmlMid = await editor.innerHTML();
  console.log("[editor] HTML apres paragraphe:", htmlMid.replace(/<\//g, "</").slice(0, 400));

  await page.keyboard.type("Visitez la ressource E2E");
  await page.keyboard.press("Shift+Home");
  await page.locator('button[title="Lien"]').first().click();
  await page.locator('input[placeholder^="https://exemple.com"]').fill("https://example.com");
  await page.locator('button:has-text("OK")').click();
  await editor.evaluate((el) => el.focus());
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");

  const htmlLink = await editor.innerHTML();
  console.log("[editor] HTML apres lien:", htmlLink.slice(-500));

  await page.locator('button[title="Image par URL"]').first().click();
  await page.locator('input[placeholder^="https://.../image.jpg"]').fill("https://picsum.photos/640/360");
  await page.locator('button:has-text("Insérer")').click();

  await page.locator('button[title="Vidéo par URL"]').first().click();
  await page.locator('input[placeholder^="https://.../video.mp4"]').fill("https://www.w3schools.com/html/mov_bbb.mp4");
  await page.locator('button:has-text("Insérer")').click();

  await page.locator('button[title="Document (lien téléchargeable)"]').first().click();
  await page.locator('input[placeholder^="URL du document"]').fill("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
  await page.locator('input[placeholder^="Nom affiché"]').fill("E2E Support PDF");
  await page.locator('button:has-text("Insérer")').click();
  await page.waitForTimeout(500);

  const htmlFinal = await editor.innerHTML();
  console.log("[editor] HTML final (len", htmlFinal.length, "):", htmlFinal.slice(0, 1200));

  await page.locator("#builder-form button", { hasText: "Aperçu" }).click();
  await page.waitForTimeout(800);
  const preview = page.locator("#builder-form .rte-content");
  console.log("[preview] .rte-content count:", await preview.count());
  if ((await preview.count()) === 1) {
    const p = await preview.innerHTML();
    console.log("[preview] HTML (len", p.length, "):", p.slice(0, 1500));
    const t = await preview.innerText();
    console.log("[preview] TEXT:", (t || "").split("\n").filter(Boolean).join(" | "));
  }
  console.log("--- PAGE ERRORS ---");
  logs.forEach((x) => console.log("  " + x));

  // Simule le clic d'édition impossible : vérifier modals ouverts
  const modals = await page.evaluate(() =>
    [...document.querySelectorAll("div.fixed.inset-0")].map((m) => ({
      z: getComputedStyle(m).zIndex,
      cls: m.className,
      text: (m.innerText || "").split("\n").filter(Boolean).slice(0, 3).join(" | "),
    })),
  );
  console.log("[modals] overlays fixes:", JSON.stringify(modals, null, 1));

  await browser.close();
})().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});