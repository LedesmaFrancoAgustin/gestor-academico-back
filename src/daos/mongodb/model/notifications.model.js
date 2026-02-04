import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // 👤 Usuario dueño de la notificación
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // 🏷️ Tipo de notificación
    type: {
      type: String,
      enum: ["nota", "falta", "mensaje", "sistema"],
      required: true
    },

    // 📝 Título
    title: {
      type: String,
      required: true
    },

    // 💬 Contenido
    message: {
      type: String,
      required: true
    },

    // 👀 ¿Fue leída?
    read: {
      type: Boolean,
      default: false,
      index: true
    },

    // ⏱️ Cuándo se leyó (clave para TTL)
    readAt: {
      type: Date,
      default: null
    },

    // ❌ Soft delete (el usuario la “borra”)
    deleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true // createdAt / updatedAt
  }
);

// =============================
// ⏳ TTL INDEXES
// =============================

// 🔹 Notificaciones LEÍDAS → se eliminan a los 30 días
notificationSchema.index(
  { readAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 30
  }
);

// 🔹 Notificaciones ELIMINADAS → se eliminan a los 7 días
notificationSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 7,
    partialFilterExpression: { deleted: true }
  }
);

export default mongoose.model("Notification", notificationSchema);
