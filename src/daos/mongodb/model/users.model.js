import mongoose from "mongoose";

const { Schema } = mongoose;

const inasistenciaSchema = new Schema(
  {
    fecha: { type: Date, required: true },
    justificada: { type: Boolean, default: false },
    motivo: { type: String, default: "" }
  },
  { _id: false }
);

const userCourseSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      //required: true
    },
    status: {
      type: String,
      enum: ["activo", "finalizado", "abandonado", "cambiado"],
      default: "activo"
    },
    from: { type: Date },
    to: { type: Date }
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },

    dni: { type: String, required: true, unique: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      default: null
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    rol: {
      type: String,
      enum: ["superAdmin","admin", "docente", "alumno", "preceptor"],
      required: true
    },

    activo: {
      type: Boolean,
      default: true
    },
    // ==============================
    // 🔹 Datos personales extra
    // ==============================

    legajo: {
      type: String,
      trim: true,
      default: null,
      index: {
        unique: true,
        sparse: true
      }
    },

    fechaNacimiento: {
      type: Date,
      default: null
    },

    genero: {
      type: String,
      enum: ["masculino", "femenino", "otro", "no_binario"],
      default: null
    },

    libroFolio: {
      type: String,
      default: null,
      trim: true
    },

    // 🔹 Historial de cursos (clave del modelo)
    courses: {
      type: [userCourseSchema],
      default: []
    },

    // 🔹 Inasistencias por alumno
    inasistencias: {
      type: [inasistenciaSchema],
      default: []
    },

    // 🔹 Área solo para docentes
    area: {
      type: String,
      default: null,
      validate: {
        validator: function(value) {
          if (this.rol === "docente") return value && value.trim().length > 0;
          return true;
        },
        message: "Los docentes deben tener un área asignada"
      }
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
