import { Router } from 'express';
import { authToken } from '../middlewares/authJwt.middleware.js';
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import ImportMassiveController from '../controllers/importMassive.controllers.js';

const controller = new ImportMassiveController();
const router = Router();

// 🔓 Público
router.post("/students",
    authToken,
    authorizeRoles("superAdmin","admin"),
    upload.single("file"),
    controller.createMassiveStudets
    );

    // 🔓 Público
router.post("/bulk-update-fecha-nacimiento",
    authToken,
    authorizeRoles("superAdmin","admin"),
    upload.single("file"),
    controller.bulkUpdateFechaNacimiento
    );



export default router;