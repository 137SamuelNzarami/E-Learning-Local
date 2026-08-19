import FormationService from "../services/formation.service.js";
import ApiResponse from "../utils/api-response.js";

class FormationController {
    /**
     * Récupérer toutes les formations
     */
    async index(req, res) {
        try {
            const formations = await FormationService.getAllFormations();
            return ApiResponse.success(
                res,
                "Liste des formations récupérée avec succès.",
                formations
            );
        } catch (error) {
            return ApiResponse.fromError(res, error);
        }
    }
    /**
     * Récupérer une formation par son ID
     */
    async show(req, res) {
        try {
            const { id } = req.params;
            const formation = await FormationService.getFormationById(id);
            return ApiResponse.success(
                res,
                "Formation récupérée avec succès.",
                formation
            );
        } catch (error) {
            return ApiResponse.fromError(res, error);
        }
    }
    /**
     * Créer une formation
     */
    async store(req, res) {
        try {
            const id = await FormationService.createFormation(
                req.body,
                req.user
            );
            return ApiResponse.success(
                res,
                "Formation créée avec succès.",
                { id }
            );
        } catch (error) {
            return ApiResponse.fromError(res, error);
        }
    }
    /**
     * Modifier une formation
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const formation = await FormationService.updateFormation(
                id,
                req.body,
                req.user
            );
            return ApiResponse.success(
                res,
                "Formation modifiée avec succès.",
                formation
            );
        } catch (error) {
            return ApiResponse.fromError(res, error);
        }
    }
    /**
     * Supprimer une formation
     */
    async destroy(req, res) {
        try {
            const { id } = req.params;
            await FormationService.deleteFormation(id, req.user);
            return ApiResponse.success(
                res,
                "Formation supprimée avec succès."
            );
        } catch (error) {
            return ApiResponse.fromError(res, error);
        }
    }
}
export default new FormationController();