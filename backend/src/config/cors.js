import { env } from "./env.js";

/**
 * Configuration CORS.
 *
 * L'origine autorisée provient de la variable d'environnement
 * `CORS_ORIGIN` (séparer plusieurs origines par une virgule).
 * Par défaut : le frontend Vite local (http://localhost:5180).
 *
 * `credentials: true` permet l'envoi des cookies si nécessaire.
 */
const corsOptions = {
  origin: (env.corsOrigin ?? "http://localhost:5180")
    .split(",")
    .map((origin) => origin.trim()),
  credentials: true,
};

export default corsOptions;
