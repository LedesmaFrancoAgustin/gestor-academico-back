import { Router } from "express";
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import TeachingAssignmentController from "../controllers/teachingAssignment.controllers.js";

const controller = new TeachingAssignmentController();
const router = Router();

// 🔐 Crear asignación (admin)
router.post(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.create
);

// 🔐 Materias que dicta el docente en un curso
router.get(
  "/mySubjects/:courseId",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.getSubjectIdsByTeacherAndCourse
);

// 🔐 Materias del docente
router.get(
  "/mySubjects/user/:userId",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.getSubjectIdsByUserId
);

export default router;
