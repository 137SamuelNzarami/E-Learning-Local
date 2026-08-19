const roleMiddleware = (...rolesAutorises) => {
  return (req, res, next) => {
    /**
     * authMiddleware doit avoir été exécuté
     * avant ce middleware.
     */
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
        errors: null,
      });
    }

    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit. Vous n'avez pas les permissions nécessaires.",
        errors: null,
      });
    }

    next();
  };
};

export default roleMiddleware;
