import Controllers from "./class.controller.js"; // tu clase base
import SubjectService from "../services/subject.services.js";
import { createResponse } from "../utils.js";

const subjectService = new SubjectService();

export default class SubjectController extends Controllers {
  constructor() {
    super(subjectService);
  }

  // 🔹 Crear materia
  createSubject = async (req, res, next) => {
    try {
      const subject = await this.service.createSubject(req.body);
      createResponse(res, 201, subject);
    } catch (error) {
      next(error);
    }
  };

  // 🔹 Obtener materias (lista con paginación y búsqueda)
  getSubjects = async (req, res, next) => {
    try {
      const { limit = 15, page = 1, q = "" } = req.query;
      const result = await this.service.getSubjects({
        limit: Number(limit),
        page: Number(page),
        q
      });

      createResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  // 🔹 Obtener materia por ID
  getSubjectById = async (req, res, next) => {
    try {
      const subject = await this.service.getSubjectById(req.params.id);
      createResponse(res, 200, subject);
    } catch (error) {
      next(error);
    }
  };

  // 🔹 Actualizar materia
  updateSubject = async (req, res, next) => {
    try {
      const subject = await this.service.updateSubject(req.params.id, req.body);
      createResponse(res, 200, subject);
    } catch (error) {
      next(error);
    }
  };

  // 🔹 Eliminar materia
  deleteSubject = async (req, res, next) => {
    try {
      await this.service.deleteSubject(req.params.id);
      createResponse(res, 200, { message: "Subject deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
