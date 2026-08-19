import { createResourceService } from "./resource";

export const messageService = createResourceService("/messages");

export const messageServiceExtended = {
  ...messageService,
  getByConversation: (id, params) =>
    messageService.getBy("conversation", id, params),
  getBySender: (id) => messageService.getBy("sender", id),
};
