import QuizRepository from "../repositories/quiz.repository.js";
import ChapterRepository from "../repositories/chapter.repository.js";
import AttemptRepository from "../repositories/attempt.repository.js";
import ProgressionChapitreRepository from "../repositories/progression-chapitre.repository.js";
import FormationRepository from "../repositories/formation.repository.js";
import EnrollmentRepository from "../repositories/enrollment.repository.js";
import {
  isAdmin,
  isFormateur,
} from "../utils/ownership.js";
import {
  AccessDeniedError,
  NotFoundError,
} from "../utils/app-errors.js";

/**
 * Moteur du PARCOURS (blocage / déblocage des chapitres).
 *
 * Règle fondamentale :
 *
 *   CHAPITRE N  →  QUIZ N  →  RÉUSSITE  →  CHAPITRE N+1 accessible
 *                          →  ÉCHEC     →  CHAPITRE N+1 verrouillé
 *
 * Un chapitre est VALIDÉ pour un étudiant lorsque :
 *   - il possède un (ou plusieurs) quiz : TOUTES les tentatives finales
 *     requises sont à l'état REUSSIE ;
 *   - il ne possède pas de quiz : l'étudiant l'a marqué comme terminé
 *     (progression_chapitres).
 *
 * Le contrôle est effectué côté BACKEND à chaque accès au contenu :
 * le frontend ne peut jamais débloquer un chapitre lui-même.
 */
class ParcoursService {
  /**
   * Un chapitre est-il validé par cet utilisateur ?
   */
  async isChapterValidated(id_chapitre, id_utilisateur) {
    const quizzes = await QuizRepository.findByChapter(id_chapitre);

    if (quizzes.length > 0) {
      // Chapitre avec quiz : tous les quiz du chapitre doivent être réussis
      for (const quiz of quizzes) {
        const ok = await AttemptRepository.hasSucceeded(
          id_utilisateur,
          quiz.id_quiz,
        );
        if (!ok) {
          return false;
        }
      }
      return true;
    }

    // Chapitre sans quiz : marqué comme terminé
    return await ProgressionChapitreRepository.isCompleted(
      id_utilisateur,
      id_chapitre,
    );
  }

  /**
   * Liste ordonnée des chapitres avec leur état de parcours pour
   * l'utilisateur (accessible / verrouillé / validé / quiz présent).
   */
  async getParcours(id_formation, user) {
    const formation = await FormationRepository.findById(id_formation);
    if (!formation) {
      throw new NotFoundError("Formation introuvable.");
    }

    const chapters = await ChapterRepository.findByFormation(id_formation);

    const items = [];
    let precedentValide = true;

    for (const ch of chapters) {
      const valide = await this.isChapterValidated(ch.id_chapitre, user.id);
      const quizzes = await QuizRepository.findByChapter(ch.id_chapitre);

      items.push({
        id_chapitre: ch.id_chapitre,
        titre: ch.titre,
        description: ch.description,
        ordre: ch.ordre,
        a_quiz: quizzes.length > 0,
        valide,
        // accessible tant que tous les précédents sont validés
        accessible: precedentValide,
      });

      precedentValide = precedentValide && valide;
    }

    return {
      formation: {
        id_formation: formation.id_formation,
        titre: formation.titre,
      },
      chapitres: items,
      progression_pourcentage: await this.computePourcentage(
        id_formation,
        user.id,
      ),
    };
  }

  /**
   * Pourcentage de progression = chapitres validés / chapitres totaux.
   * Calculé uniquement à partir de données réelles (jamais envoyé par
   * le frontend).
   */
  async computePourcentage(id_formation, id_utilisateur) {
    const chapters = await ChapterRepository.findByFormation(id_formation);

    if (chapters.length === 0) {
      return 0;
    }

    let valides = 0;
    for (const ch of chapters) {
      if (await this.isChapterValidated(ch.id_chapitre, id_utilisateur)) {
        valides++;
      }
    }

    return Math.round((valides / chapters.length) * 1000) / 10;
  }

  /**
   * Garde-fou d'ACCÈS À UN CHAPITRE (et à son contenu / quiz).
   *
   * - Administrateur           : accès global.
   * - Formateur propriétaire   : accès complet.
   * - Étudiant INSCRIT         : accès si tous les chapitres précédents
   *                              sont validés.
   * - Tout autre utilisateur   : refus.
   */
  async assertChapterAccessible(id_chapitre, user) {
    const chapter = await ChapterRepository.findById(id_chapitre);

    if (!chapter) {
      throw new NotFoundError("Chapitre introuvable.");
    }

    if (isAdmin(user)) {
      return chapter;
    }

    if (isFormateur(user)) {
      // le formateur ne consulte que ses propres formations
      const formation = await FormationRepository.findById(
        chapter.id_formation,
      );

      if (formation && Number(formation.id_formateur) === Number(user.id)) {
        return chapter;
      }

      throw new AccessDeniedError(
        "Accès interdit. Cette formation ne vous appartient pas.",
      );
    }

    // Étudiant (ou autre rôle) : inscription obligatoire
    const enrollment = await EnrollmentRepository.findByUserAndFormation(
      user.id,
      chapter.id_formation,
    );

    if (!enrollment) {
      throw new AccessDeniedError(
        "Vous devez être inscrit à cette formation pour accéder à ce chapitre.",
      );
    }

    // Blocage : tous les chapitres précédents doivent être validés
    const all = await ChapterRepository.findByFormation(chapter.id_formation);

    for (const prev of all) {
      if (Number(prev.id_chapitre) === Number(chapter.id_chapitre)) {
        break;
      }

      const valide = await this.isChapterValidated(
        prev.id_chapitre,
        user.id,
      );

      if (!valide) {
        throw new AccessDeniedError(
          "Chapitre verrouillé. Vous devez d'abord réussir le quiz du chapitre précédent.",
        );
      }
    }

    return chapter;
  }

  /**
   * Garde-fou d'accès à un QUIZ : le quiz doit exister et son chapitre
   * être accessible à l'utilisateur.
   */
  async assertQuizAccessible(id_quiz, user) {
    const quiz = await QuizRepository.findById(id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    await this.assertChapterAccessible(quiz.id_chapitre, user);

    return quiz;
  }

  /**
   * Version booléenne (pour les listes) sans lever d'erreur.
   */
  async isChapterAccessible(id_chapitre, user) {
    try {
      await this.assertChapterAccessible(id_chapitre, user);
      return true;
    } catch {
      return false;
    }
  }
}

export default new ParcoursService();
