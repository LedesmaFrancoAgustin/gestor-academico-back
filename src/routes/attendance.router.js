import { Router } from 'express';
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import AttendanceController from '../controllers/attendance.controllers.js';

const controller = new AttendanceController();
const router = Router();

/* ===========================
   RUTAS CRUD PARA INASISTENCIAS
   =========================== */

/* 🔒 SOLO ADMIN
   Crear / registrar una inasistencia
   POST /api/attendance
*/
router.post(
  "/",
  authToken,
  authorizeRoles("superAdmin","admin"),
  controller.createAttendance
);

/* 🔒 SOLO ADMIN / preceptor
   Crear / registrar  inasistencia / Masiva
   POST /api/attendance
*/
router.post(
  "/massive",
  authToken,
  authorizeRoles("superAdmin","admin","preceptor"),
  controller.createAttendanceMassive
);

/* 🔓 CUALQUIER USUARIO AUTENTICADO
   Obtener presentes y ausentes del es de un curso
   GET /api/attendance/course/:courseId
   
*/
router.get(
  "/course/month/:courseId",
  authToken,
  controller.getByCourseFromMonth
);
/* 🔓 CUALQUIER USUARIO AUTENTICADO
   Obtener inasistencias de un curso
   GET /api/attendance/course/:courseId
   Opcional query: ?trimester=1&academicYear=2025&date=2025-04-22
*/
router.get(
  "/course/:courseId",
  authToken,
  controller.getByCourse
);

/* 🔓 CUALQUIER USUARIO AUTENTICADO
   Obtener inasistencias de un alumno
   GET /api/attendance/user/:userId
   Opcional query: ?courseId=xxx&trimester=1&academicYear=2025
*/
router.get(
  "/user/:userId/year",
  authToken,
  controller.getUserFromYear
);
/* 🔓 CUALQUIER USUARIO AUTENTICADO
   Obtener inasistencias total de alumno de meses anteriores x curso
   GET /api/attendance/user/:userId
   Opcional query: ?courseId=xxx&trimester=1&academicYear=2025
*/
router.get(
  "/:courseId/previous",
  authToken,
  controller.getCoursePrevious
);



/* 🔒 SOLO ADMIN
   Actualizar una inasistencia existente
   PATCH /api/attendance/:attendanceId
*/
router.patch(
  "/:attendanceId",
  authToken,
  authorizeRoles("superAdmin","admin"),
  controller.update
);

/* 🔒 SOLO ADMIN
   Eliminar / corregir una inasistencia
   DELETE /api/attendance/:attendanceId
*/
router.delete(
  "/:attendanceId",
  authToken,
  authorizeRoles("superAdmin","admin"),
  controller.delete
);

export default router;
