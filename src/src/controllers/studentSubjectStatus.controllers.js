import mongoose from "mongoose";
import StudentSubjectStatusService from "../services/studentSubjectStatus.services.js";
import { createResponse } from "../utils.js";

export default class StudentSubjectStatusController {

  constructor() {
    this.service = new StudentSubjectStatusService();
  }

  // ✅ Crear estado académico
  createStatus = async (req, res) => {
    try {
      const { student, subject, academicYear, status } = req.body;

      const result = await this.service.createStatus({
        student,
        subject,
        academicYear,
        status
      });

      return createResponse(res, 201, result);

    } catch (error) {
      return createResponse(res, 400, error.message);
    }
  };

      // ✅ Obtener materias pendientes del alumno
getPendingByStudentsAndSubjectId = async (req, res) => {
  try {

    const { limit = 15, q = "", subjectId } = req.query;

    // 🔴 Validación obligatoria
    if (!subjectId) {
      return createResponse(res, 400, "subjectId es requerido");
    }

    // 🔴 Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return createResponse(res, 400, "subjectId inválido");
    }

    const result = await this.service.getPendingByStudentsAndSubjectIdService(
      Number(limit),
      q,
      subjectId
    );

    return createResponse(res, 200, result);

  } catch (error) {
    console.error("Error getPendingByStudentsAndSubjectId:", error);
    return createResponse(res, 500, error.message);
  }
};

    // ✅ Obtener materias pendientes del alumno
getPendingByStudents = async (req, res) => {
  try {
     const { limit = 15, q = "" } = req.query;

    const result = await this.service.getPendingByStudentService(limit , q );

    return createResponse(res, 200, result);

  } catch (error) {
    return createResponse(res, 500, error.message);
  }
};

  // ✅ Obtener estados por año
  getByYear = async (req, res) => {
    try {
      const { year } = req.params;

      const result = await this.service.getByYear(year);

      return createResponse(res, 200, result);

    } catch (error) {
      return createResponse(res, 500, error.message);
    }
  };

  // ✅ Obtener materias pendientes del alumno
getPendingByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await this.service.getPendingByStudentId(studentId);

    return createResponse(res, 200, result);

  } catch (error) {
    return createResponse(res, 500, error.message);
  }
};

  // ✅ Obtener materias pendientes del alumno
getPendingByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await this.service.getPendingByCourseService(courseId);

    return createResponse(res, 200, result);

  } catch (error) {
    return createResponse(res, 500, error.message);
  }
};



}
