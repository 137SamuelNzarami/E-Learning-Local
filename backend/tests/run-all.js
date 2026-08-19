/**
 * Exécuteur de la suite de tests (Phase 4).
 *
 * Exécution : npm test  (ou : node tests/run-all.js)
 *
 * Lance les harnais d'assertion réels les uns après les autres et
 * agrège les résultats. Nécessite la base MySQL configurée (.env).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUITES = [
  "ownership.test.js",
  "services-full.test.js",
  "error-contract.test.js",
  "roles.test.js",
  "http-routes.test.js",
  "features.test.js",
  "cross-role.test.js",
];

function runSuite(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, file)], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));

    child.on("close", (code) => resolve({ file, code, out }));
  });
}

let totalFail = 0;

for (const file of SUITES) {
  console.log(`\n================ ${file} ================`);
  const { code, out } = await runSuite(file);

  const lines = out
    .split(/\r?\n/)
    .filter((l) => /^(PASS|FAIL|ERREUR FATALE)/.test(l));
  for (const l of lines) console.log(l);

  const summary = out.match(/RÉSULTATS[^\n]*/);
  if (summary) {
    console.log(summary[0].trim());
    const failed = /(\d+) FAIL/.exec(summary[0]);
    totalFail += failed ? parseInt(failed[1], 10) : 0;
  }

  if (code !== 0) {
    console.log(`[run-all] ${file} : code de sortie ${code}`);
    totalFail += 1;
  }
}

console.log(`\n==============================`);
console.log(`[run-all] Total de tests en échec : ${totalFail}`);
console.log(totalFail === 0 ? "[run-all] SUCCÈS" : "[run-all] ÉCHEC");
process.exit(totalFail === 0 ? 0 : 1);
