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
  const out = {};

  const [rc] = await conn.query("SHOW COLUMNS FROM reponses_etudiants");
  console.log("reponses_etudiants cols:", rc.map((r) => r.Field).join(", "));

  const q = async (label, sql, params) => {
    const [r] = await conn.query(sql, params || []);
    out[label] = r.affectedRows;
  };

  const [tids] = await conn.query(
    "SELECT id_tentative FROM tentatives WHERE id_utilisateur=8",
  );
  const ids = tids.map((t) => t.id_tentative);

  // Réponses des tentatives de l'utilisateur 8 (FK par tentative)
  const col = rc.map((r) => r.Field);
  const fkCol = col.includes("id_tentative")
    ? "id_tentative"
    : col.includes("tentative_id")
      ? "tentative_id"
      : null;
  if (fkCol && ids.length) {
    await q(
      "reponses_etudiants_u8",
      `DELETE FROM reponses_etudiants WHERE ${fkCol} IN (?)`,
      [ids],
    );
  } else {
    out.reponses_etudiants_u8 = "skip (aucune tentative)";
  }

  // Réponses (options QCM) de la question E2E 27
  await q("reponses_q27", "DELETE FROM reponses WHERE id_question=?", [27]);
  await q("question_27", "DELETE FROM questions WHERE id_question=?", [27]);

  await q(
    "tentatives_u8",
    "DELETE FROM tentatives WHERE id_utilisateur=?",
    [8],
  );
  await q(
    "inscriptions_u8",
    "DELETE FROM inscriptions WHERE id_utilisateur=?",
    [8],
  );
  await q(
    "progression_chapitres_u8",
    "DELETE FROM progression_chapitres WHERE id_utilisateur=?",
    [8],
  );
  await q(
    "progressions_u8",
    "DELETE FROM progressions WHERE id_utilisateur=?",
    [8],
  );
  await q(
    "notifications_u8",
    "DELETE FROM notifications WHERE id_utilisateur=?",
    [8],
  );
  await q("avis_u8", "DELETE FROM avis WHERE id_utilisateur=?", [8]);
  await q(
    "utilisateur_8",
    "DELETE FROM utilisateurs WHERE id_utilisateur=?",
    [8],
  );

  console.table(out);
  await conn.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
