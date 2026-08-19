import QuestionService from "../services/question.service.js";
import ApiResponse from "../utils/api-response.js";

class QuestionController {
  async index(req, res) {
    try {
      const questions = await QuestionService.getAllQuestions();

      return ApiResponse.success(
        res,
        "Liste des questions récupérée avec succès.",
        questions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const question = await QuestionService.getQuestionById(id);

      return ApiResponse.success(
        res,
        "Question récupérée avec succès.",
        question,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async getByQuiz(req, res) {
    try {
      const { id_quiz } = req.params;

      const questions = await QuestionService.getQuestionsByQuiz(id_quiz);

      return ApiResponse.success(
        res,
        "Questions du quiz récupérées avec succès.",
        questions,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const id = await QuestionService.createQuestion(req.body, req.user);

      return ApiResponse.success(res, "Question créée avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const question = await QuestionService.updateQuestion(id, req.body, req.user);

      return ApiResponse.success(
        res,
        "Question modifiée avec succès.",
        question,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      await QuestionService.deleteQuestion(id, req.user);

      return ApiResponse.success(res, "Question supprimée avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new QuestionController();