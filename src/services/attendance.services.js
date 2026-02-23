import mongoose from 'mongoose';
import Attendance from '../daos/mongodb/model/Attendance.model.js';
import User from "../daos/mongodb/model/users.model.js";
//import {normalizeDate} from "../utils.js";

export default class AttendanceService {


/* ====================================
   🔒 Crear / Actualizar / Borrar asistencia
==================================== */
async  createAttendanceService(data) {
  try {
    const {
      userId,
      courseId,
      academicYear,
      trimester,
      date,                 // 👈 ahora viene como string
      attendanceStatus,
      late,
      justification,
      notes
    } = data;

    // 🔒 Validación mínima defensiva
    if (!date || typeof date !== 'string') {
      throw new Error('Fecha inválida');
    }

    // 🧹 DELETE (cuando se borra asistencia)
    if (!attendanceStatus) {
      const deleted = await Attendance.findOneAndDelete({
        userId,
        courseId,
        academicYear,
        trimester,
        date
      });

      console.log("DELETED DOC:", deleted);
      return null;
    }

    // 🔁 UPSERT
    const attendance = await Attendance.findOneAndUpdate(
      {
        userId,
        courseId,
        academicYear,
        trimester,
        date
      },
      {
        $set: {
          attendanceStatus,
          late: {
            isLate: late?.isLate ?? false,
            minutes: late?.isLate ? late?.minutes ?? null : null
          },
          justification: {
            isJustified: justification?.isJustified ?? false,
            certificateUrl: justification?.certificateUrl ?? null
          },
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
async createAttendanceMassiveService({ courseId, academicYear, trimester, changes }) {

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
      notes,
      action = "update"
    } = change;

    if (!userId || !date) continue;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      courseId: courseObjectId,
      academicYear,
      trimester,
      date
    };

    /*
    ======================
    DELETE
    ======================
    */
    if (action === "delete") {

      operations.push({
        deleteOne: { filter }
      });

      continue;
    }

    /*
    ======================
    UPDATE
    ======================
    */
    if (action === "update") {

      if (attendanceStatus &&
        !["present", "absent"].includes(attendanceStatus)) continue;

      operations.push({
        updateOne: {
          filter,
          update: {
            $set: {
              ...(attendanceStatus && { attendanceStatus }),

              late: late ?? { isLate: false, minutes: null },

              justification: justification ?? { isJustified: false },

              notes: notes ?? ""
            }
          },
          upsert: true
        }
      });
    }
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
