import Controllers from "./class.controller.js";
import NotificationService from "../services/notification.services.js";
import { createResponse } from "../utils.js";

const notificationService = new NotificationService();

export default class NotificationController extends Controllers {
  constructor() {
    super(notificationService);
  }

  // 🔔 Obtener notificaciones del usuario logueado
  getMyNotifications = async (req, res, next) => {
    try {
      const userId = req.user.id;

      const notifications =
        await notificationService.getByUser(userId);

      createResponse(res, 200, notifications);
    } catch (error) {
      next(error);
    }
  };

  // 🔔 Cantidad de no leídas (badge)
  getUnreadCount = async (req, res, next) => {
    try {
      const userId = req.user.id;

      const count =
        await notificationService.getUnreadCount(userId);

      createResponse(res, 200, { count });
    } catch (error) {
      next(error);
    }
  };

  // ✅ Marcar como leída
  markAsRead = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification =
        await notificationService.markAsRead(id, userId);

      createResponse(res, 200, notification);
    } catch (error) {
      next(error);
    }
  };

  // ❌ Soft delete
  deleteNotification = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await notificationService.softDelete(id, userId);

      createResponse(res, 200, {
        message: "Notificación eliminada"
      });
    } catch (error) {
      next(error);
    }
  };

  // 🔧 Crear notificación (admin)
  createNotification = async (req, res, next) => {
    try {
      const data = req.body;

      const notification =
        await notificationService.create(data);

      createResponse(res, 201, notification);
    } catch (error) {
      next(error);
    }
  };
}
