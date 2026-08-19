import { createResourceService } from "./resource";

export const questionService = createResourceService("/questions");

export const questionServiceExtended = {
  ...questionService,
  getByQuiz: (idQuiz) => questionService.getBy("quiz", idQuiz),
};
