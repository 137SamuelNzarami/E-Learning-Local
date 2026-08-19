import ConversationService from "../services/conversation.service.js";
import ApiResponse from "../utils/api-response.js";

class ConversationController {

    /**
     * Toutes les conversations
     */
    async index(req, res) {

        try {

            const conversations =
                await ConversationService.getAllConversations();

            return ApiResponse.success(
                res,
                "Liste des conversations récupérée avec succès.",
                conversations
            );

        } catch (error) {

            return ApiResponse.fromError(res, error);
        }
    }

    /**
     * Une conversation
     */
    async show(req, res) {

        try {

            const { id } = req.params;

            const conversation =
                await ConversationService.getConversationById(id, req.user);

            return ApiResponse.success(
                res,
                "Conversation récupérée avec succès.",
                conversation
            );

        } catch (error) {

            return ApiResponse.fromError(res, error);
        }
    }

    /**
     * Créer une conversation
     */
    async store(req, res) {

        try {

            const id =
                await ConversationService.createConversation(
                    req.body,
                    req.user,
                );

            return ApiResponse.success(
                res,
                "Conversation créée avec succès.",
                { id }
            );

        } catch (error) {

            return ApiResponse.fromError(res, error);
        }
    }

    /**
     * Modifier une conversation
     */
    async update(req, res) {

        try {

            const { id } = req.params;

            const conversation =
                await ConversationService.updateConversation(
                    id,
                    req.body
                );

            return ApiResponse.success(
                res,
                "Conversation modifiée avec succès.",
                conversation
            );

        } catch (error) {

            return ApiResponse.fromError(res, error);
        }
    }

    /**
     * Supprimer une conversation
     */
    async destroy(req, res) {

        try {

            const { id } = req.params;

            await ConversationService.deleteConversation(id);

            return ApiResponse.success(
                res,
                "Conversation supprimée avec succès."
            );

        } catch (error) {

            return ApiResponse.fromError(res, error);
        }
    }
}

export default new ConversationController();