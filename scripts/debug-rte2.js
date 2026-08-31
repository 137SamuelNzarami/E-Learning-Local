const { chromium } = require("playwright");

function dump(label, html) {
  const s = String(html || "").replace(/\s+/g, " ").slice(0, 260);
  console.log("[" + label + "]", s);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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
  dump("apres frappe txt", await editor.innerHTML());
  await page.keyboard.press("Control+A");
  await page.locator('button[title="Titre principal"]').first().click();
  dump("apres H1", await editor.innerHTML());
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Paragraphe de démonstration du RichTextEditor (E2E).");
  dump("apres paragraphe", await editor.innerHTML());

  await page.keyboard.press("Enter");
  dump("apres Enter", await editor.innerHTML());
  await page.keyboard.type("Visitez la ressource E2E");
  dump("apres txt lien", await editor.innerHTML());
  await page.keyboard.press("Shift+Home");
  await page.locator('button[title="Lien"]').first().click();
  await page.locator('input[placeholder^="https://exemple.com"]').fill("https://example.com");
  dump("avant OK lien", await editor.innerHTML());
  await page.locator('button:has-text("OK")').click();
  dump("apres OK lien", await editor.innerHTML());
  await editor.evaluate((el) => el.focus());
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");

  await page.locator('button[title="Image par URL"]').first().click();
  await page.locator('input[placeholder^="https://.../image.jpg"]').fill("https://picsum.photos/640/360");
  await page.locator('button:has-text("Insérer")').click();
  dump("apres image", await editor.innerHTML());

  await page.locator('button[title="Vidéo par URL"]').first().click();
  await page.locator('input[placeholder^="https://.../video.mp4"]').fill("https://www.w3schools.com/html/mov_bbb.mp4");
  await page.locator('button:has-text("Insérer")').click();
  dump("apres video", await editor.innerHTML());

  await page.locator('button[title="Document (lien téléchargeable)"]').first().click();
  await page.locator('input[placeholder^="URL du document"]').fill("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
  await page.locator('input[placeholder^="Nom affiché"]').fill("E2E Support PDF");
  await page.locator('button:has-text("Insérer")').click();
  dump("apres document", await editor.innerHTML());

  await page.locator("#builder-form button", { hasText: "Aperçu" }).click();
  await page.waitForTimeout(800);
  if ((await page.locator("#builder-form .rte-content").count()) === 1) {
    dump("apercu #1", await page.locator("#builder-form .rte-content").innerHTML());
  }

  // Retour édition puis ENREGISTRER
  await page.locator("#builder-form button", { hasText: "Éditer" }).click();
  await page.locator('button[form="builder-form"]').click();
  await page.waitForFunction(() => !document.querySelector("#builder-form"), null, { timeout: 15000 });
  console.log("ENREGISTRE (form fermé)");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.locator('aside button[aria-label="Développer"]').first().click();
  await page.waitForTimeout(1200);
  const sectionBtn = page.locator("aside nav ol ol li").first().locator("button").first();
  console.log("sectionBtn count:", await sectionBtn.count());
  if ((await sectionBtn.count()) === 1) await sectionBtn.click();
  await page.waitForTimeout(1200);

  const overlays = await page.evaluate(() =>
    [...document.querySelectorAll("div.fixed.inset-0")].map((m) => ({
      z: getComputedStyle(m).zIndex,
      text: (m.innerText || "").split("\n").filter(Boolean).slice(0, 4).join(" | "),
    })),
  );
  console.log("OVERLAYS apres expand+section:", JSON.stringify(overlays));

  const li = page.locator('li[class*="rounded-md"]').filter({ has: page.locator("text=E2E") }).first();
  console.log("li candidat count:", await page.locator('li[class*="rounded-md"]').count());
  if ((await li.count()) === 1) {
    console.log("li text:", (await li.innerText()).slice(0, 60));
  }
  await browser.close();
})().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});