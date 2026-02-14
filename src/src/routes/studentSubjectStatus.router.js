import { Router } from "express";
import { authToken } from "../middlewares/authJwt.middleware.js";
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import StudentSubjectStatusController from "../controllers/studentSubjectStatus.controllers.js"

const router = Router();
const controller = new StudentSubjectStatusController();

router.post(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.createStatus
);

router.get(
  "/students/pending",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getPendingByStudents
);

router.get(
  "/students/pending/subjectId",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getPendingByStudentsAndSubjectId
);

router.get(
  "/year/:year",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getByYear
);

router.get(
  "/student/:studentId/pending",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getPendingByStudentId
);

router.get(
  "/course/:courseId/pending",
  authToken,
  authorizeRoles("superAdmin", "admin", "docente"),
  controller.getPendingByCourse
);


export default router;
