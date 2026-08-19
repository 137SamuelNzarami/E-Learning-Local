import { createResourceService } from "./resource";

export const attemptService = createResourceService("/attempts");

export const attemptServiceExtended = {
  ...attemptService,
  getByUser: (id) => attemptService.getBy("user", id),
  getByQuiz: (id) => attemptService.getBy("quiz", id),
};
