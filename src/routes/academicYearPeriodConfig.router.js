import { Router } from "express";
import { authToken } from "../middlewares/authJwt.middleware.js";
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import AcademicYearPeriodConfig from "../controllers/academicYearPeriodConfig.controllers.js";

const router = Router();
const controller = new AcademicYearPeriodConfig();

// Crear configuración
router.post(
  "/",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.createAcademicYearPeriodConfig
);

// Con parámetro en la ruta
router.get(
  "/:academicYear",
  authToken,
  authorizeRoles("superAdmin", "admin","docente"),
  controller.getAcademicYearPeriodConfig
);

// Actualizar configuración por año académico
router.put(
  "/:academicYear",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.updateAcademicYearPeriodConfig
);

// Con parámetro en la ruta
router.patch(
  "/:configId",
  authToken,
  authorizeRoles("superAdmin", "admin"),
  controller.updateAcademicYearPeriodConfig
);


export default router;