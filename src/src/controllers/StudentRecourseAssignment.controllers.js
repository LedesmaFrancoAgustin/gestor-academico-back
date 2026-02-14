import StudentRecourseAssignmentService from "../services/studentRecourseAssignment.services.js";
import { createResponse } from "../utils.js";

const studentRecourseAssignmentService = new StudentRecourseAssignmentService();

export default class StudentRecourseAssignmentController {

  constructor() {
    this.service = studentRecourseAssignmentService;
  }

  // 🔒 Crear asignación de recursada
 createStudentRecourseAssignment = async (req, res, next) => {
  try {

    const { studentId, teachingAssignmentId, academicYear } = req.body;

    if (!studentId || !teachingAssignmentId || !academicYear) {
      return createResponse(
        res,
        400,
        null,
        "studentId, teachingAssignmentId y academicYear son obligatorios"
      );
    }

    const result = await this.service.createService({
      studentId,
      teachingAssignmentId,
      academicYear
    });

    return createResponse(
      res,
      201,
      result,
      "Recursada asignada correctamente"
    );

  } catch (error) {
    next(error);
  }
};

  // 🔒 Obtener estudiante recursante del curso
 getRecourseFromCourse = async (req, res, next) => {
  try {

    const { courseId  } = req.params;

    if (!courseId) {
      return createResponse(
        res,
        400,
        null,
        "courseId es obligatorio"
      );
    }


    const result = await this.service.getRecourseFromCourseService({courseId});

    return createResponse(
      res,
      201,
      result,
      ""
    );

  } catch (error) {
    next(error);
  }
};

  // 🔒 Eliminar estudiante recursante del curso
deleteRecourseStudents = async (req, res, next) => {
  try {
    const { studentRecourseAssignmentId } = req.params;

    if (!studentRecourseAssignmentId) {
      return createResponse(
        res,
        400,
        null,
        "studentRecourseAssignment es obligatorio"
      );
    }

    const result = await this.service.deleteRecourseStudentsService(studentRecourseAssignmentId);

    return createResponse(
      res,
      200, // ✅ Cambiado a 200 porque es eliminación
      result,
      "Recursante eliminado correctamente"
    );

  } catch (error) {
    next(error);
  }
};


}
