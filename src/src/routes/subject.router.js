import { Router } from "express";
import { authToken } from "../middlewares/authJwt.middleware.js";
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import SubjectController from "../controllers/subject.controllers.js";

const router = Router();
const controller = new SubjectController();

// 🔹 Rutas para subjects

// Crear materia
router.post(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.createSubject
);

// Obtener todas las materias con paginación y búsqueda
router.get(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.getSubjects
);

// Obtener materia por ID
router.get(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.getSubjectById
);

// Actualizar materia
router.put(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.updateSubject
);

// Eliminar materia
router.delete(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.deleteSubject
);

export default router;
