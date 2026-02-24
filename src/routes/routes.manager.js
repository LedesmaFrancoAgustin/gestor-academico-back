import { Router } from "express";

import usersRouter from "./users.router.js";
import courseRouter from "./course.router.js";
import subjectRouter from "./subject.router.js";
import gradeRouter from "./grade.router.js";
import notificationRouter from "./notification.router.js";
import dashboardRouter from "./dashboard.router.js";
import teachingAssignmentRouter from "./teachingAssignment.router.js"
import attendanceRouter from "./attendance.router.js"
import studentSubjectStatus from "./studentSubjectStatus.router.js"
import StudentRecourseAssignment from "./studentRecourseAssignment.router.js"
import academicYearPeriodConfig from "./AcademicYearPeriodConfig.router.js";
import importRouter from "./importMassive.router.js"


import pdfRouter from "./pdf.router.js"
//import alumnosRouter from "./alumnos.router.js";
//import docentesRouter from "./docentes.router.js";

const router = Router();

router.use("/users", usersRouter);
router.use("/course", courseRouter);
router.use("/subjects", subjectRouter);
router.use("/grade", gradeRouter);
router.use("/notifications", notificationRouter);
router.use("/dashboard", dashboardRouter);
router.use("/TeachingAssignment", teachingAssignmentRouter);
router.use("/attendance", attendanceRouter);
router.use("/studentSubjectStatus", studentSubjectStatus);
router.use("/studentRecourseAssignment", StudentRecourseAssignment);
router.use("/academicYearPeriodConfig", academicYearPeriodConfig);

router.use("/pdf", pdfRouter);
router.use("/importMassive", importRouter);
//router.use("/alumnos", alumnosRouter);
//router.use("/docentes", docentesRouter);

export default router;
