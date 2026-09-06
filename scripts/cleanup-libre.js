/**
 * Nettoyage du type LIBRE dans la base locale.
 *
 * Décision produit : QUIZ = QCM uniquement. Ce script :
 *  1. liste les questions LIBRE restantes (anciennes données de test) ;
 *  2. supprime leurs réponses étudiantes puis les questions elles-mêmes ;
 *  3. supprime les tentatives orphelines en A_CORRIGER (+ leurs réponses),
 *     puisque la correction manuelle n'existe plus ;
 *  4. affiche l'état avant / après.
 *
 * Exécution : NODE_PATH=backend\node_modules node scripts/cleanup-libre.js
 */
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

  const [libres] = await c.query(`
    SELECT qst.id_question, qst.enonce, qst.id_quiz, quiz.titre AS quiz, quiz.id_chapitre
    FROM questions qst
    JOIN quiz ON quiz.id_quiz = qst.id_quiz
    WHERE qst.type = 'LIBRE'
  `);
  console.log("--- QUESTIONS LIBRE TROUVEES ---");
  console.table(
    libres.map((l) => ({
      id_question: l.id_question,
      quiz: l.quiz,
      chapitre: l.id_chapitre,
      enonce: String(l.enonce).slice(0, 60),
    })),
  );

  const [aCorriger] = await c.query(
    "SELECT t.* FROM tentatives t WHERE t.statut = ?",
    ["A_CORRIGER"],
  );
  console.log("--- TENTATIVES A_CORRIGER ---");
  console.table(
    aCorriger.map((t) => ({
      id_tentative: t.id_tentative,
      id_quiz: t.id_quiz,
      id_utilisateur: t.id_utilisateur,
    })),
  );

  const idsLibres = libres.map((l) => l.id_question);
  const idsACorriger = aCorriger.map((t) => t.id_tentative);

  await c.beginTransaction();
  try {
    if (idsLibres.length) {
      const [r1] = await c.query(
        "DELETE FROM reponses_etudiants WHERE id_question IN (?)",
        [idsLibres],
      );
      console.log(
        `supprime ${r1.affectedRows} reponses_etudiants de questions LIBRE`,
      );
      const [r2] = await c.query(
        "DELETE FROM questions WHERE id_question IN (?)",
        [idsLibres],
      );
      console.log(`supprime ${r2.affectedRows} questions LIBRE`);
    }
    if (idsACorriger.length) {
      const [r3] = await c.query(
        "DELETE FROM reponses_etudiants WHERE id_tentative IN (?)",
        [idsACorriger],
      );
      console.log(
        `supprime ${r3.affectedRows} reponses_etudiants de tentatives A_CORRIGER`,
      );
      const [r4] = await c.query(
        "DELETE FROM tentatives WHERE id_tentative IN (?)",
        [idsACorriger],
      );
      console.log(`supprime ${r4.affectedRows} tentatives A_CORRIGER`);
    }
    await c.commit();
    console.log("COMMIT OK");
  } catch (e) {
    await c.rollback();
    throw e;
  }

  const [types] = await c.query(
    "SELECT type, COUNT(*) AS n FROM questions GROUP BY type",
  );
  console.log("--- TYPES DE QUESTIONS APRES ---");
  console.table(types);
  const [tent] = await c.query(
    "SELECT statut, COUNT(*) AS n FROM tentatives GROUP BY statut",
  );
  console.log("--- TENTATIVES PAR STATUT APRES ---");
  console.table(tent);

  await c.end();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
