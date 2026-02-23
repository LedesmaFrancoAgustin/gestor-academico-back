import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    academicYear: {
      type: String,
      required: true,
      trim: true
    },
    // 🔥 NUEVO → orden en boletín
    order: {
      type: Number,
      required: true,
      min: 1
    },
    type: {
      type: String,
      enum: ["mandatory", "optional"],
      default: "mandatory"
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // createdAt y updatedAt automáticos
  }
);

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;
