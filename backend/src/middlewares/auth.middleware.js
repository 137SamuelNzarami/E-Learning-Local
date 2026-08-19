import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import ApiResponse from "../utils/api-response.js";

/**
 * Middleware d'authentification (PHASE 3).
 *
 * - Extrait le token du header `Authorization: Bearer <token>`.
 * - Vérifie la signature et l'expiration.
 * - Place les informations décodées dans `req.user`.
 *
 * L'identité utilisée par le reste de l'application est
 * exclusivement `req.user.id`.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.error(
        res,
        "Token d'authentification manquant.",
        401,
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return ApiResponse.error(res, "Token invalide.", 401);
    }

    const decoded = jwt.verify(token, jwtConfig.secret);

    req.user = decoded;
    next();
  } catch (error) {
    return ApiResponse.error(
      res,
      "Token invalide ou expiré.",
      401,
    );
  }
};

export default authMiddleware;
