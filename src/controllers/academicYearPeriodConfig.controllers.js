import AcademicYearPeriodConfigService from '../services/academicYearPeriodConfig.services.js';
import { createResponse } from "../utils.js";

const academicYearPeriodConfigService = new AcademicYearPeriodConfigService();

export default class AcademicYearPeriodConfigControllers {

  constructor() {
    // Si querés, podrías pasar el service al constructor
    this.service = academicYearPeriodConfigService;
  }

  // 🔹 Crear configuración
  createAcademicYearPeriodConfig = async (req, res, next) => {
    try {
      const data = req.body;
      data.createdBy = req.user.id; // el user viene del authToken middleware

      const result = await this.service.createAcademicYearPeriodConfigService(data);
      return createResponse(res, 200, result, "Fechas creadas correctamente");
    } catch (error) {
      next(error);
    }
  };

  // 🔹 obtener configuracion
  getAcademicYearPeriodConfig = async (req, res, next) => {
    try {
      const { academicYear } = req.params; // 🔹 obtener año de la ruta
      const result = await this.service.getAcademicYearPeriodConfigService(academicYear);
      return createResponse(res, 200, result, "Fechas obtenidas correctamente");
    } catch (error) {
      next(error);
    }
  };
  

  // 🔹 Actualizar configuración
  updateAcademicYearPeriodConfig = async (req, res, next) => {
    try {
      const { configId } = req.params;
      const data = req.body;

      const result = await this.service.updateAcademicYearPeriodConfigService( configId, data, req.user.id );

      return createResponse(res, 200, result, "Fechas actualizadas correctamente");
    } catch (error) {
      next(error);
    }
  };


}