const mysql = require('mysql2');
const conn = mysql.createConnection({ host: 'sql.freedb.tech', port: 3306, user: 'u_vKXPJU', password: 'nZeE0W2P1Ftr', database: 'freedb_Hs3YiOUt', charset: 'utf8mb4' });
conn.query("SELECT u.id_utilisateur, u.nom, u.prenom, u.email, r.libelle AS role FROM utilisateurs u JOIN roles r ON u.id_role = r.id_role WHERE r.libelle IN ('formateur','admin')", (err, rows) => {
  if (err) { console.error(err.message); process.exit(1); }
  rows.forEach(r => console.log(r.id_utilisateur, '|', r.role, '|', r.nom, r.prenom, '|', r.email));
  conn.end();
});