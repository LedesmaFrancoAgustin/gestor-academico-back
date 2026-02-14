import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const studentRecourseAssignmentSchema = new Schema(
  {
    studentId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    teachingAssignmentId: {
      type: Types.ObjectId,
      ref: "TeachingAssignment",
      required: true,
      index: true
    },

    academicYear: {
      type: Number,
      required: true,
      index: true
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * 🔒 Evita duplicar al mismo alumno
 * en la misma asignación docente y año académico
 * Esto permite que un profesor tenga varios recursantes,
 * pero el mismo alumno no se repite en la misma materia/año
 */
studentRecourseAssignmentSchema.index(
  { studentId: 1, teachingAssignmentId: 1, academicYear: 1 },
  { unique: true }
);

/**
 * 🚀 Índice para performance cuando
 * el docente busca sus recursantes activos
 */
studentRecourseAssignmentSchema.index(
  { teachingAssignmentId: 1, active: 1 }
);

/**
 * 🔹 Opcional: índice por alumno para consultas rápidas
 * por ejemplo si querés saber todas las materias recursadas de un alumno
 */
studentRecourseAssignmentSchema.index(
  { studentId: 1, academicYear: 1 }
);

const StudentRecourseAssignment = model(
  "StudentRecourseAssignment",
  studentRecourseAssignmentSchema
);

export default StudentRecourseAssignment;
