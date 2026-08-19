import { createResourceService } from "./resource";

export const studentAnswerService = createResourceService("/student-answers");

export const studentAnswerServiceExtended = {
  ...studentAnswerService,
  getByAttempt: (id) => studentAnswerService.getBy("attempt", id),
  getByUser: (id) => studentAnswerService.getBy("user", id),
  getByQuestion: (id) => studentAnswerService.getBy("question", id),
};
