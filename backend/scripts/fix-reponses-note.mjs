import mysql from "mysql2/promise";

const c = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "freedb_Hs3YIOUt",
});

const [cols] = await c.query("SHOW COLUMNS FROM reponses_etudiants");
if (!cols.some((x) => x.Field === "note")) {
  await c.query(
    "ALTER TABLE reponses_etudiants ADD COLUMN note DECIMAL(5,2) NULL AFTER contenu",
  );
  console.log("Colonne note ajoutee.");
} else {
  console.log("Colonne note deja presente.");
}
const [after] = await c.query("SHOW COLUMNS FROM reponses_etudiants");
console.log(after.map((x) => x.Field).join(", "));
await c.end();
