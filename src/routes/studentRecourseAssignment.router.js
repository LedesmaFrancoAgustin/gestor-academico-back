import { Router } from 'express';
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import StudentRecourseAssignment from '../controllers/StudentRecourseAssignment.controllers.js';

const controller = new StudentRecourseAssignment();
const router = Router();

/* ===========================
   RUTAS CRUD PARA 
   =========================== */

/* 🔒 SOLO ADMIN
   Crear / registrar una recursada
   POST /api/student-recourse
*/
router.post(
  "/",
  authToken,
  authorizeRoles("superAdmin","admin"),
  controller.createStudentRecourseAssignment
);

/* 
   Obtener  /  recursante de un curso especifico
   POST /api/student-recourse
*/

router.get(
  "/recourse/:courseId",
  authToken,
  authorizeRoles("superAdmin","admin"),
  controller.getRecourseFromCourse
);

/* 
   Elimminar  /  eliminar recursante en esa ateria definitivo (Error humano)
   delete /api/studentRecourseAssignment
*/

router.delete(
  "/recourse/students/:studentRecourseAssignmentId",
  authToken,
  authorizeRoles("superAdmin","admin"),
  controller.deleteRecourseStudents
);



export default router;
