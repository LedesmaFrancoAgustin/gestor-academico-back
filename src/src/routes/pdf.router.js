import { Router } from 'express';
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import PdfController from '../controllers/pdf.controllers.js';

const controller = new PdfController();
const router = Router();

// 🔓 Público
router.post("/generate/student/:courseId",
    authToken,
    authorizeRoles("superAdmin","admin","docente","alumno"),
    controller.generateStudentPdfBoletin
    );


export default router;