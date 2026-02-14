import Controllers from "./class.controller.js";
import TeachingAssignmentService from "../services/teachingAssignment.services.js";
import { createResponse } from "../utils.js";

const teachingAssignmentService = new TeachingAssignmentService();

export default class TeachingAssignmentController extends Controllers {
  constructor() {
    super(teachingAssignmentService);
  }

  create = async (req, res, next) => {
    try {
      const { teacher, subject, course, academicYear } = req.body;

      console.log(teacher)
      if (!teacher || !subject || !course || !academicYear) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }

      const assignment = await this.service.createAssignmentService(req.body);
      createResponse(res, 201, assignment);

    } catch (error) {

      // 🔴 Duplicado por índice único de Mongo
      if (error.code === 11000) {
        return res.status(409).json({
          message: "El docente ya está asignado a esta materia en este curso y año"
        });
      }

      // 🔵 Errores personalizados del service
      if (error.status) {
        return res.status(error.status).json({
          message: error.message
        });
      }

      next(error); // error inesperado
    }
  };

    // 🔹 Materias del docente en un curso
  getTeacherAndSubjetsByCourse = async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const subjects = await this.service.getTeacherAndSubjetsByCourseService(courseId);

      createResponse(res, 200, subjects);
    } catch (error) {
      next(error);
    }
  };

  // 🔹 Materias del docente en un curso
  getSubjectIdsByTeacherAndCourse = async (req, res, next) => {
    try {
      const teacherId = req.user.id;
      const { courseId } = req.params;

      const subjects = await this.service.getSubjectIdsByTeacherAndCourse(
        teacherId,
        courseId,
      );

      createResponse(res, 200, subjects);
    } catch (error) {
      next(error);
    }
  };

   // 🔹 Materias del docente en un curso
  getSubjectIdsByUserId = async (req, res, next) => {
    try {
      const { userId } = req.params;

       const { active } = req.query; 

      const subjects = await this.service.getSubjectIdsByUserId(userId,active);

      createResponse(res, 200, subjects);
    } catch (error) {
      next(error);
    }
  };

     // 🔹  Cursos en el que dicta docente en el año enviado
  getCoursesByUserIdAndYear = async (req, res, next) => {
    try {
      const { userId } = req.params;

       const { year } = req.query; 

      if (!year || isNaN(year)) {
        return res.status(400).json({ message: "Año inválido" });
      }


      const courses = await this.service.getCoursesByUserIdAndYearService(userId , year);

      createResponse(res, 200, courses);
    } catch (error) {
      next(error);
    }
  };

     // 🔹 Materias del docente en un curso
  patchState = async (req, res, next) => {
    try {
      const { teacherId , subjectId, courseId , academicYear} = req.body; 

      const patchState = await this.service.patchStateService(teacherId , subjectId, courseId ,academicYear);

      createResponse(res, 200, patchState);
    } catch (error) {
      next(error);
    }
  };


   // 🔹 Materias del docente en un curso
  deleteAssignment = async (req, res, next) => {
    try {
      const { teacherId , subjectId, courseId , academicYear} = req.body; 

      const deleted = await this.service.deleteAssignmentService(teacherId , subjectId, courseId ,academicYear);

      createResponse(res, 200, deleted);
    } catch (error) {
      next(error);
    }
  };
}
