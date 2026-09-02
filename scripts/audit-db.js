const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'freedb_Hs3YIOUt' });
  const [qui] = await c.query(`
    SELECT q.id_quiz, q.titre AS quiz,
      COUNT(CASE WHEN qst.type='LIBRE' THEN 1 END) AS libres,
      COUNT(qst.id_question) AS total
    FROM quiz q LEFT JOIN questions qst ON qst.id_quiz = q.id_quiz
    GROUP BY q.id_quiz ORDER BY q.id_quiz
  `);
  console.log('--- QUESTIONS PAR QUIZ ---');
  console.table(qui);
  const libres = qui.reduce((s, r) => s + (r.libres || 0), 0);
  console.log(`-> questions libres au total : ${libres} (doit être 0)`);
  if (libres !== 0) {
    console.error('INVARIANT VIOLÉ : des questions libres subsistent (type LIBRE retiré du produit).');
    process.exitCode = 1;
  }
  const [types] = await c.query('SELECT type, COUNT(*) AS n FROM questions GROUP BY type');
  console.log('--- TYPES DE QUESTIONS ---');
  console.table(types);
  const [users] = await c.query(
    'SELECT u.id_utilisateur, u.nom, u.prenom, u.email, r.libelle AS role FROM utilisateurs u JOIN roles r ON u.id_role = r.id_role ORDER BY u.id_utilisateur'
  );
  console.log('--- USERS ---');
  console.table(users);
  const [tent] = await c.query('SELECT statut, COUNT(*) AS n FROM tentatives GROUP BY statut');
  console.log('--- TENTATIVES PAR STATUT ---');
  console.table(tent);
  const [stats] = await c.query('SELECT (SELECT COUNT(*) FROM formations) AS formations, (SELECT COUNT(*) FROM chapitres) AS chapitres, (SELECT COUNT(*) FROM sections) AS sections, (SELECT COUNT(*) FROM sous_sections) AS sous_sections');
  console.log('--- COMPTES ---');
  console.table(stats);
  await c.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });