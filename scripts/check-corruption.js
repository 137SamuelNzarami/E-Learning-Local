const mysql = require('mysql2');
const conn = mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'freedb_Hs3YIOUt', charset: 'utf8mb4' });

const tables = ['sections','chapitres','formations','quiz','questions','reponses','categories','avis','progression_chapitres'];

conn.query(`SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='freedb_Hs3YIOUt' AND DATA_TYPE IN ('varchar','text','longtext','mediumtext','char') ORDER BY TABLE_NAME, ORDINAL_POSITION`, (e1, rows) => {
  if (e1) { console.error('ERR:', e1.message); process.exit(1); }
  const byTable = {};
  rows.forEach(r => { (byTable[r.TABLE_NAME] = byTable[r.TABLE_NAME] || []).push(r.COLUMN_NAME); });
  const pk = { sections: 'id_section', chapitres: 'id_chapitre', formations: 'id_formation', quiz: 'id_quiz', questions: 'id_question', reponses: 'id_reponse', categories: 'id_categorie', avis: 'id_avis' };

  const run = (t) => new Promise((resolve) => {
    const cols = byTable[t];
    if (!cols || !cols.length) { resolve(); return; }
    const pkc = pk[t] || cols[0];
    const cond = cols.map(c => `HEX(${c}) LIKE '%EFBFBD%'`).join(' OR ');
    conn.query(`SELECT ${pkc} AS pk, ${cols.map(c => c).slice(0, 2).join(',')} FROM ${t} WHERE ${cond} LIMIT 20`, (e2, r2) => {
      if (e2) { console.log(`${t}: ERR ${e2.message}`); return resolve(); }
      if (r2.length) {
        console.log(`${t}: ${r2.length} row(s) affected:`);
        r2.forEach(r => console.log(`   - pk ${r.pk}: ${JSON.stringify(r).substring(0, 120)}`));
      } else {
        console.log(`${t}: clean`);
      }
      resolve();
    });
  });

  (async () => {
    for (const t of tables) await run(t);
    conn.end();
  })();
});