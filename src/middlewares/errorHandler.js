export const errorHandler = (error, req, res, next) => {

  // 🔥 Mongo duplicate key (unique index)
  if (error.code === 11000) {

    const field = Object.keys(error.keyPattern)[0];

    return res.status(409).json({
      status: 409,
      code: `${field.toUpperCase()}_DUPLICATE`,
      message: `El ${field} ya está registrado`,
      path: req.url
    });
  }

  const status = error.statusCode || 500;

  res.status(status).json({
    status,
    code: error.code || "UNKNOWN_ERROR",
    message: error.message || "Error interno del servidor",
    path: req.url
  });
};

