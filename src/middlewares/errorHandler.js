export const errorHandler = (error, req, res, next) => {
  const status = error.statusCode || 500;

  res.status(status).json({
    status,
    code: error.code || "UNKNOWN_ERROR", // 👈 CLAVE
    message: error.message,
    path: req.url
  });
};
