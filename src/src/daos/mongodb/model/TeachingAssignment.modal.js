import mongoose from "mongoose";

const teachingAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    academicYear: {
      type: Number,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* 🚀 Índice clave:
   Un docente NO puede tener duplicada
   la misma materia en el mismo curso y año
*/
teachingAssignmentSchema.index(
  { teacher: 1, subject: 1, course: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.model(
  "TeachingAssignment",
  teachingAssignmentSchema
);
