import AttemptRepository from "../repositories/attempt.repository.js";
import QuestionRepository from "../repositories/question.repository.js";
import AnswerRepository from "../repositories/answer.repository.js";
import StudentAnswerRepository from "../repositories/student-answer.repository.js";
import QuizRepository from "../repositories/quiz.repository.js";

import UserRepository from "../repositories/user.repository.js";

import ParcoursService from "./parcours.service.js";
import ProgressionService from "./progression.service.js";
import NotificationService from "./notification.service.js";

import { handleDatabaseError } from "../utils/database-errors.js";
import {
  assertPersonalAccess,
  canGrade,
  canSeeCorrection,
  isAdmin,
  resolveFormation,
  scopePersonalRowsByFormation,
  scopeToUser,
  stripCorrectionField,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
} from "../utils/app-errors.js";

/**
 * CYCLE DE VIE D'UNE TENTATIVE
 *
 *   EN_COURS ──submit──► SOUMISE (QCM seuls : note immédiate)
 *        │                    ├─ note >= seuil → REUSSIE
 *        │                    └─ note <  seuil → ECHOUEE
 *        │
 *        └──submit──► A_CORRIGER (au moins une question LIBRE)
 *                          │ correction par le formateur propriétaire
 *                          ├─ note >= seuil → REUSSIE
 *                          └─ note <  seuil → ECHOUEE
 *
 * - La NOTE est TOUJOURS calculée côté serveur (jamais envoyée par le client).
 * - Le corrigé n'est jamais exposé à l'étudiant.
 * - Un quiz échoué peut être repassé : une nouvelle tentative est créée.
 */
class AttemptService {
  /**
   * Récupérer toutes les tentatives
   */
  async getAllAttempts() {
    return await AttemptRepository.findAll();
  }

  /**
   * Une tentative :
   * - l'étudiant propriétaire ;
   * - le formateur propriétaire du quiz (vue correction) ;
   * - l'administrateur.
   */
  async getAttemptById(id, user) {
    const attempt = await AttemptRepository.findById(id);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    const formation = await resolveFormation("quiz", attempt.id_quiz);

    if (!canSeeCorrection(user, formation)) {
      assertPersonalAccess(user, attempt.id_utilisateur);
    }

    return attempt;
  }

  /**
   * Tentatives d'un utilisateur
   */
  async getAttemptsByUser(id_utilisateur, user) {
    const idCible = scopeToUser(user, id_utilisateur);

    const utilisateur = await UserRepository.findById(idCible);

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return await AttemptRepository.findByUserId(idCible);
  }

  /**
   * Tentatives d'un quiz :
   * - l'étudiant ne voit que les siennes ;
   * - le formateur propriétaire voit celles de ses étudiants ;
   * - l'administrateur voit tout.
   */
  async getAttemptsByQuiz(id_quiz, user) {
    const quiz = await QuizRepository.findById(id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    const rows = await AttemptRepository.findByQuizId(id_quiz);

    const formation = await resolveFormation("quiz", id_quiz);

    return scopePersonalRowsByFormation(rows, user, formation);
  }

  /**
   * Historique des tentatives de l'utilisateur courant sur un quiz
   * + possibilité de (re)passer.
   */
  async getMyHistory(id_quiz, user) {
    const quiz = await QuizRepository.findById(id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    await ParcoursService.assertQuizAccessible(id_quiz, user);

    const tentatives = await AttemptRepository.findByUserAndQuiz(
      user.id,
      id_quiz,
    );

    const reussie = tentatives.some((t) => t.statut === "REUSSIE");
    const enCours = tentatives.find((t) => t.statut === "EN_COURS");

    return {
      id_quiz: Number(id_quiz),
      score_reussite: Number(quiz.score_reussite),
      nb_tentatives: tentatives.length,
      reussi: reussie,
      tentative_en_cours: enCours
        ? { id_tentative: enCours.id_tentative }
        : null,
      peut_passer: !reussie && !enCours,
      tentatives: tentatives.map((t) =>
        stripCorrectionField({
          id_tentative: t.id_tentative,
          statut: t.statut,
          note: t.note === null ? null : Number(t.note),
          date_soumission: t.date_soumission,
          date_correction: t.date_correction,
          created_at: t.created_at,
        }),
      ),
    };
  }

  /* ---------------------------------------------------------------- */
  /* 1) DÉMARRER UNE TENTATIVE                                        */
  /* ---------------------------------------------------------------- */

  /**
   * POST /attempts/start  { id_quiz }
   *
   * - étudiant inscrit uniquement ;
   * - chapitre accessible (blocage backend des chapitres précédents) ;
   * - si une tentative EN_COURS existe : elle est retournée (idempotent) ;
   * - si le quiz est déjà réussi : refus ;
   * - sinon création d'une tentative EN_COURS.
   */
  async startAttempt(data, user) {
    const quiz = await QuizRepository.findById(data.id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    // Blocage du parcours : inscription + chapitres précédents validés
    await ParcoursService.assertChapterAccessible(quiz.id_chapitre, user);

    const historique = await AttemptRepository.findByUserAndQuiz(
      user.id,
      data.id_quiz,
    );

    const dejaReussie = historique.some((t) => t.statut === "REUSSIE");
    if (dejaReussie) {
      throw new ConflictError(
        "Ce quiz est déjà réussi. Le chapitre suivant est débloqué.",
      );
    }

    const enCours = await AttemptRepository.findOpenByUserAndQuiz(
      user.id,
      data.id_quiz,
    );

    if (enCours) {
      return this._buildStartResponse(enCours);
    }

    // Les échecs précédents n'empêchent jamais un repassage
    const id = await AttemptRepository.create({
      id_utilisateur: user.id,
      id_quiz: data.id_quiz,
      statut: "EN_COURS",
    });

    const attempt = await AttemptRepository.findById(id);

    return this._buildStartResponse(attempt);
  }

  /**
   * Réponse du démarrage : la tentative + les questions SANS corrigé.
   */
  async _buildStartResponse(attempt) {
    const questions = await QuestionRepository.findByQuizId(attempt.id_quiz);

    const questionsSansCorrige = [];
    for (const q of questions) {
      let choix = null;
      if (q.type === "QCM") {
        const rows = await AnswerRepository.findByQuestionId(q.id_question);
        choix = rows.map((r) => ({
          id_reponse: r.id_reponse,
          contenu: r.contenu,
          // est_correcte volontairement EXCLU
        }));
      }

      questionsSansCorrige.push({
        id_question: q.id_question,
        enonce: q.enonce,
        type: q.type,
        points: q.points,
        ...(choix ? { reponses: choix } : {}),
      });
    }

    return {
      tentative: {
        id_tentative: attempt.id_tentative,
        id_quiz: attempt.id_quiz,
        statut: attempt.statut,
        created_at: attempt.created_at,
      },
      score_reussite: Number(attempt.score_reussite),
      questions: questionsSansCorrige,
    };
  }

  /* ---------------------------------------------------------------- */
  /* 2) SOUMETTRE UNE TENTATIVE                                       */
  /* ---------------------------------------------------------------- */

  /**
   * POST /attempts/:id/submit
   *
   * Body :
   * {
   *   "reponses": [
   *     { "id_question": 1, "id_reponses": [10] },            // QCM
   *     { "id_question": 2, "contenu": "Ma réponse..." }      // LIBRE
   *   ]
   * }
   *
   * - IDOR : seule sa propre tentative EN_COURS peut être soumise ;
   * - chaque question du quiz doit être répondue ;
   * - QCM : correction AUTOMATIQUE (égalité exacte des ensembles) ;
   * - LIBRE : réponse enregistrée, tentative passée à A_CORRIGER ;
   * - note finale = points obtenus / points totaux × 100.
   */
  async submitAttempt(id_tentative, payload, user) {
    const attempt = await AttemptRepository.findById(id_tentative);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    assertPersonalAccess(user, attempt.id_utilisateur);

    if (attempt.statut !== "EN_COURS") {
      throw new ConflictError(
        "Cette tentative a déjà été soumise. Repassez le quiz pour créer une nouvelle tentative.",
      );
    }

    const questions = await QuestionRepository.findByQuizId(attempt.id_quiz);

    if (questions.length === 0) {
      throw new ConflictError(
        "Ce quiz ne contient aucune question. Contactez le formateur.",
      );
    }

    const soumises = Array.isArray(payload?.reponses) ? payload.reponses : [];

    // Indexation des réponses soumises par question
    const parQuestion = new Map();
    for (const rep of soumises) {
      if (!rep || rep.id_question === undefined) continue;
      parQuestion.set(Number(rep.id_question), rep);
    }

    // Toutes les questions doivent être présentes dans la soumission
    for (const q of questions) {
      if (!parQuestion.has(q.id_question)) {
        throw new ConflictError(
          `La question ${q.id_question} n'a pas été répondue.`,
        );
      }
    }

    // Refuser toute question étrangère au quiz
    const idsQuestions = new Set(questions.map((q) => q.id_question));
    for (const idQ of parQuestion.keys()) {
      if (!idsQuestions.has(Number(idQ))) {
        throw new ConflictError(
          `La question ${idQ} n'appartient pas à ce quiz.`,
        );
      }
    }

    // Remplace d'éventuelles réponses résiduelles de la tentative
    await StudentAnswerRepository.deleteByAttemptId(attempt.id_tentative);

    const totalPoints = questions.reduce((s, q) => s + q.points, 0);
    let pointsObtenus = 0;
    let contientLibre = false;

    for (const q of questions) {
      const soumise = parQuestion.get(q.id_question);

      if (q.type === "QCM") {
        const correctes = await AnswerRepository.findByQuestionId(
          q.id_question,
        );

        const idsCorrectes = correctes
          .filter((r) => !!r.est_correcte)
          .map((r) => Number(r.id_reponse))
          .sort();

        const brutes = Array.isArray(soumise.id_reponses)
          ? soumise.id_reponses
          : soumise.id_reponse !== undefined && soumise.id_reponse !== null
            ? [soumise.id_reponse]
            : [];

        const idsChoisis = brutes.map(Number).sort();

        const identiques =
          idsCorrectes.length === idsChoisis.length &&
          idsCorrectes.every((v, i) => v === idsChoisis[i]);

        if (identiques && idsCorrectes.length > 0) {
          pointsObtenus += q.points;
        }

        // Persistance des réponses choisies (une ligne par choix)
        for (const idRep of idsChoisis) {
          const existe = correctes.find(
            (r) => Number(r.id_reponse) === Number(idRep),
          );
          if (!existe) {
            throw new ConflictError(
              `La réponse ${idRep} n'appartient pas à la question ${q.id_question}.`,
            );
          }

          await StudentAnswerRepository.create({
            id_tentative: attempt.id_tentative,
            id_question: q.id_question,
            id_reponse: idRep,
          });
        }
      } else {
        // Question LIBRE : enregistrement du texte, PAS de note inventée
        contientLibre = true;

        await StudentAnswerRepository.create({
          id_tentative: attempt.id_tentative,
          id_question: q.id_question,
          contenu:
            typeof soumise.contenu === "string" ? soumise.contenu.trim() : "",
        });
      }
    }

    const pourcentage =
      totalPoints > 0
        ? Math.round((pointsObtenus / totalPoints) * 10000) / 100
        : 0;

    const quiz = await QuizRepository.findById(attempt.id_quiz);
    const seuil = Number(quiz.score_reussite ?? 50);

    let statutFinal;
    let noteFinale;

    if (contientLibre) {
      // CORRECTION MANUELLE requise : aucune note automatique
      statutFinal = "A_CORRIGER";
      noteFinale = null;

      await this._notifyFormateurACorriger(attempt, quiz);
    } else {
      // AUTO-CORRIGÉ
      statutFinal = pourcentage >= seuil ? "REUSSIE" : "ECHOUEE";
      noteFinale = pourcentage;

      await this._notifyEtudiantResultat(user.id, quiz, statutFinal, pourcentage);
    }

    await AttemptRepository.submit(attempt.id_tentative, {
      note: noteFinale,
      statut: statutFinal,
    });

    // La réussite/échec modifie l'état du parcours → recalcul progression
    await ProgressionService.recomputeForUserAndFormation(
      user.id,
      quiz.id_formation,
    );

    return {
      id_tentative: attempt.id_tentative,
      statut: statutFinal,
      note: noteFinale === null ? null : Number(noteFinale),
      score_reussite: seuil,
      a_corriger: contientLibre,
      message: contientLibre
        ? "Tentative soumise. Vos réponses libres attendent la correction du formateur."
        : statutFinal === "REUSSIE"
          ? "Quiz réussi. Le chapitre suivant est débloqué."
          : "Quiz échoué. Vous pouvez repasser le quiz.",
    };
  }

  /* ---------------------------------------------------------------- */
  /* 3) CORRECTION MANUELLE (formateur propriétaire / admin)           */
  /* ---------------------------------------------------------------- */

  /**
   * PUT /attempts/:id/corriger
   *
   * Body :
   * {
   *   "notes": [ { "id_reponse_etudiant": 12, "note": 1 } ]  // note sur q.points
   * }
   *
   * - réservé au formateur PROPRIÉTAIRE du quiz (ou admin) ;
   * - la tentative doit être à l'état A_CORRIGER ;
   * - note finale recalculée côté serveur ;
   * - REUSSIE / ECHOUEE déterminé contre score_reussite du quiz.
   */
  async corrigerTentative(id_tentative, payload, user) {
    const attempt = await AttemptRepository.findById(id_tentative);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    if (attempt.statut !== "A_CORRIGER") {
      throw new ConflictError(
        "Cette tentative n'est pas en attente de correction.",
      );
    }

    const formation = await resolveFormation("quiz", attempt.id_quiz);

    if (!canGrade(user, formation)) {
      throw new AccessDeniedError(
        "Seul le formateur propriétaire de ce quiz peut corriger cette tentative.",
      );
    }

    const corrections = Array.isArray(payload?.notes) ? payload.notes : [];

    const reponses = await StudentAnswerRepository.findByAttemptId(
      attempt.id_tentative,
    );

    const parId = new Map(
      reponses.map((r) => [Number(r.id_reponse_etudiant), r]),
    );

    for (const c of corrections) {
      const row = parId.get(Number(c.id_reponse_etudiant));

      if (!row) {
        throw new ConflictError(
          `La réponse ${c.id_reponse_etudiant} n'appartient pas à cette tentative.`,
        );
      }

      if (row.type_question !== "LIBRE") {
        throw new ConflictError(
          "Seules les questions libres peuvent être notées manuellement.",
        );
      }

      const note = Number(c.note);
      const max = Number(row.points_question);

      if (!Number.isFinite(note) || note < 0 || note > max) {
        throw new ConflictError(
          `La note de la question ${row.id_question} doit être comprise entre 0 et ${max}.`,
        );
      }

      await StudentAnswerRepository.grade(row.id_reponse_etudiant, note);
    }

    // Recalcul complet de la note finale côté serveur
    const questions = await QuestionRepository.findByQuizId(attempt.id_quiz);
    const apresCorrection = await StudentAnswerRepository.findByAttemptId(
      attempt.id_tentative,
    );

    const totalPoints = questions.reduce((s, q) => s + q.points, 0);
    let pointsObtenus = 0;

    for (const q of questions) {
      const lignes = apresCorrection.filter(
        (r) => Number(r.id_question) === q.id_question,
      );

      if (q.type === "QCM") {
        const idsCorrectes = lignes
          .filter((l) => !!l.est_correcte)
          .map((l) => Number(l.id_reponse));
        const idsChoisis = lignes.map((l) => Number(l.id_reponse));

        if (
          idsCorrectes.length > 0 &&
          idsCorrectes.length === idsChoisis.length &&
          idsCorrectes.every((id) => idsChoisis.includes(id))
        ) {
          pointsObtenus += q.points;
        }
      } else {
        // note attribuée par le formateur (une seule ligne par question libre)
        const noteLigne = lignes.reduce(
          (acc, l) => acc + (l.note === null ? 0 : Number(l.note)),
          0,
        );
        pointsObtenus += Math.min(noteLigne, q.points);
      }
    }

    const pourcentage =
      totalPoints > 0
        ? Math.round((pointsObtenus / totalPoints) * 10000) / 100
        : 0;

    const quiz = await QuizRepository.findById(attempt.id_quiz);
    const seuil = Number(quiz.score_reussite ?? 50);
    const statutFinal = pourcentage >= seuil ? "REUSSIE" : "ECHOUEE";

    await AttemptRepository.correct(attempt.id_tentative, {
      note: pourcentage,
      statut: statutFinal,
    });

    // Notification à l'étudiant : son quiz a été corrigé
    await NotificationService.createNotification({
      id_utilisateur: attempt.id_utilisateur,
      titre:
        statutFinal === "REUSSIE"
          ? "Quiz validé"
          : "Quiz corrigé",
      contenu:
        `Votre quiz « ${attempt.quiz} » a été corrigé. Note : ${pourcentage}/100.` +
        (statutFinal === "REUSSIE"
          ? " Chapitre suivant débloqué."
          : " Vous pouvez repasser le quiz."),
    });

    await ProgressionService.recomputeForUserAndFormation(
      attempt.id_utilisateur,
      quiz.id_formation,
    );

    return {
      id_tentative: attempt.id_tentative,
      statut: statutFinal,
      note: Number(pourcentage),
      score_reussite: seuil,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Notifications internes                                            */
  /* ---------------------------------------------------------------- */

  async _notifyFormateurACorriger(attempt, quiz) {
    try {
      const formation = await resolveFormation("quiz", attempt.id_quiz);
      if (!formation) return;

      await NotificationService.createNotification({
        id_utilisateur: formation.id_formateur,
        titre: "Tentative à corriger",
        contenu: `${attempt.prenom ?? ""} ${attempt.nom ?? ""} a soumis le quiz « ${quiz.titre} ». Des réponses libres attendent votre correction.`,
      });
    } catch (e) {
      // jamais bloquant pour l'étudiant
      console.warn("notification formateur échouée:", e.message);
    }
  }

  async _notifyEtudiantResultat(id_utilisateur, quiz, statut, note) {
    try {
      await NotificationService.createNotification({
        id_utilisateur,
        titre:
          statut === "REUSSIE"
            ? "Quiz réussi"
            : "Quiz échoué",
        contenu:
          statut === "REUSSIE"
            ? `Félicitations ! Vous avez obtenu ${note}/100 au quiz « ${quiz.titre} » (seuil ${Number(quiz.score_reussite)}). Le chapitre suivant est débloqué.`
            : `Vous avez obtenu ${note}/100 au quiz « ${quiz.titre} » (seuil ${Number(quiz.score_reussite)}). Vous pouvez repasser le quiz.`,
      });
    } catch (e) {
      console.warn("notification étudiant échouée:", e.message);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Suppression (admin / nettoyage)                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Suppression réservée à l'administrateur :
   * les tentatives font foi pour la validation des chapitres,
   * un étudiant ne peut pas effacer son historique.
   */
  async deleteAttempt(id, user) {
    if (!isAdmin(user)) {
      throw new AccessDeniedError(
        "Seul un administrateur peut supprimer une tentative.",
      );
    }

    const attempt = await AttemptRepository.findById(id);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    try {
      return await AttemptRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer cette tentative car des réponses d'étudiant y sont associées.",
        );
      }
      handleDatabaseError(error);
    }
  }
}

export default new AttemptService();
