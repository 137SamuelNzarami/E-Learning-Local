import { createResourceService } from "./resource";

export const enrollmentService = createResourceService("/enrollments");

export const enrollmentServiceExtended = {
  ...enrollmentService,
  getByUser: (id) => enrollmentService.getBy("user", id),
  getByFormation: (id) => enrollmentService.getBy("formation", id),
};
