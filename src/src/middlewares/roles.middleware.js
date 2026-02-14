export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        message: "No tenés permisos para esta acción"
      });
    }
    next();
  };
};
