const { chromium } = require("playwright");

async function dump(page, editor, label) {
  const dom = await editor.innerHTML();
  const sel = await page.evaluate(() => {
    const s = document.getSelection();
    return s ? { anchor: s.anchorOffset, focus: s.focusOffset, len: s.toString().length, isCollapsed: s.isCollapsed } : null;
  });
  console.log("[" + label + "] sel=" + JSON.stringify(sel));
  console.log("  " + dom.replace(/\s+/g, " "));
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
  await page.locator('button[title="Titre principal"]').click();
  await page.keyboard.press("Enter");
  await page.keyboard.type("Paragraphe de démonstration du RichTextEditor (E2E).");
  await page.keyboard.press("Enter");
  await page.locator('button[title="Liste à puces"]').click();
  await page.keyboard.type("Premier élément de liste");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second élément de liste");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("Visitez la ressource E2E");
  await page.keyboard.press("Shift+Home");
  await dump(page, editor, "avant lien (selection active)");
  await page.locator('button[title="Lien"]').click();
  await page.locator('input[placeholder^="https://exemple.com"]').fill("https://example.com");
  await page.locator('button:has-text("OK")').click();
  await page.waitForTimeout(300);
  await dump(page, editor, "apres OK");
  await page.keyboard.press("ArrowRight");
  await dump(page, editor, "apres ArrowRight");
  await page.keyboard.press("End");
  await dump(page, editor, "apres End");
  await page.keyboard.press("Enter");
  await dump(page, editor, "apres Enter");
  await browser.close();
})().catch((e) => { console.error("ERR", e); process.exit(1); });