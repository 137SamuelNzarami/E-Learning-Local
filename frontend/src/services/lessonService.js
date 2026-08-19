import { createResourceService } from "./resource";
import client from "../api/client";

const base = createResourceService("/lessons");

export const lessonService = {
  ...base,
  status: (id) => client.get(`/lessons/${id}/status`),
  complete: (id) => client.post(`/lessons/${id}/complete`),
};
