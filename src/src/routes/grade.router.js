import { Router } from 'express';
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import GradeController from '../controllers/grade.controllers.js';

const controller = new GradeController();
const router = Router();

// 🔒 CREAR UNA NOTA
router.post(
  "/register",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.register
);

// 🔒 CREAR UNA NOTA
router.post(
  "/register/individualNote",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.registerIndividualNote
);
// 🔒 GUARDAR VARIAS NOTAS (bulk)
router.post(
  "/save",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"), // docentes también pueden guardar
  controller.saveGrades
);


// 🔒 ACTUALIZAR NOTA
router.patch(
  "/:gradeId",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.update
);

// 🔒 LISTAR NOTAS POR ALUMNO Y/O CURSO
router.get(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin", "teacher"),
  controller.list
);


// 🔒 OBTENER UNA NOTA POR ID
router.get(
  "/:gradeId",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente", "alumno"),
  controller.getById
);

// 🔒 OBTENER TODAS LAS NOTAS DE UN CURSO (vista completa / libreta)
router.get(
  "/course/:courseId",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente", "alumno"),
  controller.getGradesByCourse
  
);

// 🔒 OBTENER NOTAS DE UN CURSO POR MATERIA (carga / edición)
router.get(
  "/course/:courseId/subject/:subjectId",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getGradesByCourseAndSubject
);

// 🔒 OBTENER NOTAS DE UN CURSO POR MATERIA (carga / edición)
router.get(
  "/course/:courseId/student",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente","alumno"),
  controller.getGradesByCourseAndStudent
);



export default router;
