const mysql = require('D:/E-LearnigLocal/backend/node_modules/mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: 'sql.freedb.tech', port: 3306, user: 'u_vKXPJU', password: 'nZeE0W2P1Ftr', database: 'freedb_Hs3YiOUt' });
  const [sec] = await conn.query("SELECT s.id_section, s.id_chapitre, c.titre AS chap, s.titre, LEFT(s.contenu,60) AS contenu FROM sections s JOIN chapitres c ON c.id_chapitre=s.id_chapitre WHERE s.titre LIKE '%E2E%' OR s.titre LIKE '%TEST%' OR s.titre LIKE '%test%' OR s.titre LIKE '%e2e%'");
  console.table(sec);
  await conn.end();
})().catch(e => { console.error(e.message); process.exit(1); });