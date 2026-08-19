import QuizService from "../services/quiz.service.js";
import ApiResponse from "../utils/api-response.js";

class QuizController {
  async index(req, res) {
    try {
      const quizzes = await QuizService.getAllQuizzes();

      return ApiResponse.success(
        res,
        "Liste des quiz récupérée avec succès.",
        quizzes,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const quiz = await QuizService.getQuizById(id);

      return ApiResponse.success(res, "Quiz récupéré avec succès.", quiz);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const id = await QuizService.createQuiz(req.body, req.user);

      return ApiResponse.success(res, "Quiz créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const quiz = await QuizService.updateQuiz(id, req.body, req.user);

      return ApiResponse.success(res, "Quiz modifié avec succès.", quiz);
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      await QuizService.deleteQuiz(id, req.user);

      return ApiResponse.success(res, "Quiz supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new QuizController();