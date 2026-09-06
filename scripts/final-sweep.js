const mysql = require("D:/E-LearnigLocal/backend/node_modules/mysql2/promise");
import { env } from "./env.js";
(async () => {
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });
  const [sec] = await conn.query(
    "SELECT s.id_section, s.id_chapitre, c.titre AS chap, s.titre, LEFT(s.contenu,60) AS contenu FROM sections s JOIN chapitres c ON c.id_chapitre=s.id_chapitre WHERE s.titre LIKE '%E2E%' OR s.titre LIKE '%TEST%' OR s.titre LIKE '%test%' OR s.titre LIKE '%e2e%'",
  );
  console.table(sec);
  await conn.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
