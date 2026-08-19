import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3010/api";

export const TOKEN_KEY = "eul_token";
export const USER_KEY = "eul_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, utilisateur) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(utilisateur));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return normalizeUser(user);
  } catch {
    return null;
  }
}

function normalizeUser(user) {
  if (!user) return null;
  if (user.id !== undefined) return user;
  if (user.id_utilisateur !== undefined) {
    return { ...user, id: user.id_utilisateur };
  }
  return user;
}

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const apiError = {
      status: status || 0,
      message: data?.message || "Une erreur réseau est survenue. Réessayez.",
      errors: data?.errors || null,
    };

    if (status === 401) {
      clearSession();
      const isAuthPage = window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register");
      if (!isAuthPage) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(apiError);
  }
);

export function toFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, value);
  });
  return formData;
}

export default client;
