import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

/**
 * 🔹 Evaluaciones dentro de un período
 * (Parcial / Final)
 */
const evaluationSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ["partial", "final"]
  },

  gradingWindow: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },

  publicationDate: {
    type: Date,
    required: true
  }
}, { _id: false });

/**
 * 🔹 Período académico
 * (Primer Cuatrimestre, Segundo, etc.)
 */
const periodSchema = new Schema({
  key: {
    type: String,
    required: true,
    enum: [
      "firstTerm",
      "secondTerm",
      "recuperatoryFirstTerm",
      "december",
      "february"
    ]
  },

  name: {
    type: String,
    required: true
  },

  evaluations: {
    type: [evaluationSchema],
    validate: {
      validator: function (value) {
        // Solo exigimos partial + final en cuatrimestres
        if (["firstTerm", "secondTerm"].includes(this.key)) {
          const types = value.map(v => v.type);
          return types.includes("partial") && types.includes("final");
        }
        return true;
      },
      message: "Los cuatrimestres deben tener evaluación parcial y final"
    }
  },

  // 🔐 Cierre manual institucional
  isManuallyClosed: {
    type: Boolean,
    default: false
  },

  closedAt: {
    type: Date,
    default: null
  },

  closedBy: {
    type: Types.ObjectId,
    ref: "User",
    default: null
  }

}, { _id: false });

/**
 * 🔹 Configuración anual
 */
const academicYearPeriodConfigSchema = new Schema(
  {
    academicYear: {
      type: Number,
      required: true,
      unique: true
    },

    periods: {
      type: [periodSchema],
      required: true
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },

    updatedBy: {
      type: Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default model(
  "AcademicYearPeriodConfig",
  academicYearPeriodConfigSchema
);
