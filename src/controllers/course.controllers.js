import Controllers from "./class.controller.js";
import CursoService from "../services/course.services.js";
import { createResponse } from "../utils.js";


const cursoService = new CursoService();

export default class CursoController extends Controllers{
  constructor(){
    super(cursoService)
  }
  
  createCurso = async (req, res, next) => {
    try {
      const curso = await this.service.createCurso(req.body);
      createResponse(res, 201, curso);
    } catch (error) {
      next(error);
    }
  };

  getCursos = async (req, res, next) => {
    try {
      const { limit, page , q } = req.query;
      const result = await this.service.getCursos({ limit, page, q });
      createResponse(res, 201, result);
    } catch (error) {
      next(error);
    }
  };
   getCursoActive = async (req, res, next) => {
    try {
      const { limit, page , q } = req.query;
      const result = await this.service.getCursoActive({ limit, page, q });
      createResponse(res, 201, result);
    } catch (error) {
      next(error);
    }
  };

  getCursoById = async (req, res, next) => {
    try {
      const curso = await this.service.getCursoById(req.params.id);
      createResponse(res, 201, curso);
    } catch (error) {
      next(error);
    }
  };
  
  getCourseUsers = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const users = await this.service.getCourseUsers(courseId);

    createResponse(res, 200, users);
  } catch (error) {
    next(error);
  }
};

  getCourseStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const students = await this.service.getCourseStudents(courseId);

    createResponse(res, 200, students);
  } catch (error) {
    next(error);
  }
};

  getCourseSubjects = async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const Subjects = await this.service.getCourseSubjects(courseId);

      createResponse(res, 200, Subjects);
    } catch (error) {
      next(error);
    }
  };


  updateCurso = async (req, res, next) => {
    try {
      const curso = await this.service.updateCurso(req.params.id, req.body);
      createResponse(res, 201, curso);
    } catch (error) {
      next(error);
    }
  };

  deleteCurso = async (req, res, next) => {
    try {
      const curso = await this.service.deleteCurso(req.params.id);
      createResponse(res, 201, curso);
    } catch (error) {
      next(error);
    }
  };
// ➕ Agregar usuario al curso
  addUserToCourse = async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const  payload  = req.body
      
      const result = await this.service.addUserToCourse(courseId, payload);
      createResponse(res, 201, result);
    } catch (error) {
      next(error);
    }
  };

  // ➕ Agregar estudiante al curso
addStudentToCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      throw new Error("studentId es obligatorio");
    }

    const result = await this.service.addStudentToCourse(courseId, studentId);
    createResponse(res, 201, result);
  } catch (error) {
    next(error);
  }
};

// ➕ Agregar materia al curso
// controllers/course.controllers.js
addSubjectToCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { subjectId, teacherId } = req.body; // se puede asignar un profesor opcional
    const result = await this.service.addSubjectToCourse(courseId, { subjectId, teacherId });
    createResponse(res, 201, result);
  } catch (error) {
    next(error);
  }
};
//❌ Quitar usuario del curso
updateUserStatus = async (req, res, next) => {
  try {
    const { courseId, userId } = req.params;
    const {status} = req.body;
    const curso = await this.service.updateUserStatus(courseId, userId, status);
    createResponse(res, 200, curso);
  } catch (error) {
    next(error);
  }
};
//❌ Quitar alumno del curso
updateStudentStatus = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;
    const { status } = req.body;
    const curso = await this.service.updateStudentStatus(courseId, studentId ,status );
    createResponse(res, 200, curso);
  } catch (error) {
    next(error);
  }
};
//❌ Quitar materia del curso
removeSubjectFromCourse = async (req, res, next) => {
  try {
    const { courseId, subjectId } = req.params;
    const curso = await this.service.removeSubjectFromCourse(courseId, subjectId);
    createResponse(res, 200, curso);
  } catch (error) {
    next(error);
  }
};

//❌ Eliminar alumno del curso sin dejar registro
rollbackUserFromCourse = async (req, res, next) => {
  try {
    const { courseId, userId } = req.params;
    const curso = await this.service.rollbackUserFromCourse(courseId, userId);
    createResponse(res, 200, curso);
  } catch (error) {
    next(error);
  }
};
//❌ Eliminar alumno del curso sin dejar registro
rollbackStudentFromCourse = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;
    const curso = await this.service.rollbackStudentFromCourse(courseId, studentId);
    createResponse(res, 200, curso);
  } catch (error) {
    next(error);
  }
};



}


