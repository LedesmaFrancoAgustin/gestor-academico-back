import Controllers from "./class.controller.js";
import TeachingAssignmentService from "../services/teachingAssignment.services.js";
import { createResponse } from "../utils.js";

const teachingAssignmentService = new TeachingAssignmentService();

export default class TeachingAssignmentController extends Controllers {
  constructor() {
    super(teachingAssignmentService);
  }

  // 🔹 Crear asignación
  create = async (req, res, next) => {
    try {
      const assignment = await this.service.createAssignment(req.body);
      createResponse(res, 201, assignment);
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
}
