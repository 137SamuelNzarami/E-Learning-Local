import { createResourceService } from "./resource";

export const progressionService = createResourceService("/progressions");

export const progressionServiceExtended = {
  ...progressionService,
  getByUser: (id) => progressionService.getBy("user", id),
  getByFormation: (id) => progressionService.getBy("formation", id),
};
