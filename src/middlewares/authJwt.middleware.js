import jwt from "jsonwebtoken";

export const authToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, rol }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
