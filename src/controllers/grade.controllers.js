import Controllers from "./class.controller.js"; // tu clase base
import GradeService from "../services/grade.services.js";
import { createResponse } from "../utils.js";

const gradeService = new GradeService();

export default class GradeController extends Controllers {
  constructor() {
    super(gradeService);
  }

  // 🔹 Crear nota
  register = async (req, res, next) => {
    try {
      const grade = await this.service.register(req.body);
      createResponse(res, 201, grade);
    } catch (error) {
      next(error);
    }
  };
  // 🔹 Crear nota
  registerIndividualNote = async (req, res, next) => {
    try {
      const grade = await this.service.registerIndividualNote(req.body);
      createResponse(res, 201, grade);
    } catch (error) {
      next(error);
    }
  };

  // 🔹 Actualizar nota por ID
  update = async (req, res, next) => {
    try {
      const { gradeId } = req.params;
      const updatedGrade = await this.service.update(gradeId, req.body);
      createResponse(res, 200, updatedGrade);
    } catch (error) {
      next(error);
    }
  };

  // 🔹 Obtener nota por ID
  getById = async (req, res, next) => {
    try {
      const { gradeId } = req.params;
      const grade = await this.service.getById(gradeId);
      createResponse(res, 200, grade);
    } catch (error) {
      next(error);
    }
  };

   // 🔹 Obtener notaS por IdCurso
getGradesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const term = req.query.term;
    console.log("Params:", req.params, "Query:", req.query);


    // service devuelve todas las notas del curso para ese term
    const grades = await this.service.getGradesByCourse(courseId, term);

    createResponse(res, 200, grades);
  } catch (error) {
    console.error("Error en getByCourseId:", error);
    next(error); // esto genera el 500
  }
};

// 🔹 Obtener notas por IdCurso + IdMateria
getGradesByCourseAndSubject = async (req, res, next) => {
  try {
    const { courseId, subjectId } = req.params;
    const term = req.query.term;

    console.log("Params:", req.params, "Query:", req.query);

    // service devuelve las notas del curso filtradas por materia
    const grades = await this.service.getGradesByCourseAndSubject(
      courseId,
      subjectId,
      term
    );

    createResponse(res, 200, grades);
  } catch (error) {
    console.error("Error en getGradesByCourseAndSubject:", error);
    next(error); // genera el 500
  }
};

// 🔹 Obtener notas por IdCurso + IdMateria
getGradesByCourseAndStudent = async (req, res, next) => {
  try {
    const { courseId , period} = req.params;
    const userId = req.user.id;

    // service devuelve las notas del curso filtradas por materia
    const grades = await this.service.getGradesByCourseAndStudent(courseId, userId , period);

    createResponse(res, 200, grades);
  } catch (error) {
    console.error("Error en getGradesByCourseAndStudent:", error);
    next(error); // genera el 500
  }
};

// 🔹 Guardar notas
saveGrades = async (req, res, next) => {
  try {
    const gradesArray = req.body;
    const result = await this.service.saveGrades(gradesArray);

    createResponse(res, 200, result);
  } catch (error) {
    console.error("Error guardando notas:", error);

    // Enviamos el mensaje al front
    res.status(400).json({
      status: "error",
      message: error.message || "Error al guardar las notas",
      data: error.stack // opcional para debugging
    });
  }
};



  // 🔹 Listar notas con filtros
  list = async (req, res, next) => {
    try {
      const { student, course, subject } = req.query;
      const filters = {};
      if (student) filters.student = student;
      if (course) filters.course = course;
      if (subject) filters.subject = subject;

      const grades = await this.service.list(filters);
      createResponse(res, 200, grades);
    } catch (error) {
      next(error);
    }
  };
}
