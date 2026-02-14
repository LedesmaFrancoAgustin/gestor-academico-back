import mongoose from "mongoose";
import Notification from "../daos/mongodb/model/notifications.model.js";
import User from "../daos/mongodb/model/users.model.js";

export default class NotificationService {

  // =============================
  // 🔔 Obtener notificaciones del usuario
  // =============================
  async getByUser(userId) {
    return await Notification.find({
      user: userId,
      deleted: false
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  // =============================
  // 🔔 Cantidad de no leídas
  // =============================
  async getUnreadCount(userId) {
    return await Notification.countDocuments({
      user: userId,
      read: false,
      deleted: false
    });
  }

  // =============================
  // ✅ Marcar como leída
  // =============================
  async markAsRead(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error("ID de notificación inválido");
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: userId,
        deleted: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notificación no encontrada");
    }

    return notification;
  }

  // =============================
  // ❌ Soft delete
  // =============================
  async softDelete(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error("ID de notificación inválido");
    }

    const result = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: userId,
        deleted: false
      },
      {
        $set: {
          deleted: true
        }
      },
      { new: true }
    );

    if (!result) {
      throw new Error("Notificación no encontrada");
    }

    return result;
  }

  // =============================
  // 🔧 Crear notificación (admin)
  // =============================
  async create(data) {
    const notification = new Notification({
      user: data.user,
      type: data.type,
      title: data.title,
      message: data.message
    });

    return await notification.save();
  }
}