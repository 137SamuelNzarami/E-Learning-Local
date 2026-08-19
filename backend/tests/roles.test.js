/**
 * Harnais « Rôles » (Phase 4) — unitaire, aucune DB requise.
 *
 * Exécution : node tests/roles.test.js
 *
 * Vérifie le middleware de rôles : 401 sans utilisateur authentifié,
 * 403 si le rôle n'est pas autorisé, passage au contrôleur sinon.
 */
import roleMiddleware from "../src/middlewares/role.middleware.js";
import ROLES from "../src/constants/role.js";

const results = [];
let suite = "R.roles";
let failures = 0;

function check(condition, label) {
  if (!condition) failures += 1;
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

let nextCalls = 0;
function next() {
  nextCalls += 1;
}

/* Pas d'utilisateur -> 401 */
const noUser = mockRes();
nextCalls = 0;
roleMiddleware(ROLES.ADMIN)({ user: null }, noUser, next);
check(noUser.statusCode === 401, "sans req.user -> 401");
check(noUser.body && noUser.body.success === false, "sans req.user -> success=false");
check(nextCalls === 0, "sans req.user -> next() non appelé");

/* Mauvais rôle -> 403 */
const wrongRole = mockRes();
nextCalls = 0;
roleMiddleware(ROLES.ADMIN)({ user: { role: ROLES.ETUDIANT } }, wrongRole, next);
check(wrongRole.statusCode === 403, "rôle non autorisé -> 403");
check(wrongRole.body && wrongRole.body.success === false, "rôle non autorisé -> success=false");
check(nextCalls === 0, "rôle non autorisé -> next() non appelé");

/* Bon rôle -> next() */
const good = mockRes();
nextCalls = 0;
roleMiddleware(ROLES.ADMIN)({ user: { role: ROLES.ADMIN } }, good, next);
check(good.statusCode === null && nextCalls === 1, "rôle autorisé -> next() appelé");

/* Plusieurs rôles autorisés */
const multi = mockRes();
nextCalls = 0;
roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR)({ user: { role: ROLES.FORMATEUR } }, multi, next);
check(nextCalls === 1, "formateur accepté avec plusieurs rôles autorisés");

/* Rôle étudiant sur route formateur+admin */
const stud = mockRes();
nextCalls = 0;
roleMiddleware(ROLES.ADMIN, ROLES.FORMATEUR)({ user: { role: ROLES.ETUDIANT } }, stud, next);
check(stud.statusCode === 403, "étudiant -> 403 sur route formateur+admin");

/* ------------------------------------------------------------------ */
console.log("--- Résultats ---");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.label}`);
}
console.log(`\nRÉSULTATS : ${results.length - failures} PASS / ${failures} FAIL`);
process.exit(failures > 0 ? 1 : 0);
