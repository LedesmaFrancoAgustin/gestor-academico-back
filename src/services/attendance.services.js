import mongoose from 'mongoose';
import Attendance from '../daos/mongodb/model/Attendance.model.js';
import User from "../daos/mongodb/model/users.model.js";
import moment from "moment";
//import {normalizeDate} from "../utils.js";

export default class AttendanceService {


/* ====================================
   🔒 Crear / Actualizar / Borrar asistencia
==================================== */
/* ====================================
   🔒 Crear / Actualizar / Borrar asistencia
==================================== */
async createAttendanceService(data) {
  try {
    const {
      userId,
      courseId,
      academicYear,
      trimester,
      date,
      attendanceType = 'regular', // 👈 NUEVO
      attendanceStatus,
      late,
      justification,
      notes
    } = data;

    // 🔒 Validación básica
    if (!date || typeof date !== 'string') {
      throw new Error('Fecha inválida');
    }

    if (!attendanceType) {
      throw new Error('Tipo de asistencia requerido');
    }

    // 🧹 DELETE (cuando se borra asistencia)
    if (!attendanceStatus) {
      const deleted = await Attendance.findOneAndDelete({
        userId,
        courseId,
        academicYear,
        trimester,
        date,
        attendanceType // 👈 IMPORTANTE
      });

      return null;
    }

    /* ===============================
       🔒 NORMALIZACIÓN DE DATOS
    =============================== */

    let normalizedLate = {
      isLate: false,
      minutes: null
    };

    let normalizedJustification = {
      isJustified: false,
      certificateUrl: null
    };

    // 🟢 PRESENTE
    if (attendanceStatus === 'present') {
      normalizedLate = {
        isLate: late?.isLate ?? false,
        minutes: late?.isLate ? late?.minutes ?? null : null
      };

      // 🔥 Regla institucional:
      // Presente NO puede estar justificado
      normalizedJustification = {
        isJustified: false,
        certificateUrl: null
      };
    }

    // 🔴 AUSENTE
    if (attendanceStatus === 'absent') {

      // 🔥 Regla institucional:
      // Ausente NO puede estar tarde
      normalizedLate = {
        isLate: false,
        minutes: null
      };

      normalizedJustification = {
        isJustified: justification?.isJustified ?? false,
        certificateUrl: justification?.certificateUrl ?? null
      };
    }

    // 🔁 UPSERT
    const attendance = await Attendance.findOneAndUpdate(
      {
        userId,
        courseId,
        academicYear,
        trimester,
        date,
        attendanceType // 👈 AHORA FORMA PARTE DEL ÍNDICE
      },
      {
        $set: {
          attendanceStatus,
          attendanceType,
          late: normalizedLate,
          justification: normalizedJustification,
          notes: notes ?? ''
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    return attendance;

  } catch (error) {
    throw error;
  }
}
/* ====================================
   🔒 Crear / Actualizar / Borrar asistencia / mASIVO
==================================== */
async createAttendanceMassiveService({
  courseId,
  academicYear,
  trimester,
  changes,
  attendanceType = "regular" // 👈 NUEVO
}) {

  if (!Array.isArray(changes)) {
    return { message: "changes debe ser un array" };
  }

  const operations = [];
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  for (const change of changes) {

    const {
      userId,
      date,
      attendanceStatus,
      late,
      justification,
      notes
    } = change;

    if (!userId || !date) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!attendanceType) continue;

    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      courseId: courseObjectId,
      academicYear,
      trimester,
      date,
      attendanceType // 👈 AHORA FORMA PARTE DEL FILTRO
    };

    /*
    ======================
    DELETE
    ======================
    */
    if (!attendanceStatus) {
      operations.push({
        deleteOne: { filter }
      });
      continue;
    }

    if (!["present", "absent"].includes(attendanceStatus)) continue;

    /*
    ===============================
    🔒 NORMALIZACIÓN (IGUAL QUE INDIVIDUAL)
    ===============================
    */

    let normalizedLate = {
      isLate: false,
      minutes: null
    };

    let normalizedJustification = {
      isJustified: false,
      certificateUrl: null
    };

    // 🟢 PRESENTE
    if (attendanceStatus === "present") {

      normalizedLate = {
        isLate: late?.isLate ?? false,
        minutes: late?.isLate ? late?.minutes ?? null : null
      };

      normalizedJustification = {
        isJustified: false,
        certificateUrl: null
      };
    }

    // 🔴 AUSENTE
    if (attendanceStatus === "absent") {

      normalizedLate = {
        isLate: false,
        minutes: null
      };

      normalizedJustification = {
        isJustified: justification?.isJustified ?? false,
        certificateUrl: justification?.certificateUrl ?? null
      };
    }

    /*
    ======================
    UPSERT
    ======================
    */

    operations.push({
      updateOne: {
        filter,
        update: {
          $set: {
            attendanceStatus,
            attendanceType,
            late: normalizedLate,
            justification: normalizedJustification,
            notes: notes ?? ""
          }
        },
        upsert: true
      }
    });
  }

  if (!operations.length) {
    return { message: "No hubo operaciones válidas" };
  }

  const result = await Attendance.bulkWrite(operations);

  return result;
}
/* ====================================
  🔓 Obtener inasistencias de un curso por mes
==================================== */
async getByCourseFromMonthService(courseId, year, month) {
  if (!courseId || !year || !month) {
    throw new Error("Faltan parámetros");
  }

  // 📅 Normalizar mes
  month = parseInt(month).toString().padStart(2, "0");

  // 📅 Rangos string YYYY-MM-DD
  const startDate = `${year}-${month}-01`;

  const nextMonth = (parseInt(month) === 12)
    ? `${parseInt(year) + 1}-01-01`
    : `${year}-${(parseInt(month) + 1).toString().padStart(2, "0")}-01`;

  const attendances = await Attendance.find({
    courseId: new mongoose.Types.ObjectId(courseId),
    date: {
      $gte: startDate,
      $lt: nextMonth
    }
  }).lean();

  if (!attendances.length) return [];

  // 🧠 Mapa userId -> asistencias
  const attendanceByUser = attendances.reduce((acc, a) => {
    const key = a.userId.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const userIds = Object.keys(attendanceByUser);

  const users = await User.find({ _id: { $in: userIds } })
    .select("nombre apellido dni")
    .lean();

  const result = users.map(u => {
    const userAttendances = attendanceByUser[u._id.toString()] || [];

    return {
      _id: u._id,
      name: `${u.apellido} ${u.nombre}`,
      dni: u.dni,
      presents: userAttendances.filter(a => a.attendanceStatus === "present").length,
      absents: userAttendances.filter(a => a.attendanceStatus === "absent").length,
      details: userAttendances.map(a => ({
        date: a.date,
        attendanceType : a.attendanceType,
        trimester: a.trimester,
        status: a.attendanceStatus,
        notes: a.notes,
        late: a.late,
        justification: a.justification
      }))
    };
  });

  return result;
}

/* ====================================
  🔓 Obtener total de inasistencias por meses anteriores 
==================================== */
async  getCoursePreviousService(courseId, year, month) {
  if (!courseId || !year || !month) {
    throw new Error("Faltan parámetros");
  }

  const monthNumber = parseInt(month);

  if (monthNumber <= 1) {
    return []; // no hay meses anteriores
  }

  const startMonth = 1;
  const endMonth = monthNumber - 1;

  const startDate = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endDate = moment(`${year}-${String(endMonth).padStart(2, "0")}-01`)
    .endOf("month")
    .format("YYYY-MM-DD");

  const aggregation = await Attendance.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        academicYear: year,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $addFields: {
        absenceValue: {
          $switch: {
            branches: [
              // physical_education ausente = 0.5
              {
                case: {
                  $and: [
                    { $eq: ["$attendanceType", "physical_education"] },
                    { $eq: ["$attendanceStatus", "absent"] }
                  ]
                },
                then: 0.5
              },
              // regular ausente con justification = false = 1
              {
                case: {
                  $and: [
                    { $eq: ["$attendanceType", "regular"] },
                    { $eq: ["$attendanceStatus", "absent"] },
                    { $eq: ["$justification.isJustified", false] }
                  ]
                },
                then: 1
              },
              // regular present con late = true = 0.25
              {
                case: {
                  $and: [
                    { $eq: ["$attendanceType", "regular"] },
                    { $eq: ["$attendanceStatus", "present"] },
                    { $eq: ["$late.isLate", true] }
                  ]
                },
                then: 0.25
              }
            ],
            default: 0
          }
        }
      }
    },
    {
      $group: {
        _id: "$userId",
        totalWeightedAbsences: { $sum: "$absenceValue" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        name: "$user.nombre",
        lastname: "$user.apellido",
        totalWeightedAbsences: 1
      }
    }
  ]);

  return aggregation;
}

  /* ====================================
     🔓 Obtener inasistencias de un alumno
     filters = { userId, ?, ?, academicYear? }
  ==================================== */
 async getUserFromYearServices(userId, academicYear) {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("userId inválido");
    }

    if (!academicYear) {
      throw new Error("academicYear es requerido");
    }

    const records = await Attendance.find({
      userId,
      academicYear,
      attendanceStatus: "absent"
    })
      .sort({ date: 1 })          // orden cronológico
      .select("-__v")              // opcional
      .lean();

    return records;
  }
  /* ====================================
  🔓 Obtener inasistencias de un curso
  filters = { courseId, trimester?, academicYear?, date? }
  ==================================== */
  async getByCourse(filters) {
    try {
      return await Attendance.find(filters).sort({ date: 1, userId: 1 });
    } catch (error) {
      throw error;
    }
  }
  /* ====================================
     🔒 Actualizar una inasistencia existente
     id = attendanceId
     data = campos a actualizar
  ==================================== */
  async updateAttendance(id, data) {
    try {
      const attendance = await Attendance.findById(id);
      if (!attendance) throw new Error("Inasistencia no encontrada");

      // Actualizamos solo los campos que llegaron
      for (const key in data) {
        if (data[key] !== undefined) attendance[key] = data[key];
      }

      await attendance.save();
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  /* ====================================
     🔒 Eliminar / corregir una inasistencia
     id = attendanceId
  ==================================== */
  async deleteAttendance(id) {
    try {
      const attendance = await Attendance.findById(id);
      if (!attendance) throw new Error("Inasistencia no encontrada");

      await attendance.deleteOne();
      return true;
    } catch (error) {
      throw error;
    }
  }
}
