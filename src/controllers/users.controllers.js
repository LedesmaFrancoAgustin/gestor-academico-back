import Controllers from "./class.controller.js";
import UserService from '../services/user.services.js';
import { createResponse } from "../utils.js";


const userService = new UserService();

export default class UserController extends Controllers{
  constructor(){
    super(userService)
  }

  register = async (req, res, next) => {
    try {
      const user = await this.service.register(req.body);
      createResponse(res, 201, user);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const data = await this.service.login(req.body);

      res.header("Authorization", data.token);

      createResponse(res, 200, data);
    } catch (error) {
      next(error);
    }
  };
  
refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body; // ⚠️ req.body debe ser un objeto con { refreshToken }

    const tokens = await this.service.refreshTokenService(refreshToken);

    // ✅ respuesta uniforme
    res.status(200).json({ data: tokens });
  } catch (error) {
    next(error);
  }
};




  getUsers = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const result = await this.service.getUsers({
      limit: Number(limit),
      page: Number(page)
    });

    res.status(200).json({
      status: "success",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// controllers/users.controller.js
getSearchUsers = async (req, res, next) => {
  try {
    const { limit = 15, page = 1, q = "" ,roles} = req.query;

    const parsedRoles = roles
      ? roles.split(",").map(r => r.trim())
      : null;

    const result = await this.service.getSearchUsers({
      limit: Number(limit),
      page: Number(page),
      q,
      roles: parsedRoles
    });

    res.status(200).json({
      status: "success",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// 🔹 Buscar usuarios combinando query params y body
getSearchUsersIds = async (req, res, next) => {
  try {
    // 🔹 Query params
    const { limit = 15, page = 1, q = "" } = req.query;

    // 🔹 Body
    const { roles = [], ids = [] } = req.body;

    // 🔹 Llamada al service
    const result = await this.service.getSearchUsersIds({
      limit: Number(limit),
      page: Number(page),
      q,
      ids,
      roles
    });

    // 🔹 Respuesta al frontend
    res.status(200).json({
      status: "success",
      ...result
    });

  } catch (error) {
    next(error);
  }
};

 // 🎓 Cursos del usuario logueado
  getMyCourses = async (req, res, next) => {
    try {
      const userId = req.user.id;

      const result = await this.service.getMyCourses(userId);

      createResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  };
  
changeMyEmail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    // ✅ Validación básica en controller
    if (!newEmail) {
      return res.status(400).json({ message: "El email es obligatorio" });
    }

    await this.service.changeMyEmail(userId, newEmail);

    createResponse(res, 200, { message: "Email actualizado correctamente" });
  } catch (error) {
    next(error);
  }
};


changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    await this.service.changeMyPassword(
      userId,
      currentPassword,
      newPassword
    );

    createResponse(res, 200, {
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    next(error);
  }
};








};