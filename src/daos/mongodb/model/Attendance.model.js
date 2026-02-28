import mongoose from "mongoose";

const { Schema } = mongoose;

const attendanceSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  trimester: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/  //YYYY-MM-DD
  },

  // 🔹 NUEVO CAMPO
  attendanceType: {
    type: String,
    enum: ['regular', 'physical_education'],
    required: true,
    default: 'regular'
  },

  attendanceStatus: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },

  late: {
    isLate: {
      type: Boolean,
      default: false
    },
     minutes: {
      type: Number,
      min: 1,
      default: null
    }
  },

  justification: {
    isJustified: {
      type: Boolean,
      default: false
    },
    certificateUrl: {
      type: String,
      default: null
    }
  },

  notes: {
    type: String,
    default: ''
  }

}, { timestamps: true });


// 🔐 ÍNDICE ÚNICO ACTUALIZADO
attendanceSchema.index(
  {
    userId: 1,
    courseId: 1,
    academicYear: 1,
    trimester: 1,
    date: 1,
    attendanceType: 1
  },
  { unique: true }
);

// 🔒 VALIDACIÓN DE COHERENCIA
attendanceSchema.pre("save", function(next) {

  // Si es presente → no puede estar justificado
  if (this.attendanceStatus === "present") {
    this.justification.isJustified = false;
  }

  // Si es ausente → no puede estar tarde
  if (this.attendanceStatus === "absent") {
    this.late.isLate = false;
    this.late.minutes = undefined;
  }

  next();
});

export default mongoose.model("Attendance", attendanceSchema);