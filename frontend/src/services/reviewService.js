import { createResourceService } from "./resource";

export const reviewService = createResourceService("/reviews");

export const reviewServiceExtended = {
  ...reviewService,
  getByUser: (id) => reviewService.getBy("user", id),
  getByFormation: (id) => reviewService.getBy("formation", id),
};
