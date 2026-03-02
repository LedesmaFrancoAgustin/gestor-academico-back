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
   🔒 Crear / Actualizar / Borrar asistencia MASIVA
==================================== */
async createAttendanceMassiveService({courseId,academicYear,month, changes }) {       // 🔹 reemplaza trimester

  if (!Array.isArray(changes)) {
    return { message: "changes debe ser un array" };
  }

  const operations = [];
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const allowedTypes = ["regular", "physical_education"];

  for (const change of changes) {
    const { studentId, day, attendanceType, attendanceStatus, late, justified, notes } = change;

    // ✅ Validar tipo permitido
    if (!allowedTypes.includes(attendanceType)) continue; // ignorar cambios inválidos

    // Resto de tus validaciones existentes
    if (!studentId || !day) continue;
    if (day < 1 || day > 31) continue;
    

    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const key = `${day}_${attendanceType}`;

    /*
    ======================
    DELETE
    ======================
    */
    if (!attendanceStatus) {
      operations.push({
        updateOne: {
          filter: { studentId: studentObjectId, courseId: courseObjectId, academicYear, month },
          update: { $unset: { [`records.${key}`]: "" } }
        }
      });
      continue;
    }

    if (!["present", "absent"].includes(attendanceStatus)) continue;
    /*
    ===============================
    🔒 NORMALIZACIÓN
    ===============================
    */
    let normalizedLate = { isLate: false, minutes: null };
    let normalizedJustified = { isJustified: false, certificateUrl: null };

    if (attendanceStatus === "present") {
      normalizedLate = {
        isLate: late?.isLate ?? false,
        minutes: late?.isLate ? late?.minutes ?? null : null
      };
      normalizedJustified = { isJustified: false, certificateUrl: null };
    }

    if (attendanceStatus === "absent") {
      normalizedLate = { isLate: false, minutes: null };
      normalizedJustified = {
        isJustified: justified?.isJustified ?? false,
        certificateUrl: justified?.certificateUrl ?? null
      };
    }

    /*
    ======================
    UPSERT
    ======================
    */
    operations.push({
      updateOne: {
        filter: { studentId: studentObjectId, courseId: courseObjectId, academicYear, month },
        update: {
          $set: {
            [`records.${key}`]: {
              status: attendanceStatus,
              late: normalizedLate,
              justified: normalizedJustified,
              notes: notes ?? ""
            }
          }
        },
        upsert: true
      }
    });
  }
console.log("OPERATIONS:", operations.length);

  if (!operations.length) {
    return { message: "No hubo operaciones válidas" };
  }

  const result = await Attendance.bulkWrite(operations);
  return result;
}
/* ====================================
  🔓 Obtener solo attendance de un curso por mes
==================================== */
async getByCourseFromMonthService(courseId, year, month) {
  if (!courseId || !year || !month) {
    throw new Error("Faltan parámetros");
  }

  const courseObjectId = new mongoose.Types.ObjectId(courseId);
  const academicYear = parseInt(year);
  const monthNumber = parseInt(month);

  // 🔹 Traer solo studentId y records
  const attendances = await Attendance.find(
    {
      courseId: courseObjectId,
      academicYear,
      month: monthNumber
    },
    {
      studentId: 1,
      records: 1,
      _id: 0 // opcional, si no quieres el _id de Mongo
    }
  ).lean();

  return attendances; // ya retorna [{ studentId, records }, ...]
}
/* ====================================
  🔓 Obtener total de inasistencias por meses anteriores (solo IDs)
==================================== */
async getCoursePreviousService(courseId, year, month) {

  if (!courseId || !year || !month) {
    throw new Error("Faltan parámetros");
  }

  const monthNumber = parseInt(month);
  const academicYear = parseInt(year);

  if (monthNumber <= 1) return []; // no hay meses anteriores

  const startMonth = 1;
  const endMonth = monthNumber - 1;

  // 🔹 Traer documentos de meses anteriores
  const attendances = await Attendance.find(
    {
      courseId: new mongoose.Types.ObjectId(courseId),
      academicYear,
      month: { $gte: startMonth, $lte: endMonth }
    },
    {
      studentId: 1,
      records: 1,
      _id: 0 // opcional
    }
  ).lean();

  if (!attendances.length) return [];

  // 🧠 Mapa studentId -> acumulador de inasistencias ponderadas
  const absencesByStudent = {};

  for (const doc of attendances) {
    const studentId = doc.studentId.toString();
    if (!absencesByStudent[studentId]) absencesByStudent[studentId] = 0;

    for (const [key, record] of Object.entries(doc.records || {})) {
      const [, attendanceType] = key.split("_"); // "regular" o "physical_education"

      // 🔴 Regular ausente no justificado = 1
      if (attendanceType === "regular" && record.status === "absent" && !record.justified.isJustified) {
        absencesByStudent[studentId] += 1;
      }

      // 🟡 Regular presente tarde = 0.25
      if (attendanceType === "regular" && record.status === "present" && record.late?.isLate) {
        absencesByStudent[studentId] += 0.25;
      }

      // 🔴 Educación física ausente no justificado = 0.5
      if (attendanceType === "physical_education" && record.status === "absent" && !record.justified.isJustified) {
        absencesByStudent[studentId] += 0.5;
      }
    }
  }

  // 🔹 Construir resultado final solo con studentId y totalWeightedAbsences
  const result = Object.entries(absencesByStudent).map(([studentId, total]) => ({
    studentId,
    totalWeightedAbsences: Math.round(total * 100) / 100
  }));

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
