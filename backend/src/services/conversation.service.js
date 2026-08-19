import ConversationRepository from "../repositories/conversation.repository.js";
import ConversationParticipantRepository from "../repositories/conversation-participant.repository.js";
import UserRepository from "../repositories/user.repository.js";
import { handleDatabaseError } from "../utils/database-errors.js";
import { isAdmin } from "../utils/ownership.js";
import { AccessDeniedError, ConflictError, NotFoundError, UnauthorizedError } from "../utils/app-errors.js";

class ConversationService {

    /**
     * Récupérer toutes les conversations
     * (administrateur uniquement, imposé par la route)
     */
    async getAllConversations() {
        return await ConversationRepository.findAll();
    }

    /**
     * Récupérer une conversation par son ID
     */
    async getConversationById(id, user) {

        const conversation =
            await ConversationRepository.findById(id);

        if (!conversation) {
            throw new NotFoundError("Conversation introuvable.");
        }

        // Un non-admin ne peut consulter que les conversations
        // auxquelles il participe.
        if (!isAdmin(user)) {
            const participant =
                await ConversationParticipantRepository.findByUserAndConversation(
                    user.id,
                    id,
                );

            if (!participant) {
                throw new AccessDeniedError(
                    "L'utilisateur n'est pas participant de cette conversation.",
                );
            }
        }

        return conversation;
    }

    /**
     * Créer une conversation
     *
     * Les participants sont créés en même temps que la conversation :
     * si la liste `participants` est absente, l'expéditeur rejoint
     * automatiquement la conversation afin qu'elle ne soit jamais orpheline.
     */
    async createConversation(data, user) {

        if (!user || !user.id) {
            throw new UnauthorizedError("Utilisateur non authentifié.");
        }

        if (data.sujet) {
            const existing =
                await ConversationRepository.findBySubject(
                    data.sujet
                );

            if (existing) {
                throw new ConflictError(
                    "Une conversation avec ce sujet existe déjà."
                );
            }
        }

        const participants = Array.isArray(data.participants)
            ? data.participants
                .map(Number)
                .filter((id) => Number.isInteger(id) && id >= 1)
            : [];

        if (participants.length === 0) {
            participants.push(user.id);
        }

        const participantsUniques = [...new Set(participants)];

        for (const idUtilisateur of participantsUniques) {
            const utilisateur = await UserRepository.findById(idUtilisateur);

            if (!utilisateur) {
                throw new NotFoundError("Utilisateur introuvable.");
            }
        }

        try {

            return await ConversationRepository.createWithParticipants(
                data.sujet,
                participantsUniques,
            );

        } catch (error) {

            handleDatabaseError(error);
        }
    }

    /**
     * Modifier une conversation
     */
    async updateConversation(id, data) {

        const conversation =
            await ConversationRepository.findById(id);

        if (!conversation) {
            throw new NotFoundError("Conversation introuvable.");
        }

        if (data.sujet) {

            const existing =
                await ConversationRepository.findBySubject(
                    data.sujet
                );

            if (
                existing &&
                existing.id_conversation !== Number(id)
            ) {
                throw new ConflictError(
                    "Une conversation avec ce sujet existe déjà."
                );
            }
        }

        try {

            await ConversationRepository.update(id, data);

            return await ConversationRepository.findById(id);

        } catch (error) {

            handleDatabaseError(error);
        }
    }

    /**
     * Supprimer une conversation
     */
    async deleteConversation(id) {

        const conversation =
            await ConversationRepository.findById(id);

        if (!conversation) {
            throw new NotFoundError("Conversation introuvable.");
        }

        try {

            return await ConversationRepository.delete(id);

        } catch (error) {

            if (error.code === "ER_ROW_IS_REFERENCED_2") {

                throw new ConflictError(
                    "Impossible de supprimer cette conversation car des participants ou des messages y sont associés."
                );
            }

            handleDatabaseError(error);
        }
    }
}

export default new ConversationService();
