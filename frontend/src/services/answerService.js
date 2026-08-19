import { createResourceService } from "./resource";

export const answerService = createResourceService("/answers");

export const answerServiceExtended = {
  ...answerService,
  getByQuestion: (idQuestion) => answerService.getBy("question", idQuestion),
};
