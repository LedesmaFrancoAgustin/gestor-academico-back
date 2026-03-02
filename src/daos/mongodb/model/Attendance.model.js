import mongoose from "mongoose";
const { Schema } = mongoose;

// 🔹 Registro de asistencia de un tipo de clase
const dayRecordSchema = new Schema({
  status: { type: String, enum: ['present', 'absent'], required: true },
  late: {
    isLate: { type: Boolean, default: false },
    minutes: { type: Number, min: 1, default: null }
  },
  justified: {
    isJustified: { type: Boolean, default: false },
    certificateUrl: { type: String, default: null }
  },
  notes: { type: String, default: '' }
}, { _id: false });

const attendanceSchema = new Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  academicYear: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },

  // 🔹 Map: clave = "día_tipo" (ej: "15_regular", "15_physical_education")
  records: {
    type: Map,
    of: dayRecordSchema,
    default: {}
  }
}, { timestamps: true });

// 🔐 Índice único por alumno/curso/mes/año
attendanceSchema.index(
  { studentId: 1, courseId: 1, academicYear: 1, month: 1 },
  { unique: true }
);

// 🔒 Validación de coherencia
attendanceSchema.pre("save", function(next) {
  for (const [key, record] of this.records.entries()) {
    if (record.status === 'present') {
      record.justified.isJustified = false;
    }
    if (record.status === 'absent') {
      record.late.isLate = false;
      record.late.minutes = null;
    }
  }
  next();
});

export default mongoose.model("Attendance", attendanceSchema, "attendanceStudents");