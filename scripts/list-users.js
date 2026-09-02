const mysql = require('mysql2');
const conn = mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'freedb_Hs3YIOUt', charset: 'utf8mb4' });
conn.query("SELECT u.id_utilisateur, u.nom, u.prenom, u.email, r.libelle AS role FROM utilisateurs u JOIN roles r ON u.id_role = r.id_role WHERE r.libelle IN ('formateur','admin')", (err, rows) => {
  if (err) { console.error(err.message); process.exit(1); }
  rows.forEach(r => console.log(r.id_utilisateur, '|', r.role, '|', r.nom, r.prenom, '|', r.email));
  conn.end();
});