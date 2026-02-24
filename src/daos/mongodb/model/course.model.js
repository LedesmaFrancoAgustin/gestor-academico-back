import mongoose from "mongoose";

const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    modality: {
      type: String,
      enum: [
        "Arte",
        "Comunicación"
      ],
      required: true
    },

    academicYear: {
      type: Number,
      required: true,
    },

    active: {
      type: Boolean,
      required: true,
      default: true
    },

    users: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["PRECEPTOR", "TUTOR" , "DIRECTIVO" ,"DOCENTE" ] }
      }
    ],

    subjects: [
      {
        subject: { type: Schema.Types.ObjectId, ref: "Subject" },
        teacher: { type: Schema.Types.ObjectId, ref: "User" }
      }
    ],

    students: [
      {
        student: { type: Schema.Types.ObjectId, ref: "User" },
        active: { type: Boolean, default: true }
      }
    ]
  },
  { timestamps: true }
  
);

// 🔒 Evita duplicar cursos en el mismo año
courseSchema.index({ code: 1, academicYear: 1 }, { unique: true });
courseSchema.index({ academicYear: 1 });


export default mongoose.model("Course", courseSchema);
