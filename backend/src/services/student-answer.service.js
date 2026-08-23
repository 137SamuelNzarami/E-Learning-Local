import StudentAnswerRepository from "../repositories/student-answer.repository.js";
import AttemptRepository from "../repositories/attempt.repository.js";
import {
  assertPersonalAccess,
  canSeeCorrection,
  resolveFormation,
  scopePersonalRowsByFormation,
  stripCorrectionField,
} from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

/**
 * Réponses réellement données par les étudiants.
 *
 * - L'étudiant voit SES réponses (choix QCM / texte libre) mais JAMAIS
 *   le corrigé (est_correcte) : le quiz peut être repassé.
 * - Le formateur propriétaire du quiz voit tout, y compris est_correcte
 *   et les notes qu'il attribue.
 */
class StudentAnswerService {
  async getAllStudentAnswers() {
    return await StudentAnswerRepository.findAll();
  }

  /**
   * Masque est_correcte pour un étudiant (toujours, même après soumission).
   */
  _maskForStudent(rows) {
    return rows.map((row) => stripCorrectionField(row));
  }

  async getStudentAnswerById(id, user) {
    const row = await StudentAnswerRepository.findById(id);

    if (!row) {
      throw new NotFoundError("Réponse étudiant introuvable.");
    }

    const formation = await resolveFormation("quiz", row.id_quiz);
    const correcteur = canSeeCorrection(user, formation);

    if (!correcteur) {
      assertPersonalAccess(user, row.id_utilisateur);
    }

    return correcteur ? row : this._maskForStudent([row])[0];
  }

  /**
   * Réponses d'une tentative :
   * - l'étudiant propriétaire de la tentative ;
   * - ou le formateur propriétaire du quiz ;
   */
  async getByAttempt(id_tentative, user) {
    const attempt = await AttemptRepository.findById(id_tentative);

    if (!attempt) {
      throw new NotFoundError("Tentative introuvable.");
    }

    const formation = await resolveFormation("quiz", attempt.id_quiz);

    // IDOR + vue formateur propriétaire
    let autoriseSansMasque = canSeeCorrection(user, formation);

    if (
      !autoriseSansMasque &&
      Number(attempt.id_utilisateur) !== Number(user.id)
    ) {
      throw new ConflictError(
        "Vous n'avez pas accès aux réponses de cette tentative.",
      );
    }

    const rows = await StudentAnswerRepository.findByAttemptId(id_tentative);

    return autoriseSansMasque ? rows : this._maskForStudent(rows);
  }

  /**
   * Toutes les réponses données à une question (vue correction formateur).
   */
  async getByQuestion(id_question, user) {
    const formation = await resolveFormation("question", id_question);

    const rows = await StudentAnswerRepository.findByQuestionId(id_question);

    return scopePersonalRowsByFormation(rows, user, formation);
  }
}

export default new StudentAnswerService();
