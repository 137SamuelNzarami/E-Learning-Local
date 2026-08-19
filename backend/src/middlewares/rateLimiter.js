import rateLimit from "express-rate-limit";

/**
 * Limiteurs de débit (PHASE 4).
 *
 * - `authLimiter` : connexion / inscription (10 requêtes / 15 minutes)
 *   afin de ralentir les tentatives de brute-force sur les credentials.
 * - `apiLimiter` : protection générale de l'API (300 requêtes / 15 minutes).
 *
 * En cas de dépassement, le client reçoit un 429 au format unifié.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de tentatives. Réessayez dans quelques minutes.",
    errors: null,
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de requêtes. Réessayez dans quelques minutes.",
    errors: null,
  },
});
