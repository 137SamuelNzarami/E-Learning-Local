import QuestionRepository from "../repositories/question.repository.js";
import QuizRepository from "../repositories/quiz.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { assertCanManage } from "../utils/ownership.js";
import { ConflictError, NotFoundError } from "../utils/app-errors.js";

class QuestionService {
  async getAllQuestions() {
    return await QuestionRepository.findAll();
  }

  async getQuestionById(id) {
    const question = await QuestionRepository.findById(id);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    return question;
  }

  async getQuestionsByQuiz(id_quiz) {
    const quiz = await QuizRepository.findById(id_quiz);

    if (!quiz) {
      throw new NotFoundError("Quiz introuvable.");
    }

    return await QuestionRepository.findByQuizId(id_quiz);
  }

  async createQuestion(data, user) {
    const quiz = await QuizRepository.findById(data.id_quiz);

    if (!quiz) {
      throw new NotFoundError("Le quiz sélectionné est introuvable.");
    }

    // Le formateur ne peut créer que dans ses propres quiz
    await assertCanManage("quiz", data.id_quiz, user);

    return await QuestionRepository.create(data);
  }

  async updateQuestion(id, data, user) {
    const question = await QuestionRepository.findById(id);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut modifier la question
    await assertCanManage("question", id, user);

    const quiz = await QuizRepository.findById(data.id_quiz);

    if (!quiz) {
      throw new NotFoundError("Le quiz sélectionné est introuvable.");
    }

    // Si la question est déplacée, le formateur doit posséder le quiz cible
    await assertCanManage("quiz", data.id_quiz, user);

    try {
      await QuestionRepository.update(id, data);

      return await QuestionRepository.findById(id);
    } catch (error) {
      handleDatabaseError(error);
    }
  }
  async deleteQuestion(id, user) {
    const question = await QuestionRepository.findById(id);

    if (!question) {
      throw new NotFoundError("Question introuvable.");
    }

    // Seul le propriétaire (ou un administrateur) peut supprimer
    await assertCanManage("question", id, user);

    try {
      return await QuestionRepository.delete(id);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ConflictError(
          "Impossible de supprimer cette question car elle possède déjà des réponses.",
        );
      }
      handleDatabaseError(error);
    }
  }
}

export default new QuestionService();