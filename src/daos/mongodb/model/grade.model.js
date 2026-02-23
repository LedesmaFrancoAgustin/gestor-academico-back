import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const gradeSchema = new Schema(
  {
    // ===========================
    // 📌 Referencias principales
    // ===========================

    student: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    course: {
      type: Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // ===========================
    // 📌 Año lectivo
    // ===========================

    academicYear: {
      type: Number,
      required: true,
    },

    // ===========================
    // 📌 Recursante
    // ===========================

    isRepeating: {
      type: Boolean,
      default: false,
    },

    // ===========================
    // 📌 Notas + Auditoría
    // ===========================

    grades: {

    firstTerm: {
      partial: {
        value: { type: Number, default: null },
        loadedBy: { type: Types.ObjectId, ref: "User", default: null },
        loadedAt: { type: Date, default: null },
      },
      final: {
        value: { type: Number, default: null },
        loadedBy: { type: Types.ObjectId, ref: "User", default: null },
        loadedAt: { type: Date, default: null },
      },
    },

    secondTerm: {
      partial: {
        value: { type: Number, default: null },
        loadedBy: { type: Types.ObjectId, ref: "User", default: null },
        loadedAt: { type: Date, default: null },
      },
      final: {
        value: { type: Number, default: null },
        loadedBy: { type: Types.ObjectId, ref: "User", default: null },
        loadedAt: { type: Date, default: null },
      },
    },

    recuperatoryFirstTerm: {
      value: { type: Number, default: null },
      loadedBy: { type: Types.ObjectId, ref: "User", default: null },
      loadedAt: { type: Date, default: null },
    },

    december: {
      value: { type: Number, default: null },
      loadedBy: { type: Types.ObjectId, ref: "User", default: null },
      loadedAt: { type: Date, default: null },
    },

    february: {
      value: { type: Number, default: null },
      loadedBy: { type: Types.ObjectId, ref: "User", default: null },
      loadedAt: { type: Date, default: null },
    },
  }
  ,
  },
  {
    timestamps: true,
  }
);

//
// ✅ Índice único correcto
// Un alumno no puede tener 2 notas de la misma materia
// en el mismo curso y mismo año
//
gradeSchema.index(
  { student: 1, subject: 1, course: 1, academicYear: 1 },
  { unique: true }
);

export default model("Grade", gradeSchema);
