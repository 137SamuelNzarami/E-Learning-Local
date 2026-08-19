/**
 * Harnais « Fonctionnalités finalisées » (Phase 4).
 *
 * Exécution : node tests/features.test.js
 *
 * Couvre :
 * - Contrat de validation unifié : 422 + `[{ field, message }]`
 * - Pagination sur les listes (users, notifications, messages)
 * - Notifications « marquer comme lue » : PATCH /:id/lu (+ IDOR),
 *   GET /unread, GET /count-unread
 * - Changement de mot de passe : PUT /api/auth/password
 * - Rate limiting sans rupture du flux normal de connexion
 */
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import pool from "../src/config/database.js";
import ROLES from "../src/constants/role.js";

const results = [];
let failures = 0;
const suite = "FEATURES";

function check(condition, label) {
  if (!condition) failures += 1;
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

function signUser({ id_utilisateur, role, email }) {
  return jwt.sign(
    { id: id_utilisateur, role, email },
    process.env.JWT_SECRET,
  );
}

async function getRealUsers(roleLabel, limit = 1) {
  const [rows] = await pool.query(
    `SELECT u.id_utilisateur, r.libelle AS role, u.email
     FROM utilisateurs u
     INNER JOIN roles r ON u.id_role = r.id_role
     WHERE r.libelle = ?
     ORDER BY u.id_utilisateur
     LIMIT ?`,
    [roleLabel, limit],
  );
  if (rows.length === 0) {
    throw new Error(`Aucun utilisateur du rôle "${roleLabel}" trouvé en base.`);
  }
  return rows.map((u) => ({ ...u, token: signUser(u) }));
}

async function main() {
  const [admin] = await getRealUsers(ROLES.ADMIN, 1);
  const [formateur] = await getRealUsers(ROLES.FORMATEUR, 1);
  const etudiants = await getRealUsers(ROLES.ETUDIANT, 2);
  const S1 = etudiants[0];
  const S2 = etudiants[1];

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, token, body) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(base + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* pas de corps JSON */
    }
    return { status: res.status, body: json };
  };

  /* --- 1. Contrat de validation unifié : 422 + { field, message } --- */
  {
    const r = await call("POST", "/api/auth/register", null, {
      nom: "X",
      prenom: "",
      email: "invalide",
      mot_de_passe: "court",
    });
    check(r.status === 422, `validation register -> 422 (actuel ${r.status})`);
    check(Array.isArray(r.body?.errors), "validation register -> errors est un tableau");
    check(
      r.body?.errors?.every((e) => e.field && e.message),
      "validation register -> chaque erreur a {field, message}",
    );
  }

  /* --- 2. Pagination : GET /api/users?page=1&limit=2 --- */
  {
    const r = await call("GET", "/api/users?page=1&limit=2", admin.token);
    check(r.status === 200, `pagination users -> 200 (actuel ${r.status})`);
    check(Array.isArray(r.body?.data), "pagination users -> data est un tableau");
    check(r.body?.pagination?.page === 1, "pagination users -> pagination.page = 1");
    check(r.body?.pagination?.totalPages >= 1, "pagination users -> totalPages >= 1");
    check(r.body?.data?.length <= 2, "pagination users -> au plus 2 éléments par page");
  }

  /* --- 3. Pagination sans paramètres : liste complète, pas de clé pagination --- */
  {
    const r = await call("GET", "/api/users", admin.token);
    check(r.status === 200, `pagination users sans paramètres -> 200 (actuel ${r.status})`);
    check(r.body?.pagination === undefined, "pagination users sans paramètres -> pas de clé pagination");
  }

  /* --- 4. Notifications « marquer comme lue » --- */
  let notificationId = null;
  let baselineCount = null;
  {
    // Nombre de non-lues de S1 avant création
    const before = await call("GET", "/api/notifications/count-unread", S1.token);
    check(before.status === 200, `count-unread avant -> 200 (actuel ${before.status})`);
    baselineCount = before.body?.data?.total;
    check(typeof baselineCount === "number", "count-unread -> total numérique");

    // L'admin crée une notification pour S1
    const r = await call("POST", "/api/notifications", admin.token, {
      id_utilisateur: S1.id_utilisateur,
      titre: `Test marquer lue ${Date.now()}`,
      contenu: "Contenu de test",
    });
    check(r.status === 201, `création notification -> 201 (actuel ${r.status})`);
    notificationId = r.body?.data?.id;
    check(notificationId !== undefined, "création notification -> id retourné");

    // Le compteur a augmenté de 1
    const mid = await call("GET", "/api/notifications/count-unread", S1.token);
    check(
      mid.body?.data?.total === baselineCount + 1,
      `count-unread après création -> ${baselineCount + 1} (actuel ${mid.body?.data?.total})`,
    );
  }

  if (notificationId) {
    // IDOR : un autre étudiant ne peut pas marquer la notification de S1
    let r = await call("PATCH", `/api/notifications/${notificationId}/lu`, S2.token);
    check(r.status === 403, `IDOR markAsRead -> 403 (actuel ${r.status})`);

    // Le propriétaire peut la marquer comme lue
    r = await call("PATCH", `/api/notifications/${notificationId}/lu`, S1.token);
    check(r.status === 200, `marquer notification lue -> 200 (actuel ${r.status})`);
    check(
      r.body?.data?.lu === 1 || r.body?.data?.lu === true,
      "notification -> lu = 1",
    );

    // Marquer deux fois reste idempotent
    r = await call("PATCH", `/api/notifications/${notificationId}/lu`, S1.token);
    check(r.status === 200, `marquer deux fois -> 200 (actuel ${r.status})`);

    // Le compteur est revenu à la valeur initiale
    const after = await call("GET", "/api/notifications/count-unread", S1.token);
    check(
      after.body?.data?.total === baselineCount,
      `count-unread après lecture -> ${baselineCount} (actuel ${after.body?.data?.total})`,
    );

    // La notification n'apparaît plus dans /unread
    const unread = await call("GET", "/api/notifications/unread", S1.token);
    check(unread.status === 200, `GET /unread -> 200 (actuel ${unread.status})`);
    check(
      !(unread.body?.data ?? []).some((n) => Number(n.id_notification) === Number(notificationId)),
      "notification lue absente de /unread",
    );

    // Nettoyage : l'admin supprime la notification de test
    r = await call("DELETE", `/api/notifications/${notificationId}`, admin.token);
    check(r.status === 200, `nettoyage notification -> 200 (actuel ${r.status})`);
  }

  /* --- 5. Pagination des messages (route fonctionnelle) --- */
  {
    const r = await call(
      "GET",
      "/api/messages/conversation/999999?page=1&limit=5",
      S1.token,
    );
    check(r.status === 404, `messages conversation inexistante -> 404 (actuel ${r.status})`);
  }

  /* --- 6. Changement de mot de passe --- */
  {
    // Champ vide -> validation 422
    let r = await call("PUT", "/api/auth/password", S1.token, {
      mot_de_passe_actuel: "",
      mot_de_passe: "",
    });
    check(r.status === 422, `password champs vides -> 422 (actuel ${r.status})`);

    // Mauvais mot de passe actuel -> 422 (ValidationError métier)
    r = await call("PUT", "/api/auth/password", S1.token, {
      mot_de_passe_actuel: "MauvaisMdp000",
      mot_de_passe: "NouveauMdp123",
    });
    check(r.status === 422, `password mauvais actuel -> 422 (actuel ${r.status})`);
    check(
      r.body?.errors?.some((e) => e.field === "mot_de_passe_actuel"),
      "password -> erreur sur le champ mot_de_passe_actuel",
    );
  }

  /* --- 7. Rate limiting : le flux normal de connexion fonctionne --- */
  {
    const r = await call("POST", "/api/auth/login", null, {
      email: "nobody@example.com",
      mot_de_passe: "MauvaisMdp123",
    });
    check(r.status === 401, `login invalide -> 401 (actuel ${r.status})`);
  }

  /* --- 8. Rôles inchangés : étudiant interdit sur /api/progressions POST --- */
  {
    const r = await call("POST", "/api/progressions", S1.token, {
      id_utilisateur: S1.id_utilisateur,
      id_formation: 1,
      pourcentage: 50,
    });
    check(r.status === 403, `POST /progressions étudiant -> 403 (actuel ${r.status})`);
  }

  await new Promise((resolve) => server.close(resolve));

  let fail = 0;
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
    if (!r.ok) fail += 1;
  }
  console.log(`RÉSULTATS : ${results.length - fail} PASS / ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("ERREUR FATALE", err);
  process.exit(1);
});
