// routes/dashboard.js
import { Router } from 'express';
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import DashboardController from '../controllers/dashboard.controllers.js';

const controller = new DashboardController();
const router = Router();

// 🔒 Obtener estadísticas del dashboard
router.get(
    "/stats",
    authToken,
    authorizeRoles("superAdmin", "admin"),
    controller.getStats
);

// 🔒 Obtener estadísticas del dashboard
router.get(
    "/stats/teacher",
    authToken,
    authorizeRoles("superAdmin", "admin", "docente"),
    controller.getStatsTeacher
);

// 🔒 Obtener estadísticas del dashboard / Cursos activos del preceptor // alumnos
router.get(
    "/stats/:idPreceptor",
    authToken,
    authorizeRoles("superAdmin", "admin", "preceptor"),
    controller.getStatsPreceptorDashboard
);


export default router;
