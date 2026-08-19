/**
 * Harnais « Services étendus » (Phase 4).
 *
 * Exécution : node tests/services-full.test.js
 *
 * Couvre les comportements de sécurité ajoutés en Phase 4 :
 * - B7 : masquage de est_correcte côté réponses (AnswerService)
 * - B8 : avis (inscription obligatoire, pas de doublon, propriété personnelle)
 * - B9 : notifications (accès strictement personnel)
 * - B10 : conversations / participants / messages (participation requise)
 * - B11 : formations (imposition id_formateur, anti-transfert, rôles)
 * - B12 : contrat d'erreur typé (404 / 403 / 409 / 422)
 *
 * Nettoyage systématique des données jetables après exécution.
 */
import pool from "../src/config/database.js";

import ROLES from "../src/constants/role.js";
import HTTP_STATUS from "../src/constants/httpStatus.js";

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
import EnrollmentRepository from "../src/repositories/enrollment.repository.js";
import ReviewRepository from "../src/repositories/review.repository.js";
import NotificationRepository from "../src/repositories/notification.repository.js";
import ConversationRepository from "../src/repositories/conversation.repository.js";
import ConversationParticipantRepository from "../src/repositories/conversation-participant.repository.js";
import MessageRepository from "../src/repositories/message.repository.js";

import ReviewService from "../src/services/review.service.js";
import NotificationService from "../src/services/notification.service.js";
import ConversationService from "../src/services/conversation.service.js";
import ConversationParticipantService from "../src/services/conversation-participant.service.js";
import MessageService from "../src/services/message.service.js";
import FormationService from "../src/services/formation.service.js";
import AnswerService from "../src/services/answer.service.js";
import QuestionService from "../src/services/question.service.js";
import QuizService from "../src/services/quiz.service.js";
import ChapterService from "../src/services/chapter.service.js";
import ModuleService from "../src/services/module.service.js";
import LessonService from "../src/services/lesson.service.js";
import VideoService from "../src/services/video.service.js";
import DocumentService from "../src/services/document.service.js";

import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../src/utils/app-errors.js";

const results = [];
let suite = "?";

function check(condition, label) {
  results.push({ ok: !!condition, label: `[${suite}] ${label}` });
}

async function expectThrow(fnOrPromise, ErrClass, label) {
  const pending = typeof fnOrPromise === "function" ? fnOrPromise() : fnOrPromise;
  return Promise.resolve(pending).then(
    () => {
      results.push({ ok: false, label: `[${suite}] ${label} (aucune erreur levée)` });
      return null;
    },
    (error) => {
      const good = ErrClass && error instanceof ErrClass;
      results.push({
        ok: good,
        label: `[${suite}] ${label} -> ${good ? "REFUSÉ" : `ERREUR INATTENDUE: ${error.message}`}`,
      });
      return error;
    },
  );
}

async function expectStatus(fnOrPromise, status, label) {
  const pending = typeof fnOrPromise === "function" ? fnOrPromise() : fnOrPromise;
  return Promise.resolve(pending).then(
    () => {
      results.push({ ok: false, label: `[${suite}] ${label} (aucune erreur levée)` });
      return null;
    },
    (error) => {
      const good = error && error.statusCode === status;
      results.push({
        ok: good,
        label: `[${suite}] ${label} -> ${good ? `REFUSÉ(${status})` : `STATUT INATTENDU(${error?.statusCode}): ${error?.message}`}`,
      });
      return error;
    },
  );
}

function expectDenied(fn, label) {
  return expectThrow(fn, AccessDeniedError, label);
}

/* ------------------------------------------------------------------ */
/* Setup / cleanup                                                      */
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
  enrollments: [],
  reviews: [],
  notifications: [],
  messages: [],
  participants: [],
  conversations: [],
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
  await del(MessageRepository, created.messages, "message");
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
  await del(NotificationRepository, created.notifications, "notification");
  await del(ReviewRepository, created.reviews, "review");
  await del(EnrollmentRepository, created.enrollments, "enrollment");
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
      prenom: "Services",
      email: `services.${tag}.${suffix}@test.local`,
      mot_de_passe: "x",
    });
    created.users.push(id);
    return { id, role };
  };

  const F1 = await mkUser(roleFormateur, ROLES.FORMATEUR, "f1");
  const F2 = await mkUser(roleFormateur, ROLES.FORMATEUR, "f2");
  const S1 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s1");
  const S2 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s2");
  const S3 = await mkUser(roleEtudiant, ROLES.ETUDIANT, "s3");

  const catId = await CategoryRepository.create({
    nom_categorie: `ServicesTest ${suffix}`,
  });
  created.categories.push(catId);

  const form1 = await FormationRepository.create({
    id_categorie: catId,
    id_formateur: F1.id,
    titre: `Formation S1 ${suffix}`,
    description: "test",
  });
  const form2 = await FormationRepository.create({
    id_categorie: catId,
    id_formateur: F2.id,
    titre: `Formation S2 ${suffix}`,
    description: "test",
  });
  created.formations.push(form1, form2);

  const mod1 = await ModuleRepository.create({ id_formation: form1, titre: `Module S1 ${suffix}` });
  created.modules.push(mod1);

  const ch1 = await ChapterRepository.create({ id_module: mod1, titre: `Chapitre S1 ${suffix}` });
  created.chapters.push(ch1);

  const les1 = await LessonRepository.create({ id_chapitre: ch1, titre: `Leçon S1 ${suffix}`, contenu: "c" });
  created.lessons.push(les1);

  const quiz1 = await QuizRepository.create({ id_lecon: les1, titre: `Quiz S1 ${suffix}` });
  created.quizzes.push(quiz1);

  const q1 = await QuestionRepository.create({ id_quiz: quiz1, enonce: `Question S1 ${suffix}` });
  created.questions.push(q1);

  const enrollS1 = await EnrollmentRepository.create({ id_utilisateur: S1.id, id_formation: form1 });
  const enrollS2 = await EnrollmentRepository.create({ id_utilisateur: S2.id, id_formation: form1 });
  created.enrollments.push(enrollS1, enrollS2);

  /* ================================================================ */
  suite = "B7.answers";

  const a1 = await AnswerService.createAnswer(
    { id_question: q1, contenu: `Réponse A ${suffix}`, est_correcte: true },
    F1,
  );
  created.answers.push(a1);

  const ansStudent = await AnswerService.getAnswerById(a1, S1);
  check(
    ansStudent && ansStudent.est_correcte === undefined,
    "getAnswerById masque est_correcte pour un étudiant",
  );

  const ansOwner = await AnswerService.getAnswerById(a1, F1);
  check(
    ansOwner && ansOwner.est_correcte !== undefined,
    "getAnswerById expose est_correcte pour le formateur propriétaire",
  );

  const ansAdmin = await AnswerService.getAnswerById(a1, admin);
  check(
    ansAdmin && ansAdmin.est_correcte !== undefined,
    "getAnswerById expose est_correcte pour l'administrateur",
  );

  const listStudent = await AnswerService.getAnswersByQuestion(q1, S1);
  check(
    Array.isArray(listStudent) &&
      listStudent.length > 0 &&
      listStudent.every((r) => r.est_correcte === undefined),
    "getAnswersByQuestion masque est_correcte pour un étudiant",
  );

  const listOwner = await AnswerService.getAnswersByQuestion(q1, F1);
  check(
    Array.isArray(listOwner) && listOwner.every((r) => r.est_correcte !== undefined),
    "getAnswersByQuestion expose est_correcte pour le propriétaire",
  );

  await expectDenied(
    () => AnswerService.createAnswer({ id_question: q1, contenu: "X", est_correcte: true }, F2),
    "createAnswer par un formateur non propriétaire",
  );

  await expectDenied(
    () => AnswerService.updateAnswer(a1, { contenu: "modifié" }, S1),
    "updateAnswer par un étudiant",
  );

  await expectDenied(
    () => AnswerService.deleteAnswer(a1, S1),
    "deleteAnswer par un étudiant",
  );

  /* ================================================================ */
  suite = "B8.reviews";

  const revS1 = await ReviewService.createReview(
    { id_utilisateur: S1.id, id_formation: form1, note: 4, commentaire: "Bien" },
    S1,
  );
  created.reviews.push(revS1);

  await expectThrow(
    () =>
      ReviewService.createReview(
        { id_utilisateur: S1.id, id_formation: form1, note: 5, commentaire: "Encore" },
        S1,
      ),
    ConflictError,
    "second avis du même étudiant pour la même formation",
  );

  await expectThrow(
    () =>
      ReviewService.createReview(
        { id_utilisateur: S2.id, id_formation: form1, note: 5, commentaire: "Spoof" },
        S1,
      ),
    ConflictError,
    "auteur imposé = S1 (déjà avisé) malgré un id_utilisateur spoofé",
  );

  const revS2 = await ReviewService.createReview(
    { id_utilisateur: S2.id, id_formation: form1, note: 5, commentaire: "Top" },
    S2,
  );
  created.reviews.push(revS2);

  await expectDenied(
    () =>
      ReviewService.createReview(
        { id_utilisateur: F2.id, id_formation: form1, note: 1, commentaire: "Non inscrit" },
        F2,
      ),
    "avis par un utilisateur non inscrit à la formation",
  );

  await expectDenied(
    () =>
      ReviewService.createReview(
        { id_utilisateur: S3.id, id_formation: form1, note: 1, commentaire: "Non inscrit" },
        S3,
      ),
    "avis par un étudiant non inscrit à la formation",
  );

  await expectDenied(
    () => ReviewService.getReviewById(revS2, S1),
    "lecture de l'avis d'un autre utilisateur",
  );

  const revAdminRead = await ReviewService.getReviewById(revS2, admin);
  check(!!revAdminRead, "l'administrateur peut lire n'importe quel avis");

  const allReviews = await ReviewService.getReviewsByFormation(form1);
  check(
    Array.isArray(allReviews) && allReviews.length >= 2,
    "getReviewsByFormation expose tous les avis de la formation",
  );

  const mine = await ReviewService.getReviewsByUser(S2.id, S2);
  check(
    Array.isArray(mine) && mine.some((r) => Number(r.id_avis) === Number(revS2)),
    "getReviewsByUser renvoie uniquement ses propres avis",
  );

  const updated = await ReviewService.updateReview(
    revS1,
    { id_utilisateur: S1.id, id_formation: form1, note: 3, commentaire: "Modifié" },
    S1,
  );
  check(updated && Number(updated.note) === 3, "un utilisateur modifie son propre avis");

  await expectDenied(
    () =>
      ReviewService.updateReview(
        revS1,
        { id_utilisateur: S1.id, id_formation: form1, note: 2, commentaire: "Spoof" },
        S2,
      ),
    "modification de l'avis d'un autre utilisateur",
  );

  await expectDenied(
    () => ReviewService.deleteReview(revS1, S2),
    "suppression de l'avis d'un autre utilisateur",
  );

  await ReviewService.deleteReview(revS1, S1);
  created.reviews = created.reviews.filter((id) => Number(id) !== Number(revS1));
  check(true, "un utilisateur supprime son propre avis");

  await ReviewService.deleteReview(revS2, admin);
  created.reviews = created.reviews.filter((id) => Number(id) !== Number(revS2));
  check(true, "l'administrateur supprime un avis");

  /* ================================================================ */
  suite = "B9.notifications";

  const notifS1 = await NotificationService.createNotification({
    id_utilisateur: S1.id,
    titre: `Titre ${suffix}`,
    contenu: "Contenu",
  });
  created.notifications.push(notifS1);

  await expectDenied(
    () => NotificationService.getNotificationById(notifS1, S2),
    "lecture de la notification d'un autre utilisateur",
  );

  const ownNotif = await NotificationService.getNotificationById(notifS1, S1);
  check(!!ownNotif, "un utilisateur lit sa propre notification");

  const others = await NotificationService.getNotificationsByUser(S1.id, S2);
  check(
    !(Array.isArray(others) && others.some((n) => Number(n.id_notification) === Number(notifS1))),
    "getNotificationsByUser ne fuite pas les notifications d'autrui",
  );

  /* ================================================================ */
  suite = "B10.conversations";

  const conv = await ConversationService.createConversation(
    {
      sujet: `Conversation ${suffix}`,
    },
    S3,
  );
  created.conversations.push(conv);

  await expectDenied(
    () => ConversationService.getConversationById(conv, S1),
    "lecture d'une conversation sans y participer",
  );

  const partS1 = await ConversationParticipantService.addParticipant({
    id_utilisateur: S1.id,
    id_conversation: conv,
  });
  created.participants.push(partS1);

  const convS1 = await ConversationService.getConversationById(conv, S1);
  check(!!convS1, "un participant lit la conversation");

  await expectDenied(
    () => ConversationService.getConversationById(conv, S2),
    "lecture d'une conversation pour un non-participant",
  );

  const msgS1 = await MessageService.createMessage(
    { id_conversation: conv, id_expediteur: S1.id, contenu: "Salut" },
    S1,
  );
  created.messages.push(msgS1);

  await expectDenied(
    () =>
      MessageService.createMessage(
        { id_conversation: conv, id_expediteur: S2.id, contenu: "Spoof" },
        S2,
      ),
    "message d'un expéditeur non participant",
  );

  await expectDenied(
    () => MessageService.getMessagesByConversation(conv, S2),
    "lecture des messages d'une conversation sans participer",
  );

  await expectDenied(
    () => ConversationParticipantService.getParticipantById(partS1, S2),
    "lecture d'un participant sans appartenir à la conversation",
  );

  const partS2 = await ConversationParticipantService.addParticipant({
    id_utilisateur: S2.id,
    id_conversation: conv,
  });
  created.participants.push(partS2);

  const msgS2 = await MessageService.createMessage(
    { id_conversation: conv, id_expediteur: S2.id, contenu: "Bonjour" },
    S2,
  );
  created.messages.push(msgS2);

  check(
    (await MessageService.getMessagesByConversation(conv, S2)).length >= 2,
    "un participant lit tous les messages de la conversation",
  );

  const msgRead = await MessageService.getMessageById(msgS2, S1);
  check(!!msgRead, "un participant lit le message d'un autre participant");

  await expectDenied(
    () => MessageService.updateMessage(msgS2, { contenu: "modifié" }, S1),
    "modification du message d'un autre utilisateur",
  );

  await expectDenied(
    () => MessageService.deleteMessage(msgS2, S1),
    "suppression du message d'un autre utilisateur",
  );

  const updatedMsg = await MessageService.updateMessage(
    msgS2,
    { contenu: "modifié" },
    S2,
  );
  check(updatedMsg && String(updatedMsg.contenu).includes("modifié"), "l'auteur modifie son propre message");

  await MessageService.deleteMessage(msgS2, S2);
  created.messages = created.messages.filter((id) => Number(id) !== Number(msgS2));
  check(true, "l'auteur supprime son propre message");

  /* ================================================================ */
  suite = "B11.formations";

  const imposed = await FormationService.createFormation(
    { id_categorie: catId, id_formateur: F2.id, titre: `Formation imposée ${suffix}` },
    F1,
  );
  created.formations.push(imposed);
  const imposedRow = await FormationRepository.findById(imposed);
  check(
    Number(imposedRow.id_formateur) === Number(F1.id),
    "id_formateur imposé = propriétaire du token malgré un payload spoofé",
  );

  await expectThrow(
    () => FormationService.createFormation({ id_categorie: catId, titre: `Sans formateur ${suffix}` }, admin),
    ValidationError,
    "création admin sans id_formateur",
  );

  await expectDenied(
    () => FormationService.createFormation({ id_categorie: catId, id_formateur: F1.id, titre: `Etudiant ${suffix}` }, S1),
    "création par un étudiant",
  );

  const updForm = await FormationService.updateFormation(
    form2,
    { id_categorie: catId, id_formateur: F1.id, titre: `Formation S2 upd ${suffix}` },
    F2,
  );
  const updRow = await FormationRepository.findById(form2);
  check(
    updForm && Number(updRow.id_formateur) === Number(F2.id),
    "un formateur ne peut pas transférer sa formation à un autre formateur",
  );

  await expectDenied(
    () =>
      FormationService.updateFormation(
        form1,
        { id_categorie: catId, id_formateur: F1.id, titre: `Spoof ${suffix}` },
        F2,
      ),
    "modification de la formation d'un autre formateur",
  );

  await expectDenied(
    () => FormationService.deleteFormation(form1, F2),
    "suppression de la formation d'un autre formateur",
  );

  await expectThrow(
    () =>
      FormationService.createFormation(
        { id_categorie: catId, id_formateur: F1.id, titre: `Formation S1 ${suffix}` },
        F1,
      ),
    ConflictError,
    "création avec un titre déjà existant",
  );

  /* ================================================================ */
  suite = "B12.typed-errors";

  const NOT_FOUND = HTTP_STATUS.NOT_FOUND;
  const CONFLICT = HTTP_STATUS.CONFLICT;

  await expectStatus(() => FormationService.getFormationById(999999999), NOT_FOUND, "formation inexistante -> 404");
  await expectStatus(() => ChapterService.getChapterById(999999999), NOT_FOUND, "chapitre inexistant -> 404");
  await expectStatus(() => ModuleService.getModuleById(999999999), NOT_FOUND, "module inexistant -> 404");
  await expectStatus(() => LessonService.getLessonById(999999999), NOT_FOUND, "leçon inexistante -> 404");
  await expectStatus(() => VideoService.getVideoById(999999999), NOT_FOUND, "vidéo inexistante -> 404");
  await expectStatus(() => DocumentService.getDocumentById(999999999), NOT_FOUND, "document inexistant -> 404");
  await expectStatus(() => QuizService.getQuizById(999999999), NOT_FOUND, "quiz inexistant -> 404");
  await expectStatus(() => QuestionService.getQuestionById(999999999), NOT_FOUND, "question inexistante -> 404");
  await expectStatus(() => AnswerService.getAnswerById(999999999, admin), NOT_FOUND, "réponse inexistante -> 404");
  await expectStatus(
    () => QuizService.createQuiz({ id_lecon: les1, titre: `Quiz S1 ${suffix}` }, F1),
    CONFLICT,
    "quiz en doublon -> 409",
  );

  const chDupTitle = `Chapitre doublon ${suffix}`;
  const chDup = await ChapterService.createChapter({ id_module: mod1, titre: chDupTitle }, F1);
  created.chapters.push(chDup);
  await expectStatus(
    () => ChapterService.createChapter({ id_module: mod1, titre: chDupTitle }, F1),
    CONFLICT,
    "chapitre en doublon -> 409",
  );

  /* ================================================================ */
  console.log("--- Nettoyage ---");
  await cleanup();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} ${r.label}`);
  }
  console.log(`\nRÉSULTATS : ${passed} PASS / ${failed} FAIL`);

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("ERREUR FATALE :", err);
  try {
    await cleanup();
  } catch {
    /* ignore */
  }
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(2);
});
