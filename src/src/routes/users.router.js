import { Router } from 'express';
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import UserController from '../controllers/users.controllers.js';

const controller = new UserController();
const router = Router();

// 🔓 Público
router.post('/login', controller.login);

// 🔓 Público
router.post("/refresh", controller.refreshToken);


// 🔒 SOLO ADMIN
router.post(
  "/register",
  authToken,
  authorizeRoles("superAdmin","admin"),
  controller.register
);

// 🔒 SOLO ADMIN - listar usuarios
router.get(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.getUsers
);

router.get(
  "/search",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getSearchUsers
);

// 🎓 Cursos del usuario logueado
router.get(
  "/my-courses",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente","alumno"),
  controller.getMyCourses
);


router.post(
  "/search/ids",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getSearchUsersIds
);

// 🔒 SOLO ADMIN
router.delete(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.delete
);

router.patch(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.update
);
router.patch(
  "/me/email",
  authToken,
  controller.changeMyEmail
);


// usuario logueado
router.patch(
  "/me/password",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.changeMyPassword
);

//router.get('/profile', checkAuth, controller.profile);

export default router;