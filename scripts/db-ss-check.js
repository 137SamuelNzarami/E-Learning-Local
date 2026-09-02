const mysql = require("mysql2/promise");
(async () => {
  const c = await mysql.createConnection({ host: "sql.freedb.tech", user: "u_vKXPJU", password: "nZeE0W2P1Ftr", database: "freedb_Hs3YiOUt" });
  const [rows] = await c.query(
    "SELECT ss.titre, ss.contenu FROM sous_sections ss JOIN sections s USING(id_section) JOIN chapitres ch USING(id_chapitre) JOIN formations f USING(id_formation) WHERE f.titre = 'Formation RTE E2E' AND ss.titre LIKE 'Sous-section%'"
  );
  for (const r of rows) {
    console.log("=====", r.titre, "=====");
    console.log(r.contenu ? r.contenu.replace(/\s+/g, " ").slice(0, 1500) : "(null)");
  }
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });