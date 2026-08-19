import { createResourceService } from "./resource";

export const videoService = createResourceService("/videos", { multipart: true });
