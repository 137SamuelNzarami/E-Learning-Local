import { Router } from "express";

import AuthController from "../controllers/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import {
  changePasswordValidator,
  loginValidator,
  registerValidator,
} from "../validators/auth.validator.js";

import validationMiddleware from "../middlewares/validate.js";

import { authLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

/**
 * =================
 * AUTHENTIFICATION
 * =================
 */

/**
 * Inscription publique
 * (limité en débit : anti brute-force)
 */
router.post(
  "/register",
  authLimiter,
  registerValidator,
  validationMiddleware,
  AuthController.register,
);

/**
 * Connexion publique
 * (limité en débit : anti brute-force)
 */
router.post(
  "/login",
  authLimiter,
  loginValidator,
  validationMiddleware,
  AuthController.login,
);

/**
 * Profil de l'utilisateur connecté.
 *
 * L'identité provient du token JWT (req.user.id),
 * jamais des données envoyées par le client.
 */
router.get(
  "/me",
  authMiddleware,
  AuthController.profile,
);

/**
 * Changement du mot de passe de l'utilisateur connecté.
 */
router.put(
  "/password",
  authMiddleware,
  changePasswordValidator,
  validationMiddleware,
  AuthController.changePassword,
);

export default router;