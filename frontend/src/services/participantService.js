import { createResourceService } from "./resource";

export const participantService = createResourceService(
  "/conversation-participants"
);

export const participantServiceExtended = {
  ...participantService,
  getByConversation: (id) => participantService.getBy("conversation", id),
  getByUser: (id) => participantService.getBy("user", id),
};
