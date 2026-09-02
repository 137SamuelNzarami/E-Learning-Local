const mysql = require('D:/E-LearnigLocal/backend/node_modules/mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: 'sql.freedb.tech', port: 3306, user: 'u_vKXPJU', password: 'nZeE0W2P1Ftr', database: 'freedb_Hs3YiOUt' });
  const [qc] = await conn.query("SHOW COLUMNS FROM questions");
  console.log('questions cols:', qc.map(r => r.Field).join(', '));
  const [q] = await conn.query("SELECT * FROM questions WHERE id_question=27");
  console.log('question 27:', q);
  const [t] = await conn.query("SELECT id_tentative, id_utilisateur, id_quiz, statut, note FROM tentatives WHERE statut='EN_COURS'");
  console.log('tentatives EN_COURS:', t);
  const [alln] = await conn.query("SELECT id_tentative, id_utilisateur, id_quiz, statut FROM tentatives ORDER BY id_tentative");
  console.table(alln);
  for (const table of ['reponses_etudiants','tentatives','inscriptions','progression_chapitres','avis','notifications']) {
    try {
      const [r] = await conn.query(`SELECT COUNT(*) AS n FROM ${table} WHERE id_utilisateur=8`);
      console.log(`user8 :: ${table}:`, r[0].n);
    } catch (e) { console.log(`user8 :: ${table}: (pas de colonne) ${e.message}`); }
  }
  const [conv] = await conn.query("SELECT id_conversation FROM participant_conversations GROUP BY id_conversation");
  console.log('conversations avec participants:', conv.length);
  const [convUsers] = await conn.query("SELECT * FROM participant_conversations");
  console.table(convUsers);
  await conn.end();
})().catch(e => { console.error(e.message); process.exit(1); });