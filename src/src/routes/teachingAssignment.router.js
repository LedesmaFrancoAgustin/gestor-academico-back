import { Router } from "express";
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import TeachingAssignmentController from "../controllers/teachingAssignment.controllers.js";

const controller = new TeachingAssignmentController();
const router = Router();

// 🔐 Crear asignación (admin)
router.post(
  "/create",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.create
);

// Los teacher que tiene ese curso con sus materias
router.get(
  "/teachers/:courseId",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.getTeacherAndSubjetsByCourse
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

// 🔐 Cursos en el que dicta docente en el año enviado
router.get(
  "/myCourseByYear/user/:userId",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.getCoursesByUserIdAndYear
);

router.patch(
  "/state",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.patchState
);


//❌ Eliminar asignacio definitiva
router.delete(
   "/hardDelete",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.deleteAssignment
);

export default router;
