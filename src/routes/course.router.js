import { Router } from "express";
import { authToken } from "../middlewares/authJwt.middleware.js";
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import CursoController from "../controllers/course.controllers.js";

const router = Router();
const controller = new CursoController();

// CRUD Cursos
router.post(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.createCurso
);

router.get(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.getCursos
);

router.get(
  "/active",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.getCursoActive
);

router.get(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.getCursoById
);

router.get(
  "/:courseId/users",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.getCourseUsers
);

router.get(
  "/:courseId/students",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.getCourseStudents
);

router.get(
  "/:courseId/subjects",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.getCourseSubjects
);


router.put(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.updateCurso
);

router.delete(
  "/:id",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.deleteCurso
);

// ➕ Agregar usuarios al curso
router.post(
  "/:courseId/users",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.addUserToCourse
);

// ➕ Agregar alumnos al curso
router.post(
  "/:courseId/students",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.addStudentToCourse
);

// ➕ Agregar alumnos al curso
router.post(
  "/:courseId/subjects",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.addSubjectToCourse
);

// 🔄 Cambiar estado del usuario en el curso
router.patch(
  "/:courseId/users/:userId/status",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.updateUserStatus
);

// 🔄 Cambiar estado del alumno en el curso
router.patch(
  "/:courseId/students/:studentId/status",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.updateStudentStatus
);

//❌ Quitar MATERIA del curso
router.delete(
  "/:courseId/subjects/:subjectId",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.removeSubjectFromCourse
);

//❌ Eliminar alumno del curso sin dejar registro
router.delete(
   "/:courseId/students/:studentId/rollback",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.rollbackStudentFromCourse
);
//❌ Eliminar usuario del curso sin dejar registro
router.delete(
   "/:courseId/users/:userId/rollback",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.rollbackUserFromCourse
);





export default router;
