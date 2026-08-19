import client from "../api/client";
import { createResourceService } from "./resource";

export const notificationService = createResourceService("/notifications");

export const notificationServiceExtended = {
  ...notificationService,
  getByUser: (id, params) => notificationService.getBy("user", id, params),
  unread: () => client.get("/notifications/unread"),
  countUnread: () => client.get("/notifications/count-unread"),
  markAsRead: (id) => client.patch(`/notifications/${id}/lu`),
};
