/**
 * Harnais de test « Ownership / Anti-IDOR » (Phase 3).
 *
 * Exécution : node tests/ownership.test.js
 *
 * - Partie A : tests unitaires purs des helpers de src/utils/ownership.js.
 * - Partie B : tests d'intégration contre la base réelle avec des
 *              utilisateurs jetables, puis nettoyage systématique.
 */
import pool from "../src/config/database.js";

import ROLES from "../src/constants/role.js";

import AuthRepository from "../src/repositories/auth.repository.js";
import UserRepository from "../src/repositories/user.repository.js";
import CategoryRepository from "../src/repositories/category.repository.js";
import FormationRepository from "../src/repositories/formation.repository.js";
import ModuleRepository from "../src/repositories/module.repository.js";
import ChapterRepository from "../src/repositories/chapter.repository.js";
import LessonRepository from "../src/repositories/lesson.repository.js";
import QuizRepository from "../src/repositories/quiz.repository.js";
import QuestionRepository from "../src/repositories/question.repository.js";
import AnswerRepository from "../src/repositories/answer.repository.js";
import AssignmentRepository from "../src/repositories/assignment.repository.js";
import DocumentRepository from "../src/repositories/document.repository.js";
import ConversationRepository from "../src/repositories/conversation.repository.js";
import ConversationParticipantRepository from "../src/repositories/conversation-participant.repository.js";
import EnrollmentRepository from "../src/repositories/enrollment.repository.js";
import ProgressionRepository from "../src/repositories/progression.repository.js";
import AttemptRepository from "../src/repositories/attempt.repository.js";
import StudentAnswerRepository from "../src/repositories/student-answer.repository.js";
import SubmissionRepository from "../src/repositories/submission.repository.js";

import ChapterService from "../src/services/chapter.service.js";
import DocumentService from "../src/services/document.service.js";
import EnrollmentService from "../src/services/enrollment.service.js";
import ProgressionService from "../src/services/progression.service.js";
import AttemptService from "../src/services/attempt.service.js";
import StudentAnswerService from "../src/services/student-answer.service.js";
import SubmissionService from "../src/services/submission.service.js";

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
      const denied = String(error.message || "").includes("Accès interdit");
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
  modules: [],
  chapters: [],
  lessons: [],
  quizzes: [],
  questions: [],
  answers: [],
  assignments: [],
  documents: [],
  enrollments: [],
  progressions: [],
  conversations: [],
  attempts: [],
  studentAnswers: [],
  submissions: [],
};

const suffix = `${Date.now()}`;

async function cleanup() {
  const del = async (repo, ids, label) => {
    for (const id of ids) {
      try {
        await repo.delete(id);
      } catch (e) {
        console.log(`  cleanup ${label}#${id}: ${e.message}`);
      }
    }
  };
  await del(StudentAnswerRepository, created.studentAnswers, "studentAnswer");
  await del(SubmissionRepository, created.submissions, "submission");
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
  await del(DocumentRepository, created.documents, "document");
  await del(AssignmentRepository, created.assignments, "assignment");
  await del(AnswerRepository, created.answers, "answer");
  await del(QuestionRepository, created.questions, "question");
  await del(QuizRepository, created.quizzes, "quiz");
  await del(LessonRepository, created.lessons, "lesson");
  await del(ChapterRepository, created.chapters, "chapter");
  await del(ModuleRepository, created.modules, "module");
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
    return { id, role };
  };

  const F1 = await mkUser(roleFormateur, ROLES.FORMATEUR, "f1");
  const F2 = await mkUser(roleFormateur, ROLES.FORMATEUR, "f2");
  const S1 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s1");
  const S2 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s2");

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

  const mod1 = await ModuleRepository.create({ id_formation: form1, titre: `Module F1-1 ${suffix}` });
  const mod2 = await ModuleRepository.create({ id_formation: form1, titre: `Module F1-2 ${suffix}` });
  const mod3 = await ModuleRepository.create({ id_formation: form2, titre: `Module F2-1 ${suffix}` });
  created.modules.push(mod1, mod2, mod3);

  const ch1 = await ChapterRepository.create({ id_module: mod1, titre: `Chapitre F1 ${suffix}` });
  const chF2 = await ChapterRepository.create({ id_module: mod3, titre: `Chapitre F2 ${suffix}` });
  created.chapters.push(ch1, chF2);

  const les1 = await LessonRepository.create({ id_chapitre: ch1, titre: `Leçon F1 ${suffix}`, contenu: "c" });
  const lesF2 = await LessonRepository.create({ id_chapitre: chF2, titre: `Leçon F2 ${suffix}`, contenu: "c" });
  created.lessons.push(les1, lesF2);

  const quiz1 = await QuizRepository.create({ id_lecon: les1, titre: `Quiz F1 ${suffix}` });
  created.quizzes.push(quiz1);

  const q1 = await QuestionRepository.create({ id_quiz: quiz1, enonce: `Question ${suffix}` });
  created.questions.push(q1);

  const a1 = await AnswerRepository.create({ id_question: q1, contenu: "Réponse", est_correcte: true });
  created.answers.push(a1);

  const assign1 = await AssignmentRepository.create({ id_lecon: les1, titre: `Devoir F1 ${suffix}` });
  const assign2 = await AssignmentRepository.create({ id_lecon: les1, titre: `Devoir F1 bis ${suffix}` });
  created.assignments.push(assign1, assign2);

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
    { id_module: mod1, titre: `Chap F1 crée ${suffix}` },
    F1,
  );
  created.chapters.push(chapterF1);

  await expectDenied(
    ChapterService.createChapter({ id_module: mod1, titre: `Chap volé ${suffix}` }, F2),
    "F2 ne peut pas créer un chapitre dans un module de F1",
  );

  const chapterF2own = await ChapterService.createChapter(
    { id_module: mod3, titre: `Chap F2 crée ${suffix}` },
    F2,
  );
  created.chapters.push(chapterF2own);

  const chapterAdmin = await ChapterService.createChapter(
    { id_module: mod1, titre: `Chap admin ${suffix}` },
    admin,
  );
  created.chapters.push(chapterAdmin);

  await expectDenied(
    ChapterService.createChapter({ id_module: mod1, titre: `Chap etudiant ${suffix}` }, S1),
    "Un étudiant ne peut pas créer un chapitre",
  );

  await ChapterService.updateChapter(
    chapterF1,
    { id_module: mod1, titre: `Chap F1 modifié ${suffix}` },
    F1,
  );
  check(true, "F1 peut modifier son propre chapitre");

  await expectDenied(
    ChapterService.updateChapter(
      chapterF1,
      { id_module: mod1, titre: `Chap modif volée ${suffix}` },
      F2,
    ),
    "F2 ne peut pas modifier un chapitre de F1",
  );

  const chFree = await ChapterRepository.create({ id_module: mod1, titre: `Chap libre ${suffix}` });
  created.chapters.push(chFree);
  const chFree2 = await ChapterRepository.create({ id_module: mod1, titre: `Chap libre 2 ${suffix}` });
  created.chapters.push(chFree2);

  await expectDenied(
    ChapterService.deleteChapter(chFree, F2),
    "F2 ne peut pas supprimer un chapitre de F1",
  );
  await ChapterService.deleteChapter(chFree, F1);
  check(true, "F1 peut supprimer son propre chapitre (sans leçons)");

  const chF2free = await ChapterRepository.create({ id_module: mod3, titre: `Chap F2 libre ${suffix}` });
  created.chapters.push(chF2free);
  await ChapterService.deleteChapter(chF2free, F2);
  check(true, "F2 peut supprimer son propre chapitre");

  /* Documents */
  const doc1 = await DocumentService.createDocument(
    { id_lecon: les1, titre: `Doc F1 ${suffix}`, chemin_document: "/tmp/a.pdf" },
    F1,
  );
  created.documents.push(doc1);

  await expectDenied(
    DocumentService.createDocument(
      { id_lecon: les1, titre: `Doc volé ${suffix}`, chemin_document: "/tmp/b.pdf" },
      F2,
    ),
    "F2 ne peut pas créer un document dans une leçon de F1",
  );

  await expectDenied(
    DocumentService.createDocument(
      { id_lecon: les1, titre: `Doc etudiant ${suffix}`, chemin_document: "/tmp/c.pdf" },
      S1,
    ),
    "Un étudiant ne peut pas créer un document",
  );

  await DocumentService.updateDocument(
    doc1,
    { id_lecon: les1, titre: `Doc F1 modifié ${suffix}`, chemin_document: "/tmp/a2.pdf" },
    F1,
  );
  check(true, "F1 peut modifier son propre document");

  await expectDenied(
    DocumentService.updateDocument(
      doc1,
      { id_lecon: les1, titre: `Doc modif volée ${suffix}`, chemin_document: "/tmp/b2.pdf" },
      F2,
    ),
    "F2 ne peut pas modifier un document de F1",
  );

  await DocumentService.deleteDocument(doc1, F1);
  check(true, "F1 peut supprimer son propre document");

  const docF2 = await DocumentService.createDocument(
    { id_lecon: lesF2, titre: `Doc F2 ${suffix}`, chemin_document: "/tmp/d.pdf" },
    F2,
  );
  created.documents.push(docF2);

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

  // L'inscription forcée a aussi créé une progression initiale (S1, form2)
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

  const enrFormF2 = await EnrollmentService.getEnrollmentsByFormation(form1, F2);
  check(
    enrFormF2.every((r) => Number(r.id_utilisateur) === F2.id) && enrFormF2.length === 0,
    "F2 (non propriétaire) ne voit aucune inscription de la formation de F1",
  );

  await expectDenied(
    EnrollmentService.deleteEnrollment(enrS2, S1),
    "S1 ne peut pas supprimer l'inscription de S2",
  );

  const enrAdminView = await EnrollmentService.getEnrollmentsByUser(S2.id, admin);
  check(
    enrAdminView.length === 1 && Number(enrAdminView[0].id_utilisateur) === S2.id,
    "admin voit les inscriptions de S2",
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

  const convS2F1 = await ConversationParticipantRepository.findSharedByUsersAndSubjectPrefix(
    S2.id, F1.id, pref1,
  );
  if (convS2F1) created.conversations.push(convS2F1.id_conversation);
  check(
    convS2F1 !== null,
    "l'inscription crée automatiquement une conversation avec le formateur (S2-F1)",
  );

  const convS1F2 = await ConversationParticipantRepository.findSharedByUsersAndSubjectPrefix(
    S1.id, F2.id, pref2,
  );
  if (convS1F2) created.conversations.push(convS1F2.id_conversation);
  check(
    convS1F2 !== null,
    "une conversation distincte est créée pour chaque formation (S1-F2 via l'inscription forcée)",
  );

  console.log("--- Partie B3 : progressions ---");
  suite = "B3.progression";

  // L'inscription (setup) a auto-créé la progression initiale à 0 %
  const progAutoS1 = await ProgressionRepository.findByUserAndFormation(S1.id, form1);
  check(
    progAutoS1 && Number(progAutoS1.pourcentage) === 0,
    "l'inscription crée une progression initiale à 0 % (S1)",
  );
  const progAutoS2 = await ProgressionRepository.findByUserAndFormation(S2.id, form1);
  check(
    progAutoS2 && Number(progAutoS2.pourcentage) === 0,
    "l'inscription crée une progression initiale à 0 % (S2)",
  );

  // Mise à jour de sa propre progression (déjà créée automatiquement)
  const prog1 = progAutoS1.id_progression;
  created.progressions.push(prog1);
  await ProgressionService.updateProgression(
    prog1,
    { id_utilisateur: S1.id, id_formation: form1, pourcentage: 10 },
    S1,
  );
  check(true, "S1 peut modifier sa propre progression (créée à l'inscription)");

  let imposErrMsg = null;
  try {
    await ProgressionService.createProgression(
      { id_utilisateur: S2.id, id_formation: form1, pourcentage: 20 },
      S1,
    );
  } catch (error) {
    imposErrMsg = String(error.message);
  }
  check(
    imposErrMsg !== null && imposErrMsg.includes("progression existe déjà"),
    "S1 qui tente de créer une progression pour S2 est ramené à sa propre progression (doublon détecté, rien créé pour S2)",
  );

  const prog2 = progAutoS2.id_progression;
  created.progressions.push(prog2);
  await ProgressionService.updateProgression(
    prog2,
    { id_utilisateur: S2.id, id_formation: form1, pourcentage: 30 },
    S2,
  );
  check(true, "S2 peut modifier sa propre progression");

  await expectDenied(
    ProgressionService.getProgressionById(prog2, S1),
    "S1 ne peut pas lire la progression de S2",
  );

  const progListS1 = await ProgressionService.getProgressionsByUser(S2.id, S1);
  check(
    progListS1.length > 0 && progListS1.every((r) => Number(r.id_utilisateur) === S1.id),
    "getProgressionsByUser(S2) vue par S1 = uniquement ses progressions",
  );

  await expectDenied(
    ProgressionService.updateProgression(prog2, {
      id_utilisateur: S2.id,
      id_formation: form1,
      pourcentage: 40,
    }, S1),
    "S1 ne peut pas modifier la progression de S2",
  );

  await expectDenied(
    ProgressionService.deleteProgression(prog2, S1),
    "S1 ne peut pas supprimer la progression de S2",
  );

  const progFormS1 = await ProgressionService.getProgressionsByFormation(form1, S1);
  check(
    progFormS1.length === 1 && Number(progFormS1[0].id_utilisateur) === S1.id,
    "S1 ne voit que sa propre progression dans la formation",
  );

  const progFormF1 = await ProgressionService.getProgressionsByFormation(form1, F1);
  check(
    progFormF1.length === 2,
    "F1 (propriétaire) voit les progressions des 2 étudiants",
  );

  const progAdminView = await ProgressionService.getProgressionsByUser(S2.id, admin);
  check(
    progAdminView.length === 1 && Number(progAdminView[0].id_utilisateur) === S2.id,
    "admin voit la progression de S2",
  );

  console.log("--- Partie B4 : tentatives ---");
  suite = "B4.attempt";

  const att1 = await AttemptService.createAttempt(
    { id_utilisateur: S1.id, id_quiz: quiz1, note: 14 },
    S1,
  );
  created.attempts.push(att1);

  const att2 = await AttemptService.createAttempt(
    { id_utilisateur: S2.id, id_quiz: quiz1, note: 12 },
    S2,
  );
  created.attempts.push(att2);

  const att3 = await AttemptService.createAttempt(
    { id_utilisateur: S2.id, id_quiz: quiz1, note: 9 },
    S1,
  );
  created.attempts.push(att3);
  const att3Row = await AttemptRepository.findById(att3);
  check(
    Number(att3Row.id_utilisateur) === S1.id,
    "createAttempt impose le propriétaire (payload S2 -> S1)",
  );

  await expectDenied(
    AttemptService.getAttemptById(att2, S1),
    "S1 ne peut pas lire la tentative de S2",
  );

  const attListS1 = await AttemptService.getAttemptsByUser(S2.id, S1);
  check(
    attListS1.length === 2 && attListS1.every((r) => Number(r.id_utilisateur) === S1.id),
    "getAttemptsByUser(S2) vue par S1 = uniquement ses tentatives",
  );

  const attQuizS1 = await AttemptService.getAttemptsByQuiz(quiz1, S1);
  check(
    attQuizS1.length === 2 && attQuizS1.every((r) => Number(r.id_utilisateur) === S1.id),
    "S1 ne voit que ses tentatives sur le quiz",
  );

  const attQuizF1 = await AttemptService.getAttemptsByQuiz(quiz1, F1);
  check(attQuizF1.length === 3, "F1 (propriétaire) voit toutes les tentatives du quiz");

  const attQuizF2 = await AttemptService.getAttemptsByQuiz(quiz1, F2);
  check(attQuizF2.length === 0, "F2 (non propriétaire) ne voit aucune tentative");

  const attQuizAdmin = await AttemptService.getAttemptsByQuiz(quiz1, admin);
  check(attQuizAdmin.length === 3, "admin voit toutes les tentatives du quiz");

  await expectDenied(
    AttemptService.updateAttempt(att2, { id_utilisateur: S2.id, id_quiz: quiz1, note: 5 }, S1),
    "S1 ne peut pas modifier la tentative de S2",
  );

  await expectDenied(
    AttemptService.deleteAttempt(att2, S1),
    "S1 ne peut pas supprimer la tentative de S2",
  );

  const attAdminView = await AttemptService.getAttemptById(att2, admin);
  check(Number(attAdminView.id_utilisateur) === S2.id, "admin peut lire la tentative de S2");

  console.log("--- Partie B5 : réponses des étudiants ---");
  suite = "B5.studentAnswer";

  const sa1 = await StudentAnswerService.createStudentAnswer(
    { id_tentative: att1, id_question: q1, id_reponse: a1 },
    S1,
  );
  created.studentAnswers.push(sa1);

  await expectDenied(
    StudentAnswerService.createStudentAnswer(
      { id_tentative: att2, id_question: q1, id_reponse: a1 },
      S1,
    ),
    "S1 ne peut pas répondre dans la tentative de S2",
  );

  const sa2 = await StudentAnswerService.createStudentAnswer(
    { id_tentative: att2, id_question: q1, id_reponse: a1 },
    S2,
  );
  created.studentAnswers.push(sa2);

  await expectDenied(
    StudentAnswerService.getStudentAnswerById(sa2, S1),
    "S1 ne peut pas lire la réponse de S2",
  );

  await expectDenied(
    StudentAnswerService.getByAttempt(att2, S1),
    "S1 ne peut pas lister les réponses de la tentative de S2",
  );

  const byQ = await StudentAnswerService.getByQuestion(q1, S1);
  check(
    byQ.length === 1 && Number(byQ[0].id_utilisateur) === S1.id,
    "S1 ne voit que ses réponses à la question",
  );

  const byQF1 = await StudentAnswerService.getByQuestion(q1, F1);
  check(byQF1.length === 2, "F1 (propriétaire) voit les réponses des 2 étudiants");

  const byUserS1 = await StudentAnswerService.getByUser(S2.id, S1);
  check(
    byUserS1.length > 0 && byUserS1.every((r) => Number(r.id_utilisateur) === S1.id),
    "getByUser(S2) vue par S1 = uniquement ses réponses",
  );

  await expectDenied(
    StudentAnswerService.updateStudentAnswer(sa2, {
      id_tentative: att2,
      id_question: q1,
      id_reponse: a1,
    }, S1),
    "S1 ne peut pas modifier la réponse de S2",
  );

  await expectDenied(
    StudentAnswerService.deleteStudentAnswer(sa2, S1),
    "S1 ne peut pas supprimer la réponse de S2",
  );

  console.log("--- Partie B6 : soumissions ---");
  suite = "B6.submission";

  const sub1 = await SubmissionService.createSubmission(
    { id_utilisateur: S1.id, id_devoir: assign1, fichier: "s1.pdf" },
    S1,
  );
  created.submissions.push(sub1);

  const sub2 = await SubmissionService.createSubmission(
    { id_utilisateur: S2.id, id_devoir: assign1, fichier: "s2.pdf" },
    S2,
  );
  created.submissions.push(sub2);

  const sub3 = await SubmissionService.createSubmission(
    { id_utilisateur: S2.id, id_devoir: assign2, fichier: "s1bis.pdf" },
    S1,
  );
  created.submissions.push(sub3);
  const sub3Row = await SubmissionRepository.findById(sub3);
  check(
    Number(sub3Row.id_utilisateur) === S1.id,
    "createSubmission impose le propriétaire (payload S2 -> S1)",
  );

  await expectDenied(
    SubmissionService.getSubmissionById(sub2, S1),
    "S1 ne peut pas lire la soumission de S2",
  );

  const subListS1 = await SubmissionService.getSubmissionsByUser(S2.id, S1);
  check(
    subListS1.length > 0 && subListS1.every((r) => Number(r.id_utilisateur) === S1.id),
    "getSubmissionsByUser(S2) vue par S1 = uniquement ses soumissions",
  );

  const subAssignS1 = await SubmissionService.getSubmissionsByAssignment(assign1, S1);
  check(
    subAssignS1.length === 1 && Number(subAssignS1[0].id_utilisateur) === S1.id,
    "S1 ne voit que sa soumission au devoir",
  );

  const subAssignF1 = await SubmissionService.getSubmissionsByAssignment(assign1, F1);
  check(subAssignF1.length === 2, "F1 (propriétaire) voit les soumissions des 2 étudiants");

  await expectDenied(
    SubmissionService.updateSubmission(sub2, {
      id_utilisateur: S2.id,
      id_devoir: assign1,
      fichier: "modif.pdf",
      note: 15,
    }, S1),
    "S1 ne peut pas modifier la soumission de S2",
  );

  await expectDenied(
    SubmissionService.deleteSubmission(sub2, S1),
    "S1 ne peut pas supprimer la soumission de S2",
  );

  const subAdminView = await SubmissionService.getSubmissionById(sub2, admin);
  check(Number(subAdminView.id_utilisateur) === S2.id, "admin peut lire la soumission de S2");
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
