import client from "../api/client";

export const authService = {
  async register(payload) {
    return client.post("/auth/register", payload);
  },
  async login(payload) {
    return client.post("/auth/login", payload);
  },
  async me() {
    return client.get("/auth/me");
  },
  async changePassword(payload) {
    return client.put("/auth/password", payload);
  },
};
