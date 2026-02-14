import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const gradeSchema = new Schema(
  {
    student: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: Types.ObjectId,
      ref: "Course",
      required: true
    },
    subject: {
      type: Types.ObjectId,
      ref: "Subject",
      required: true
    },
    teacher: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    grades: {
      firstTerm: { type: Number, min: 1, max: 10, default: null },
      secondTerm: { type: Number, min: 1, max: 10, default: null },
      recuperatory: { type: Number, min: 1, max: 10, default: null },
      december: { type: Number, min: 1, max: 10, default: null },
      february: { type: Number, min: 1, max: 10, default: null }
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // crea createdAt y updatedAt automáticos
  }
);

// Evitar duplicados: un alumno no puede tener dos notas para la misma materia y curso
gradeSchema.index({ student: 1, course: 1, subject: 1 }, { unique: true });

const Grade = model("Grade", gradeSchema);

export default Grade;
