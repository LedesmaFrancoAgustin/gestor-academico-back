import mongoose from "mongoose";

const { Schema, model } = mongoose;

const studentSubjectStatusSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true
    },

    academicYear: {
      type: Number,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["aprobada", "desaprobada"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * 🔐 Índice compuesto único
 * Un alumno solo puede tener un resultado
 * por materia por año académico.
 */
studentSubjectStatusSchema.index(
  { student: 1, subject: 1, academicYear: 1 },
  { unique: true }
);

studentSubjectStatusSchema.index({
  student: 1,
  status: 1
});


export default model(
  "StudentSubjectStatus",
  studentSubjectStatusSchema
);
