/**
 * Harnais « Routes HTTP » (Phase 4) — intégration.
 *
 * Exécution : node tests/http-routes.test.js
 *
 * Démarre l'application Express sur un port éphémère, signe de vrais
 * JWT (admin / formateur / étudiant) et vérifie le cloisonnement par
 * rôle de chaque route sensible.
 */
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import pool from "../src/config/database.js";
import ROLES from "../src/constants/role.js";

const results = [];
let failures = 0;
const suite = "HTTP";

function check(condition, label) {
  if (!condition) failures += 1;
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

const users = {};

async function getRealUser(roleLabel) {
  const [rows] = await pool.query(
    `SELECT u.id_utilisateur, r.libelle AS role, u.email
     FROM utilisateurs u
     INNER JOIN roles r ON u.id_role = r.id_role
     WHERE r.libelle = ?
     LIMIT 1`,
    [roleLabel],
  );
  if (rows.length === 0) {
    throw new Error(`Aucun utilisateur du rôle "${roleLabel}" trouvé en base.`);
  }
  const u = rows[0];
  return jwt.sign(
    { id: u.id_utilisateur, role: u.role, email: u.email },
    process.env.JWT_SECRET,
  );
}

async function main() {
  users.admin = await getRealUser(ROLES.ADMIN);
  users.formateur = await getRealUser(ROLES.FORMATEUR);
  users.etudiant = await getRealUser(ROLES.ETUDIANT);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, token) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { method, headers });
    return { status: res.status };
  };

  const A = users.admin;
  const F = users.formateur;
  const S = users.etudiant;

  /* --- Authentification --- */
  check((await call("GET", "/api/formations")).status === 401, "sans token -> 401");
  check((await call("GET", "/api/formations", "token.invalide")).status === 401, "token invalide -> 401");

  /* --- Formations --- */
  check((await call("GET", "/api/formations", S)).status === 200, "GET /formations étudiant -> 200");
  check((await call("POST", "/api/formations", S)).status === 403, "POST /formations étudiant -> 403");
  check((await call("PUT", "/api/formations/1", S)).status === 403, "PUT /formations étudiant -> 403");
  check((await call("DELETE", "/api/formations/1", S)).status === 403, "DELETE /formations étudiant -> 403");

  /* --- Avis --- */
  check((await call("GET", "/api/reviews", S)).status === 403, "GET /reviews étudiant -> 403");
  check((await call("GET", "/api/reviews", F)).status === 403, "GET /reviews formateur -> 403");
  check((await call("GET", "/api/reviews", A)).status === 200, "GET /reviews admin -> 200");

  /* --- Conversations --- */
  check((await call("GET", "/api/conversations", S)).status === 403, "GET /conversations étudiant -> 403");
  check((await call("GET", "/api/conversations", A)).status === 200, "GET /conversations admin -> 200");

  /* --- Participants --- */
  check((await call("GET", "/api/conversation-participants", F)).status === 403, "GET /participants formateur -> 403");
  check((await call("GET", "/api/conversation-participants", A)).status === 200, "GET /participants admin -> 200");

  /* --- Messages --- */
  check((await call("GET", "/api/messages", F)).status === 403, "GET /messages formateur -> 403");
  check((await call("GET", "/api/messages", A)).status === 200, "GET /messages admin -> 200");

  /* --- Notifications --- */
  check((await call("GET", "/api/notifications", S)).status === 403, "GET /notifications étudiant -> 403");
  check((await call("GET", "/api/notifications", A)).status === 200, "GET /notifications admin -> 200");

  /* --- Réponses (corrigé) --- */
  check((await call("GET", "/api/answers", S)).status === 403, "GET /answers étudiant -> 403");
  check((await call("GET", "/api/answers", F)).status === 200, "GET /answers formateur -> 200");
  check((await call("POST", "/api/answers", S)).status === 403, "POST /answers étudiant -> 403");

  /* --- Inscriptions / progressions / tentatives / soumissions / réponses-étudiants --- */
  check((await call("GET", "/api/enrollments", S)).status === 403, "GET /enrollments étudiant -> 403");
  check((await call("GET", "/api/enrollments", F)).status === 200, "GET /enrollments formateur -> 200");
  check((await call("GET", "/api/progressions", S)).status === 403, "GET /progressions étudiant -> 403");
  check((await call("GET", "/api/attempts", S)).status === 403, "GET /attempts étudiant -> 403");
  check((await call("GET", "/api/student-answers", S)).status === 403, "GET /student-answers étudiant -> 403");
  check((await call("GET", "/api/submissions", S)).status === 403, "GET /submissions étudiant -> 403");

  /* --- Quiz / questions --- */
  check((await call("POST", "/api/quizzes", S)).status === 403, "POST /quizzes étudiant -> 403");
  check((await call("POST", "/api/questions", S)).status === 403, "POST /questions étudiant -> 403");
  check((await call("PUT", "/api/questions/1", S)).status === 403, "PUT /questions étudiant -> 403");

  /* --- Utilisateurs --- */
  check((await call("GET", "/api/users", S)).status === 403, "GET /users étudiant -> 403");
  check((await call("GET", "/api/users", A)).status === 200, "GET /users admin -> 200");

  /* --- Divers --- */
  check((await call("GET", "/api/test-db")).status === 200, "GET /api/test-db -> 200");
  check((await call("GET", "/api/route-inexistante", A)).status === 404, "route inconnue -> 404");

  await new Promise((resolve) => server.close(resolve));
  await pool.end();

  console.log("--- Résultats ---");
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.label}`);
  }
  console.log(`\nRÉSULTATS : ${results.length - failures} PASS / ${failures} FAIL`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("ERREUR FATALE :", err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(2);
});
