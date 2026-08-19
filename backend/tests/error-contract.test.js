/**
 * Harnais « Contrat d'erreur » (Phase 4) — unitaire, aucune DB requise.
 *
 * Exécution : node tests/error-contract.test.js
 *
 * - Codes HTTP portés par les erreurs applicatives typées.
 * - Cartographie de handleDatabaseError (ER_DUP_ENTRY, ...).
 * - Contrat de réponse ApiResponse.fromError (pas de fuite de détails
 *   techniques sur les erreurs génériques).
 */
import HTTP_STATUS from "../src/constants/httpStatus.js";
import MESSAGES from "../src/constants/messages.js";

import AppError, {
  NotFoundError,
  AccessDeniedError,
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from "../src/utils/app-errors.js";
import { handleDatabaseError } from "../src/utils/database-errors.js";
import ApiResponse from "../src/utils/api-response.js";

const results = [];
let suite = "?";
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

function assertThrowsSync(fn, ErrClass, label) {
  try {
    fn();
    check(false, `${label} (aucune erreur levée)`);
  } catch (error) {
    check(error instanceof ErrClass, `${label} -> ${error.name}`);
    return error;
  }
  return null;
}

/* ------------------------------------------------------------------ */
suite = "E1.app-errors";

check(new AppError("m").statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR, "AppError défaut = 500");
check(new AppError("m").name === "AppError", "AppError.name = AppError");
check(new NotFoundError("x").statusCode === HTTP_STATUS.NOT_FOUND, "NotFoundError -> 404");
check(new NotFoundError("x").message === "x", "NotFoundError conserve son message");
check(new AccessDeniedError().statusCode === HTTP_STATUS.FORBIDDEN, "AccessDeniedError -> 403");
check(new UnauthorizedError().statusCode === HTTP_STATUS.UNAUTHORIZED, "UnauthorizedError -> 401");
check(new ConflictError().statusCode === HTTP_STATUS.CONFLICT, "ConflictError -> 409");
check(new ValidationError().statusCode === HTTP_STATUS.UNPROCESSABLE_ENTITY, "ValidationError -> 422");

const v = new ValidationError("inv", [{ champ: "titre" }]);
check(v.errors && v.errors.length === 1, "ValidationError transporte le détail des erreurs");

/* ------------------------------------------------------------------ */
suite = "E2.database-errors";

const dup = assertThrowsSync(
  () => handleDatabaseError({ code: "ER_DUP_ENTRY" }),
  ConflictError,
  "ER_DUP_ENTRY -> ConflictError",
);
check(dup && dup.statusCode === 409, "ER_DUP_ENTRY -> 409");

const noRef = assertThrowsSync(
  () => handleDatabaseError({ code: "ER_NO_REFERENCED_ROW_2" }),
  NotFoundError,
  "ER_NO_REFERENCED_ROW_2 -> NotFoundError",
);
check(noRef && noRef.statusCode === 404, "ER_NO_REFERENCED_ROW_2 -> 404");

const rowRef = assertThrowsSync(
  () => handleDatabaseError({ code: "ER_ROW_IS_REFERENCED_2" }),
  ConflictError,
  "ER_ROW_IS_REFERENCED_2 -> ConflictError",
);
check(rowRef && rowRef.statusCode === 409, "ER_ROW_IS_REFERENCED_2 -> 409");

const original = new Error("code inconnu");
try {
  handleDatabaseError(original);
  check(false, "code inconnu relancé tel quel");
} catch (error) {
  check(error === original, "code inconnu relancé tel quel");
}

/* ------------------------------------------------------------------ */
suite = "E3.api-response";

const r404 = ApiResponse.fromError(mockRes(), new NotFoundError("Formation introuvable."));
check(r404.statusCode === 404, "fromError(NotFoundError) -> 404");
check(r404.body.success === false, "fromError -> success=false");
check(r404.body.message === "Formation introuvable.", "fromError conserve le message métier");

const r422 = ApiResponse.fromError(mockRes(), new ValidationError("Erreur de validation.", [{ champ: "note" }]));
check(r422.statusCode === 422, "fromError(ValidationError) -> 422");
check(r422.body.errors && r422.body.errors[0].champ === "note", "fromError transporte le détail des erreurs");

const leaked = new Error("SHHH mot de passe secret / SQL: SELECT *");
const r500 = ApiResponse.fromError(mockRes(), leaked);
check(r500.statusCode === 500, "fromError(générique) -> 500");
check(r500.body.message === MESSAGES.SERVER_ERROR, "fromError(générique) -> message générique");
check(
  !String(JSON.stringify(r500.body)).includes("SHHH"),
  "fromError(générique) ne fuite pas les détails internes",
);

const rOk = ApiResponse.success(mockRes(), "OK", { id: 1 }, 201);
check(rOk.statusCode === 201 && rOk.body.success === true, "success() -> status + payload");

const rErr = ApiResponse.error(mockRes(), "boom", 400);
check(rErr.statusCode === 400 && rErr.body.success === false, "error() -> status + payload");

/* ------------------------------------------------------------------ */
console.log("--- Résultats ---");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.label}`);
}
console.log(`\nRÉSULTATS : ${results.length - failures} PASS / ${failures} FAIL`);
process.exit(failures > 0 ? 1 : 0);
