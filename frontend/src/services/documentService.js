import { createResourceService } from "./resource";

export const documentService = createResourceService("/documents", {
  multipart: true,
});
