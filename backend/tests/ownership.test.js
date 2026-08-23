/**
 * Harnais de test « Ownership / Anti-IDOR ».
 *
 * Exécution : node tests/ownership.test.js
 *
 * - Partie A : tests unitaires purs des helpers de src/utils/ownership.js.
 * - Partie B : tests d'intégration contre la base réelle avec des
 *              utilisateurs jetables, puis nettoyage systématique.
 *
 * Architecture pédagogique : formation -> chapitre -> section ->
 * sous-section (rich text) ; quiz par chapitre ; tentatives +
 * réponses étudiant en lecture seule pour l'étudiant.
 */
import pool from "../src/config/database.js";

import ROLES from "../src/constants/role.js";

import AuthRepository from "../src/repositories/auth.repository.js";
import UserRepository from "../src/repositories/user.repository.js";
import CategoryRepository from "../src/repositories/category.repository.js";
import FormationRepository from "../src/repositories/formation.repository.js";
import ChapterRepository from "../src/repositories/chapter.repository.js";
import SectionRepository from "../src/repositories/section.repository.js";
import SousSectionRepository from "../src/repositories/sous-section.repository.js";
import QuizRepository from "../src/repositories/quiz.repository.js";
import QuestionRepository from "../src/repositories/question.repository.js";
import AnswerRepository from "../src/repositories/answer.repository.js";
import ConversationRepository from "../src/repositories/conversation.repository.js";
import ConversationParticipantRepository from "../src/repositories/conversation-participant.repository.js";
import EnrollmentRepository from "../src/repositories/enrollment.repository.js";
import ProgressionRepository from "../src/repositories/progression.repository.js";
import AttemptRepository from "../src/repositories/attempt.repository.js";

import ChapterService from "../src/services/chapter.service.js";
import SectionService from "../src/services/section.service.js";
import SousSectionService from "../src/services/sous-section.service.js";
import QuizService from "../src/services/quiz.service.js";
import QuestionService from "../src/services/question.service.js";
import AnswerService from "../src/services/answer.service.js";
import EnrollmentService from "../src/services/enrollment.service.js";
import ProgressionService from "../src/services/progression.service.js";
import ParcoursService from "../src/services/parcours.service.js";
import AttemptService from "../src/services/attempt.service.js";
import StudentAnswerService from "../src/services/student-answer.service.js";

import {
  isAdmin,
  isFormateur,
  isEtudiant,
  scopeToUser,
  imposeOwnership,
  filterPersonalRows,
  assertPersonalAccess,
  canAccessFormation,
  scopePersonalRowsByFormation,
} from "../src/utils/ownership.js";

const results = [];
let suite = "?";

function check(condition, label) {
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

function assertThrows(fnOrPromise, label) {
  const pending =
    typeof fnOrPromise === "function" ? fnOrPromise() : fnOrPromise;

  return Promise.resolve(pending).then(
    () => {
      results.push({ ok: false, label: `[${suite}] ${label} (aucune erreur levée)` });
      return null;
    },
    (error) => {
      const denied =
        String(error.message || "").includes("Accès interdit") ||
        error.name === "AccessDeniedError" ||
        error.statusCode === 403;
      results.push({
        ok: denied,
        label: `[${suite}] ${label} -> ${denied ? "REFUSÉ" : `ERREUR INATTENDUE: ${error.message}`}`,
      });
      return error;
    },
  );
}

function expectDenied(fn, label) {
  return assertThrows(fn, label);
}

/**
 * Attend n'importe quelle erreur métier (403, 404, 409...).
 */
function expectRejected(fnOrPromise, label) {
  const pending =
    typeof fnOrPromise === "function" ? fnOrPromise() : fnOrPromise;

  return Promise.resolve(pending).then(
    () => {
      results.push({ ok: false, label: `[${suite}] ${label} (aucune erreur levée)` });
    },
    () => {
      results.push({ ok: true, label: `[${suite}] ${label} -> REFUSÉ` });
    },
  );
}

/* ------------------------------------------------------------------ */
/* Partie A — helpers purs (aucune DB requise)                          */
/* ------------------------------------------------------------------ */

const adminU = { id: 1, role: ROLES.ADMIN };
const formateurU = { id: 10, role: ROLES.FORMATEUR };
const etudiantU = { id: 20, role: ROLES.ETUDIANT };
const rows = [
  { id_utilisateur: 20, nom: "S1" },
  { id_utilisateur: 21, nom: "S2" },
];

suite = "A.helpers";
check(isAdmin(adminU) === true, "isAdmin(admin) = true");
check(isAdmin(etudiantU) === false, "isAdmin(etudiant) = false");
check(isFormateur(formateurU) === true, "isFormateur(formateur) = true");
check(isFormateur(etudiantU) === false, "isFormateur(etudiant) = false");
check(isEtudiant(etudiantU) === true, "isEtudiant(etudiant) = true");
check(isEtudiant(null) === false, "isEtudiant(null) = false");

check(scopeToUser(adminU, 999) === 999, "scopeToUser(admin, 999) = 999");
check(scopeToUser(etudiantU, 999) === 20, "scopeToUser(etudiant, 999) = son propre id");
try {
  scopeToUser(undefined, 999);
  check(false, "scopeToUser(undefined) lève une erreur");
} catch {
  check(true, "scopeToUser(undefined) lève une erreur");
}

const d1 = { id_utilisateur: 21, id_formation: 5 };
imposeOwnership(d1, etudiantU);
check(d1.id_utilisateur === 20, "imposeOwnership impose l'id de l'étudiant");
const d2 = { id_utilisateur: 21 };
imposeOwnership(d2, adminU);
check(d2.id_utilisateur === 21, "imposeOwnership(admin) ne modifie pas le payload");

const f1 = filterPersonalRows(rows, etudiantU);
check(f1.length === 1 && f1[0].id_utilisateur === 20, "filterPersonalRows filtre pour l'étudiant");
check(filterPersonalRows(rows, adminU).length === 2, "filterPersonalRows(admin) garde tout");

assertPersonalAccess(etudiantU, 20);
try {
  assertPersonalAccess(etudiantU, 21);
  check(false, "assertPersonalAccess(autre) lève une erreur");
} catch {
  check(true, "assertPersonalAccess(autre) lève une erreur");
}
assertPersonalAccess(adminU, 21);

const formA = { id_formateur: 10 };
check(canAccessFormation(formA, adminU) === true, "canAccessFormation(admin) = true");
check(canAccessFormation(formA, formateurU) === true, "canAccessFormation(proprio) = true");
check(canAccessFormation(formA, { id: 11, role: ROLES.FORMATEUR }) === false, "canAccessFormation(autre formateur) = false");
check(canAccessFormation(formA, etudiantU) === false, "canAccessFormation(etudiant) = false");

check(
  scopePersonalRowsByFormation(rows, formateurU, formA).length === 2,
  "scopePersonalRowsByFormation(formateur proprio) garde tout",
);
check(
  scopePersonalRowsByFormation(rows, etudiantU, formA).length === 1,
  "scopePersonalRowsByFormation(etudiant) filtre",
);

/* ------------------------------------------------------------------ */
/* Partie B — intégration DB                                            */
/* ------------------------------------------------------------------ */

const created = {
  categories: [],
  users: [],
  formations: [],
  chapters: [],
  sections: [],
  sousSections: [],
  quizzes: [],
  questions: [],
  answers: [],
  enrollments: [],
  progressions: [],
  conversations: [],
  attempts: [],
};

const suffix = `${Date.now()}`;
let userIds = [];

async function cleanup() {
  // Nettoyage SQL direct : ordre inverse des dépendances FK
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => "?").join(",");
    const statements = [
      `DELETE FROM reponses_etudiants WHERE id_tentative IN (SELECT id_tentative FROM tentatives WHERE id_utilisateur IN (${placeholders}))`,
      `DELETE FROM tentatives WHERE id_utilisateur IN (${placeholders})`,
      `DELETE FROM progression_chapitres WHERE id_utilisateur IN (${placeholders})`,
      `DELETE FROM progressions WHERE id_utilisateur IN (${placeholders})`,
      `DELETE FROM messages WHERE id_expediteur IN (${placeholders})`,
      `DELETE FROM participant_conversations WHERE id_utilisateur IN (${placeholders})`,
      `DELETE FROM notifications WHERE id_utilisateur IN (${placeholders})`,
      `DELETE FROM avis WHERE id_utilisateur IN (${placeholders})`,
    ];
    for (const sql of statements) {
      try {
        await pool.query(sql, [...userIds]);
      } catch (e) {
        console.log(`  cleanup sql: ${e.message}`);
      }
    }
  }

  const del = async (repo, ids, label) => {
    for (const id of ids) {
      try {
        await repo.delete(id);
      } catch (e) {
        console.log(`  cleanup ${label}#${id}: ${e.message}`);
      }
    }
  };

  await del(AttemptRepository, created.attempts, "attempt");
  await del(EnrollmentRepository, created.enrollments, "enrollment");
  await del(ProgressionRepository, created.progressions, "progression");
  for (const id of created.conversations) {
    try {
      const participants = await ConversationParticipantRepository.findByConversationId(id);
      for (const p of participants) {
        try {
          await ConversationParticipantRepository.delete(p.id_participant);
        } catch (e) {
          console.log(`  cleanup participant#${p.id_participant}: ${e.message}`);
        }
      }
      await ConversationRepository.delete(id);
    } catch (e) {
      console.log(`  cleanup conversation#${id}: ${e.message}`);
    }
  }
  await del(AnswerRepository, created.answers, "answer");
  await del(QuestionRepository, created.questions, "question");
  await del(QuizRepository, created.quizzes, "quiz");
  await del(SousSectionRepository, created.sousSections, "sousSection");
  await del(SectionRepository, created.sections, "section");
  await del(ChapterRepository, created.chapters, "chapter");
  await del(FormationRepository, created.formations, "formation");
  await del(UserRepository, created.users, "user");
  for (const id of created.categories) {
    try {
      await CategoryRepository.delete(id);
    } catch (e) {
      console.log(`  cleanup category#${id}: ${e.message}`);
    }
  }
}

async function main() {
  console.log("--- Setup des données jetables ---");

  const [adminRows] = await pool.query(
    `SELECT u.id_utilisateur, r.libelle AS role
     FROM utilisateurs u
     INNER JOIN roles r ON u.id_role = r.id_role
     WHERE r.libelle = ?
     LIMIT 1`,
    [ROLES.ADMIN],
  );
  if (adminRows.length === 0) {
    throw new Error("Aucun administrateur trouvé en base pour les tests.");
  }
  const admin = { id: adminRows[0].id_utilisateur, role: ROLES.ADMIN };

  const roleFormateur = await AuthRepository.findRoleIdByLabel(ROLES.FORMATEUR);
  const roleEtudiant = await AuthRepository.findRoleIdByLabel(ROLES.ETUDIANT);

  const mkUser = async (roleId, role, tag) => {
    const id = await AuthRepository.create({
      id_role: roleId,
      nom: `Test${tag}`,
      prenom: "Ownership",
      email: `ownership.${tag}.${suffix}@test.local`,
      mot_de_passe: "x",
    });
    created.users.push(id);
    userIds.push(id);
    return { id, role };
  };

  const F1 = await mkUser(roleFormateur, ROLES.FORMATEUR, "f1");
  const F2 = await mkUser(roleFormateur, ROLES.FORMATEUR, "f2");
  const S1 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s1");
  const S2 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s2");
  const S3 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s3"); // non inscrit

  const catId = await CategoryRepository.create({
    nom_categorie: `OwnershipTest ${suffix}`,
  });
  created.categories.push(catId);

  const form1 = await FormationRepository.create({
    id_categorie: catId,
    id_formateur: F1.id,
    titre: `Formation F1 ${suffix}`,
    description: "test",
  });
  const form2 = await FormationRepository.create({
    id_categorie: catId,
    id_formateur: F2.id,
    titre: `Formation F2 ${suffix}`,
    description: "test",
  });
  created.formations.push(form1, form2);

  // Les tests d'inscription étudiant exigent des formations PUBLIÉES
  await FormationRepository.updateStatut(form1, "PUBLIEE");
  await FormationRepository.updateStatut(form2, "PUBLIEE");

  const ch1 = await ChapterRepository.create({ id_formation: form1, titre: `Chapitre F1 ${suffix}`, ordre: 1 });
  const chF2 = await ChapterRepository.create({ id_formation: form2, titre: `Chapitre F2 ${suffix}`, ordre: 1 });
  created.chapters.push(ch1, chF2);

  const sec1 = await SectionRepository.create({ id_chapitre: ch1, titre: `Section F1 ${suffix}`, ordre: 1 });
  created.sections.push(sec1);

  const ss1 = await SousSectionRepository.create({
    id_section: sec1,
    titre: `Sous-section F1 ${suffix}`,
    contenu: "<p>Contenu rich text</p>",
    ordre: 1,
  });
  created.sousSections.push(ss1);

  const quiz1 = await QuizRepository.create({ id_chapitre: ch1, titre: `Quiz F1 ${suffix}` });
  created.quizzes.push(quiz1);

  const q1 = await QuestionRepository.create({ id_quiz: quiz1, enonce: `Question ${suffix}`, type: "QCM", points: 2 });
  created.questions.push(q1);

  const a1 = await AnswerRepository.create({ id_question: q1, contenu: "Bonne réponse", est_correcte: true });
  const a2 = await AnswerRepository.create({ id_question: q1, contenu: "Mauvaise réponse", est_correcte: false });
  created.answers.push(a1, a2);

  /* Inscriptions initiales (S1 et S2 suivent la formation de F1) */
  const enrS1 = await EnrollmentService.createEnrollment(
    { id_utilisateur: S1.id, id_formation: form1 },
    admin,
  );
  const enrS2 = await EnrollmentService.createEnrollment(
    { id_utilisateur: S2.id, id_formation: form1 },
    admin,
  );
  created.enrollments.push(enrS1, enrS2);

  console.log("--- Partie B1 : chaîne pédagogique (formateurs) ---");
  suite = "B1.chaine";

  let chapterF1 = await ChapterService.createChapter(
    { id_formation: form1, titre: `Chap F1 crée ${suffix}` },
    F1,
  );
  created.chapters.push(chapterF1);

  await expectDenied(
    ChapterService.createChapter({ id_formation: form1, titre: `Chap volé ${suffix}` }, F2),
    "F2 ne peut pas créer un chapitre dans une formation de F1",
  );

  const chapterF2own = await ChapterService.createChapter(
    { id_formation: form2, titre: `Chap F2 crée ${suffix}` },
    F2,
  );
  created.chapters.push(chapterF2own);

  const chapterAdmin = await ChapterService.createChapter(
    { id_formation: form1, titre: `Chap admin ${suffix}` },
    admin,
  );
  created.chapters.push(chapterAdmin);

  await expectDenied(
    ChapterService.createChapter({ id_formation: form1, titre: `Chap etudiant ${suffix}` }, S1),
    "Un étudiant ne peut pas créer un chapitre",
  );

  await ChapterService.updateChapter(
    chapterF1,
    { titre: `Chap F1 modifié ${suffix}` },
    F1,
  );
  check(true, "F1 peut modifier son propre chapitre");

  await expectDenied(
    ChapterService.updateChapter(chapterF1, { titre: `Chap modif volée ${suffix}` }, F2),
    "F2 ne peut pas modifier un chapitre de F1",
  );

  const secF1 = await SectionService.createSection(
    { id_chapitre: chapterF1, titre: `Section créée ${suffix}` },
    F1,
  );
  created.sections.push(secF1);

  await expectDenied(
    SectionService.createSection({ id_chapitre: chapterF1, titre: `Section volée ${suffix}` }, F2),
    "F2 ne peut pas créer une section dans un chapitre de F1",
  );

  const ssF1 = await SousSectionService.createSousSection(
    { id_section: Number(secF1), titre: `SS créée ${suffix}`, contenu: "<p>HTML</p>" },
    F1,
  );
  created.sousSections.push(Number(ssF1));

  await expectDenied(
    SousSectionService.createSousSection(
      { id_section: Number(secF1), titre: `SS volée ${suffix}` },
      F2,
    ),
    "F2 ne peut pas créer une sous-section dans une section de F1",
  );

  const ssRead = await SousSectionService.getSousSectionById(Number(ssF1), F1);
  check(
    ssRead && String(ssRead.contenu).includes("HTML"),
    "le rich text d'une sous-section est restitué au formateur propriétaire",
  );

  const chFree = await ChapterRepository.create({ id_formation: form1, titre: `Chap libre ${suffix}`, ordre: 99 });
  created.chapters.push(chFree);
  await expectDenied(
    ChapterService.deleteChapter(chFree, F2),
    "F2 ne peut pas supprimer un chapitre de F1",
  );
  await ChapterService.deleteChapter(chFree, F1);
  created.chapters = created.chapters.filter((c) => Number(c) !== Number(chFree));
  check(true, "F1 peut supprimer son propre chapitre (sans contenu)");

  console.log("--- Partie B2 : inscriptions ---");
  suite = "B2.enrollment";

  /* imposition d'identité : S1 ne peut pas inscrire un autre utilisateur */
  const enrForced = await EnrollmentService.createEnrollment(
    { id_utilisateur: S2.id, id_formation: form2 },
    S1,
  );
  created.enrollments.push(enrForced);
  const enrForcedRow = await EnrollmentRepository.findById(enrForced);
  check(
    Number(enrForcedRow.id_utilisateur) === S1.id,
    "createEnrollment impose le propriétaire (payload S2 -> S1)",
  );

  // Formation BROUILLON : inscription étudiant refusée
  const formDraft = await FormationRepository.create({
    id_categorie: catId,
    id_formateur: F1.id,
    titre: `Formation brouillon ${suffix}`,
    description: "test",
  });
  created.formations.push(formDraft);
  await expectDenied(
    EnrollmentService.createEnrollment({ id_utilisateur: S3.id, id_formation: formDraft }, S3),
    "inscription refusée sur une formation BROUILLON",
  );

  const progForcedS1 = await ProgressionRepository.findByUserAndFormation(S1.id, form2);
  if (progForcedS1) {
    created.progressions.push(progForcedS1.id_progression);
  }
  check(
    progForcedS1 && Number(progForcedS1.pourcentage) === 0,
    "l'inscription forcée crée une progression initiale à 0 % (S1, form2)",
  );

  await expectDenied(
    EnrollmentService.getEnrollmentById(enrS2, S1),
    "S1 ne peut pas lire l'inscription de S2",
  );

  const enrListS1 = await EnrollmentService.getEnrollmentsByUser(S2.id, S1);
  check(
    enrListS1.length > 0 && enrListS1.every((r) => Number(r.id_utilisateur) === S1.id),
    "getEnrollmentsByUser(S2) vue par S1 = uniquement ses inscriptions",
  );

  const enrFormS1 = await EnrollmentService.getEnrollmentsByFormation(form1, S1);
  check(
    enrFormS1.length === 1 && Number(enrFormS1[0].id_utilisateur) === S1.id,
    "S1 ne voit que sa propre inscription dans la formation",
  );

  const enrFormF1 = await EnrollmentService.getEnrollmentsByFormation(form1, F1);
  check(
    enrFormF1.length === 2,
    "F1 (propriétaire) voit les 2 inscriptions de sa formation",
  );

  await expectDenied(
    EnrollmentService.deleteEnrollment(enrS2, S1),
    "S1 ne peut pas supprimer l'inscription de S2",
  );

  /* Conversations automatiques créées par l'inscription */
  const form1Row = await FormationRepository.findById(form1);
  const form2Row = await FormationRepository.findById(form2);
  const pref1 = `Formation : ${form1Row.titre}`;
  const pref2 = `Formation : ${form2Row.titre}`;

  const convS1F1 = await ConversationParticipantRepository.findSharedByUsersAndSubjectPrefix(
    S1.id, F1.id, pref1,
  );
  if (convS1F1) created.conversations.push(convS1F1.id_conversation);
  check(
    convS1F1 !== null,
    "l'inscription crée automatiquement une conversation avec le formateur (S1-F1)",
  );

  const convS1F2 = await ConversationParticipantRepository.findSharedByUsersAndSubjectPrefix(
    S1.id, F2.id, pref2,
  );
  if (convS1F2) created.conversations.push(convS1F2.id_conversation);
  check(
    convS1F2 !== null,
    "une conversation distincte est créée pour chaque formation (S1-F2)",
  );

  console.log("--- Partie B3 : accès parcours & progressions ---");
  suite = "B3.parcours";

  // Le premier chapitre est accessible aux inscrits
  const accS1 = await ParcoursService.isChapterAccessible(ch1, S1);
  check(accS1 === true, "chapitre 1 accessible à S1 (inscrit)");
  const accS3 = await ParcoursService.isChapterAccessible(ch1, S3);
  check(accS3 === false, "chapitre 1 inaccessible à S3 (non inscrit)");

  await expectDenied(
    ParcoursService.assertChapterAccessible(ch1, S3),
    "start/lecture de contenu refusés pour un non-inscrit",
  );

  // L'inscription a créé la progression initiale à 0 %
  const progAutoS1 = await ProgressionRepository.findByUserAndFormation(S1.id, form1);
  check(
    progAutoS1 && Number(progAutoS1.pourcentage) === 0,
    "l'inscription crée une progression initiale à 0 % (S1)",
  );
  created.progressions.push(progAutoS1.id_progression);

  await expectDenied(
    ProgressionService.getProgressionsByUser(S1.id, S2),
    "S2 ne peut pas lire les progressions de S1",
  );

  const progF1View = await ProgressionService.getProgressionsByFormation(form1, F1);
  check(
    Array.isArray(progF1View) && progF1View.length === 2,
    "F1 (propriétaire) voit les progressions de ses 2 étudiants",
  );

  console.log("--- Partie B4 : cycle de vie des tentatives ---");
  suite = "B4.attempt";

  await expectDenied(
    AttemptService.startAttempt({ id_quiz: quiz1 }, S3),
    "S3 (non inscrit) ne peut pas démarrer une tentative",
  );

  const start1 = await AttemptService.startAttempt({ id_quiz: quiz1 }, S1);
  created.attempts.push(start1.tentative.id_tentative);
  check(
    start1.tentative && start1.tentative.statut === "EN_COURS",
    "S1 démarre une tentative EN_COURS",
  );
  check(
    Array.isArray(start1.questions) &&
      start1.questions[0] &&
      start1.questions[0].reponses.every((r) => r.est_correcte === undefined),
    "les questions retournées n'exposent JAMAIS est_correcte",
  );

  // Idempotence : redémarrer renvoie la même tentative EN_COURS
  const startAgain = await AttemptService.startAttempt({ id_quiz: quiz1 }, S1);
  check(
    Number(startAgain.tentative.id_tentative) === Number(start1.tentative.id_tentative),
    "redémarrer un quiz renvoie la même tentative EN_COURS (idempotent)",
  );

  const attS2 = await AttemptService.startAttempt({ id_quiz: quiz1 }, S2);
  created.attempts.push(attS2.tentative.id_tentative);

  await expectDenied(
    AttemptService.submitAttempt(attS2.tentative.id_tentative, {}, S1),
    "S1 ne peut pas soumettre la tentative de S2 (IDOR)",
  );

  await expectRejected(
    AttemptService.submitAttempt(start1.tentative.id_tentative, {
      reponses: [],
    }, S1),
    "soumission incomplète (aucune question répondue) refusée",
  );

  const resFail = await AttemptService.submitAttempt(start1.tentative.id_tentative, {
    reponses: [{ id_question: q1, id_reponses: [Number(a2)] }],
  }, S1);
  check(
    resFail.statut === "ECHOUEE" && Number(resFail.note) === 0,
    "mauvaise réponse QCM -> ECHOUEE (note calculée serveur)",
  );

  const hist1 = await AttemptService.getMyHistory(quiz1, S1);
  check(
    hist1.peut_passer === true && hist1.reussi === false,
    "après un échec, S1 peut repasser le quiz",
  );

  // Repassage réussi
  const start2 = await AttemptService.startAttempt({ id_quiz: quiz1 }, S1);
  created.attempts.push(start2.tentative.id_tentative);
  check(
    Number(start2.tentative.id_tentative) !== Number(start1.tentative.id_tentative),
    "un nouveau départ crée une NOUVELLE tentative après échec",
  );

  const resWin = await AttemptService.submitAttempt(start2.tentative.id_tentative, {
    reponses: [{ id_question: q1, id_reponses: [Number(a1)] }],
  }, S1);
  check(
    resWin.statut === "REUSSIE" && Number(resWin.note) === 100,
    "bonne réponse QCM -> REUSSIE (note 100)",
  );

  const progAfter = await ProgressionRepository.findByUserAndFormation(S1.id, form1);
  const chapitresForm1 = await ChapterRepository.findByFormation(form1);
  const attendu = Math.round((1 / chapitresForm1.length) * 1000) / 10;
  check(
    progAfter && Math.abs(Number(progAfter.pourcentage) - attendu) < 0.01,
    `la progression est recalculée après validation du chapitre (${attendu} % attendus)`,
  );

  await expectRejected(
    AttemptService.startAttempt({ id_quiz: quiz1 }, S1),
    "repasser un quiz DÉJÀ RÉUSSI est refusé",
  );

  const histFinal = await AttemptService.getMyHistory(quiz1, S1);
  check(
    histFinal.reussi === true && histFinal.nb_tentatives === 2,
    "l'historique reflète 2 tentatives dont 1 réussie",
  );

  await expectDenied(
    AttemptService.deleteAttempt(attS2.tentative.id_tentative, S2),
    "un étudiant ne peut pas supprimer sa tentative (admin uniquement)",
  );

  console.log("--- Partie B5 : réponses d'étudiants (lecture) ---");
  suite = "B5.studentAnswer";

  await expectRejected(
    StudentAnswerService.getByAttempt(attS2.tentative.id_tentative, S1),
    "S1 ne peut pas lister les réponses de la tentative de S2",
  );

  const mineSA = await StudentAnswerService.getByAttempt(
    start2.tentative.id_tentative,
    S1,
  );
  check(
    Array.isArray(mineSA) && mineSA.length === 1,
    "S1 lit les réponses de sa propre tentative",
  );

  // S2 soumet à son tour (bonne réponse) : sa tentative contient 1 réponse
  const resS2 = await AttemptService.submitAttempt(attS2.tentative.id_tentative, {
    reponses: [{ id_question: q1, id_reponses: [Number(a1)] }],
  }, S2);
  check(resS2.statut === "REUSSIE", "S2 réussit aussi le quiz");

  const ownerSA = await StudentAnswerService.getByAttempt(
    attS2.tentative.id_tentative,
    F1,
  );
  check(
    Array.isArray(ownerSA) && ownerSA.length === 1,
    "F1 (propriétaire du quiz) lit les réponses de la tentative de S2",
  );

  if (mineSA.length > 0) {
    const saRow = mineSA[0];

    const saRead = await StudentAnswerService.getStudentAnswerById(
      saRow.id_reponse_etudiant,
      F1,
    );
    check(!!saRead, "le formateur propriétaire lit une réponse précise");

    await expectRejected(
      StudentAnswerService.getStudentAnswerById(saRow.id_reponse_etudiant, S2),
      "S2 ne peut pas lire la réponse de S1",
    );
  }
}

/* ------------------------------------------------------------------ */

const failed = () => results.filter((r) => !r.ok).length;

(async () => {
  try {
    await main();
  } catch (error) {
    console.error("\nÉCHEC GLOBAL :", error);
    results.push({ ok: false, label: `[setup] exception globale : ${error.message}` });
  } finally {
    console.log("\n--- Nettoyage des données jetables ---");
    await cleanup();

    console.log("\n===== RÉSULTATS =====");
    let n = 0;
    for (const r of results) {
      n++;
      console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
    }
    console.log(`\n${results.length - failed()} / ${results.length} tests réussis`);
    await pool.end();
    process.exit(failed() > 0 ? 1 : 0);
  }
})();
