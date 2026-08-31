const mysql = require("mysql2/promise");
(async () => {
  const c = await mysql.createConnection({ host: "localhost", user: "root", database: "elearningdb" });
  const [fs] = await c.query("SELECT id_formation, titre, statut FROM formations WHERE titre LIKE ?", ["%RTE E2E%"]);
  const [chs] = await c.query(
    "SELECT c.id_chapitre, c.titre, c.id_formation FROM chapitres c JOIN formations f USING(id_formation) WHERE f.titre LIKE ?",
    ["%RTE E2E%"]
  );
  const [ss] = await c.query(
    "SELECT s.id_section, s.titre, s.id_chapitre, s.contenu IS NOT NULL AS a_contenu FROM sections s JOIN chapitres c USING(id_chapitre) JOIN formations f USING(id_formation) WHERE f.titre LIKE ?",
    ["%RTE E2E%"]
  );
  console.log("=== formations ==="); console.table(fs);
  console.log("=== chapitres ==="); console.table(chs);
  console.log("=== sections ==="); console.table(ss);
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });