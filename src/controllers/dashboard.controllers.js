// controllers/dashboard.controllers.js
import Controllers from "./class.controller.js";
import DashboardService from "../services/dashboard.services.js";
import { createResponse } from "../utils.js";

const dashboardService = new DashboardService();

export default class DashboardController extends Controllers {
  constructor() {
    super(); // No necesitamos pasar service porque ya manejamos todo aquí
  }

  // 🔹 Obtener estadísticas del dashboard
  getStats = async (req, res, next) => {
    try {
      const stats = await dashboardService.getStats();

      // stats ya tiene: { students, teachers, courses, subjects }
      createResponse(res, 200, stats);
    } catch (error) {
      next(error);
    }
  };

    // 🔹 Obtener estadísticas del dashboard
  getStatsTeacher = async (req, res, next) => {
    try {

      const teacherId = req.user.id
      const stats = await dashboardService.getStatsTeacherService(teacherId);

      // stats ya tiene: { students, teachers, courses, subjects }
      createResponse(res, 200, stats);
    } catch (error) {
      next(error);
    }
  };
}
