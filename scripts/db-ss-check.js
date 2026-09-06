const mysql = require("mysql2/promise");
import { env } from "./env.js";
(async () => {
  const c = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });
  const [rows] = await c.query(
    "SELECT ss.titre, ss.contenu FROM sous_sections ss JOIN sections s USING(id_section) JOIN chapitres ch USING(id_chapitre) JOIN formations f USING(id_formation) WHERE f.titre = 'Formation RTE E2E' AND ss.titre LIKE 'Sous-section%'",
  );
  for (const r of rows) {
    console.log("=====", r.titre, "=====");
    console.log(
      r.contenu ? r.contenu.replace(/\s+/g, " ").slice(0, 1500) : "(null)",
    );
  }
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
