const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:5180/login", { waitUntil: "networkidle" });
  await page.fill("#email", "grace.wayire@tutore.local");
  await page.fill("#mot_de_passe", "Grace@EUL2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !String(u.pathname).startsWith("/login"), { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);

  await page.goto("http://localhost:5180/etudiant/chapitre/1", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const box = page.locator("#sous-section-30");
  console.log("box count:", await box.count());
  if ((await box.count()) === 1) {
    const rte = box.locator(".rte-content").first();
    console.log("rte count:", await rte.count());
    if ((await rte.count()) === 1) {
      const html = await rte.innerHTML();
      console.log("RTE HTML (len " + html.length + "):");
      console.log(html.slice(0, 2200));
      console.log("---");
      console.log("has picsum:", html.includes("picsum.photos"));
      console.log("has <img:", /<img/i.test(html));
      console.log("has mov_bbb:", html.includes("mov_bbb.mp4"));
      console.log("has <video:", /<video/i.test(html));
      console.log("has example.com:", html.includes("example.com"));
      console.log("has Visitez:", html.includes("Visitez"));
      console.log("has dummy.pdf:", html.includes("dummy.pdf"));
      console.log("has E2E Support PDF:", html.includes("E2E Support PDF"));
    }
  } else {
    console.log("TEXT:", (await box.first().innerText().catch(() => "")).slice(0, 300));
  }
  await browser.close();
})().catch((e) => { console.error("ERR", e); process.exit(1); });