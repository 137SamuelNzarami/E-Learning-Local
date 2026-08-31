const { chromium } = require("playwright");

function toC(text) { return text.replace(/\s+/g, " ").slice(0, 400); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message.slice(0, 200)));
  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "jean.paul@tutore.local");
  await page.fill("#mot_de_passe", "Jean@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto("http://localhost:5180/formateur/formations/1", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('aside button[aria-label="Développer"]').first().click();
  await page.waitForTimeout(1200);
  await page.locator("button", { hasText: "Sous-section" }).first().click();
  await page.waitForTimeout(800);

  const pm = page.locator("#builder-form .ProseMirror").first();
  const html = async (l) => console.log("[" + l + "] " + toC(await pm.innerHTML()));

  await pm.click();
  await pm.pressSequentially("Introduction à la RTE");
  await page.locator('button[aria-label="Titre section"]').click();
  await html("apres H2");
  await pm.press("Enter");
  await pm.pressSequentially("Ceci est un texte en gras et en italique. Il présente la plateforme.");
  await html("apres saisie");

  await pm.press("Home");
  await html("apres Home");

  await page.keyboard.down("Shift");
  await pm.press("End");
  await page.keyboard.up("Shift");
  const sel1 = await page.evaluate(() => { const s = document.getSelection(); return s.toString(); });
  console.log("[selection] =", JSON.stringify(sel1));
  await html("apres selection");

  await page.locator('button[aria-label="Gras"]').click();
  await html("apres Gras");

  await page.locator('button[aria-label="Italique"]').click();
  await html("apres Italique");

  await pm.evaluate(() => {
    const s = window.getSelection();
    if (s.rangeCount) {
      const r = s.getRangeAt(0);
      r.collapse(false); // fin du texte sélectionné
      s.removeAllRanges();
      s.addRange(r);
    }
  });
  await html("apres collapse DOM");

  await pm.press("Enter");
  await html("apres Enter");

  // Image
  await page.locator('button[aria-label="Image par URL"]').click();
  await page.waitForTimeout(300);
  await page.fill('input[placeholder*="image.jpg"]', "https://picsum.photos/seed/eul-rte/800/400");
  await page.locator('button:has-text("Insérer")').click();
  await page.waitForTimeout(600);
  await html("apres Image");

  // Vidéo
  await page.locator('button[aria-label="Vidéo par URL"]').click();
  await page.waitForTimeout(300);
  await page.fill('input[placeholder*="video.mp4"]', "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
  await page.locator('button:has-text("Insérer")').click();
  await page.waitForTimeout(600);
  await html("apres Vidéo");

  // Document
  await page.locator('button[aria-label="Document (lien téléchargeable)"]').click();
  await page.waitForTimeout(300);
  await page.fill('input[placeholder*="URL du document"]', "/api/files/support-e2e.pdf");
  await page.fill('input[placeholder*="Nom affiché"]', "Support de cours E2E");
  await page.locator('button:has-text("Insérer")').click();
  await page.waitForTimeout(600);
  await html("apres Document");

  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });