import { createResourceService } from "./resource";

export const submissionService = createResourceService("/submissions", { multipart: true });

export const submissionServiceExtended = {
  ...submissionService,
  getByUser: (id) => submissionService.getBy("user", id),
  getByAssignment: (id) => submissionService.getBy("assignment", id),
};
