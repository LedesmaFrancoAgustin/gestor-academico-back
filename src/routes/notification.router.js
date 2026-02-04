import { Router } from "express";
import { authToken } from "../middlewares/authJwt.middleware.js";
import { authorizeRoles } from "../middlewares/roles.middleware.js"
import notificationController from "../controllers/notification.Controllers.js";

const router = Router();
const controller = new notificationController();

// 🔔 Obtener notificaciones del usuario logueado
router.get(
  "/",
  authToken,
  controller.getMyNotifications
);

// 🔔 Cantidad de notificaciones NO leídas (Home / Navbar)
router.get(
  "/unread/count",
  authToken,
  controller.getUnreadCount
);

// ✅ Marcar una notificación como leída
router.patch(
  "/:id/read",
  authToken,
  controller.markAsRead
);

// ❌ Eliminar notificación
router.delete(
  "/:id",
  authToken,
  controller.deleteNotification
);

// 🔧 (opcional) Crear notificación manual – solo admins
router.post(
  "/",
  authToken,
  authorizeRoles("admin", "superAdmin"),
  controller.createNotification
);

export default router;
