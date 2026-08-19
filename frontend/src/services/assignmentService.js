import client, { toFormData } from "../api/client";
import { createResourceService } from "./resource";

export const assignmentService = {
  ...createResourceService("/assignments"),
  uploadConsignes: (id, fichier) =>
    client.put(
      `/assignments/${id}/consignes`,
      toFormData({ fichier_consignes: fichier }),
    ),
  deleteConsignes: (id) => client.delete(`/assignments/${id}/consignes`),
};
