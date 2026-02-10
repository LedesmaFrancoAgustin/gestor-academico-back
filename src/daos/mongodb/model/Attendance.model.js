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
    match: /^\d{4}-\d{2}-\d{2}$/ // opcional pero MUY recomendado
  }
  ,
  attendanceStatus: {
    type: String,
    enum: ['present', 'absent'],
    required: false   // ⬅️ permite borrar o "-"
  },
  late: {
    isLate: {
      type: Boolean,
      default: false
    },
    minutes: {
      type: Number,
      min: 1,
      required: function() {
        return this.late.isLate;
      }
    }
  },
  justification: {
    isJustified: {
      type: Boolean,
      default: false
    },
    certificateUrl: {
      type: String,  // Opcional por ahora
      default: null
    }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// 🔒 ÍNDICE ÚNICO CORRECTO
attendanceSchema.index(
  {
    userId: 1,
    courseId: 1,
    academicYear: 1,
    trimester: 1,
    date: 1
  },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);