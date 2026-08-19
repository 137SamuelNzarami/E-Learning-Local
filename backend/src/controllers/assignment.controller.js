import AssignmentService from "../services/assignment.service.js";
import ApiResponse from "../utils/api-response.js";

class AssignmentController {
  async index(req, res) {
    try {
      const assignments = await AssignmentService.getAllAssignments();

      return ApiResponse.success(
        res,
        "Liste des devoirs récupérée avec succès.",
        assignments,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const assignment = await AssignmentService.getAssignmentById(id);

      return ApiResponse.success(
        res,
        "Devoir récupéré avec succès.",
        assignment,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async store(req, res) {
    try {
      const id = await AssignmentService.createAssignment(req.body, req.user);

      return ApiResponse.success(res, "Devoir créé avec succès.", { id });
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async uploadConsignes(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return ApiResponse.error(
          res,
          "Le fichier de consignes est obligatoire.",
          422,
        );
      }

      const assignment = await AssignmentService.setConsignes(
        id,
        `/uploads/${req.file.filename}`,
        req.user,
      );

      return ApiResponse.success(
        res,
        "Fichier de consignes enregistré avec succès.",
        assignment,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async deleteConsignes(req, res) {
    try {
      const { id } = req.params;

      const assignment = await AssignmentService.clearConsignes(id, req.user);

      return ApiResponse.success(
        res,
        "Fichier de consignes supprimé avec succès.",
        assignment,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const assignment = await AssignmentService.updateAssignment(id, req.body, req.user);

      return ApiResponse.success(
        res,
        "Devoir modifié avec succès.",
        assignment,
      );
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      await AssignmentService.deleteAssignment(id, req.user);

      return ApiResponse.success(res, "Devoir supprimé avec succès.");
    } catch (error) {
      return ApiResponse.fromError(res, error);
    }
  }
}

export default new AssignmentController();