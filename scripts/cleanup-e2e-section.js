import { env } from "./env.js";
const mysql = require("D:/E-LearnigLocal/backend/node_modules/mysql2/promise");
(async () => {
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });
  const [r] = await conn.query(
    "DELETE FROM sections WHERE titre LIKE 'E2E Section RTE%'",
  );
  console.log("deleted E2E sections:", r.affectedRows);
  await conn.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
