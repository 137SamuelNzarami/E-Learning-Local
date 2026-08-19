import { getToken } from "../api/client";

export function getErrorMessage(error, field = null) {
  if (!error) return "";
  if (field && error.errors) {
    const match = error.errors.find(
      (e) => String(e.field).toLowerCase() === String(field).toLowerCase()
    );
    if (match) return match.message;
  }
  return error.message || "Une erreur est survenue.";
}

export function errorsToMap(error) {
  if (!error || !error.errors) return {};
  return error.errors.reduce((acc, e) => {
    acc[e.field] = e.message;
    return acc;
  }, {});
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(prenom, nom) {
  return `${prenom?.charAt(0) || ""}${nom?.charAt(0) || ""}`.toUpperCase() || "?";
}

export function fullName(user) {
  return [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Utilisateur";
}

export function fileUrl(path) {
  if (!path) return "";
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3010/api";
  if (path.startsWith("http")) return path;

  const uploads = path.match(/^\/uploads\/(.+)$/);
  if (uploads) {
    const filename = encodeURIComponent(uploads[1]);
    const token = getToken();
    const suffix = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${apiBase}/files/${filename}${suffix}`;
  }

  const base = apiBase.replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function pluralize(count, singular, plural) {
  return count > 1 ? plural : singular;
}
