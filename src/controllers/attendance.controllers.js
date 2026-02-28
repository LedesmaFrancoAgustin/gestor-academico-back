import AttendanceService from '../services/attendance.services.js';
import { createResponse } from "../utils.js";

const attendanceService = new AttendanceService();

export default class AttendanceController {

  constructor() {
    // Si querés, podrías pasar el service al constructor
    this.service = attendanceService;
  }

    // 🔒 Crear / Actualizar / Borrar asistencia
  createAttendance = async (req, res, next) => {
      try {
        const data = req.body;

        // ❗ Validaciones mínimas SIEMPRE
        if (
          !data.userId ||
          !data.courseId ||
          !data.academicYear ||
          !data.trimester ||
          !data.date
        ) {
          return createResponse(res, 400, null, "Faltan datos obligatorios");
        }

        // 📅 Validar formato de fecha YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
          return createResponse(res, 400, null, "Formato de fecha inválido");
        }

        // 🧹 DELETE (cuando viene "-" o vacío)
        if (!data.attendanceStatus) {
          await this.service.createAttendanceService(data);
          return res.status(204).send();
        }

        // ✅ VALIDACIONES SOLO SI CREA / ACTUALIZA
        if (!["present", "absent"].includes(data.attendanceStatus)) {
          return createResponse(res, 400, null, "Estado de asistencia inválido");
        }

        if (data.attendanceStatus === "absent" && data.late?.isLate) {
          return createResponse(res, 400, null, "No puede llegar tarde si está ausente");
        }

        if (
          data.late?.isLate &&
          data.late.minutes !== undefined &&
          data.late.minutes < 1
        ) {
          return createResponse(res, 400, null, "Los minutos deben ser mayores a 0");
        }

        // 🔁 UPSERT
        const attendance = await this.service.createAttendanceService(data);

        return createResponse(res, 200, attendance, "Asistencia guardada correctamente");

      } catch (error) {
        next(error);
      }
  };

  // 🔒 Crear / Actualizar / Borrar asistencia MASIVA
createAttendanceMassive = async (req, res, next) => {
    try {
      const {
        courseId,
        academicYear,
        trimester,
        attendanceType = "regular", // 👈 NUEVO
        changes
      } = req.body;

      console.log("courseId:", courseId);
      console.log("academicYear:", academicYear);
      console.log("trimester:", trimester);
      console.log("attendanceType:", attendanceType);
      console.log("changes:", changes);

      // 🔒 Validaciones base
      if (
        !courseId ||
        !academicYear ||
        !trimester ||
        !attendanceType ||
        !Array.isArray(changes)
      ) {
        return createResponse(res, 400, null, "Datos inválidos");
      }

      if (changes.length === 0) {
        return createResponse(res, 400, null, "No hay cambios para guardar");
      }

      const result = await this.service.createAttendanceMassiveService({
        courseId,
        academicYear,
        trimester,
        attendanceType, // 👈 AHORA SE ENVÍA
        changes
      });

      return createResponse(res, 200, result, "Asistencia guardada correctamente");

    } catch (error) {
      next(error);
    }
};


  // 🔓 Obtener inasistencias de un curso por mes
  getByCourseFromMonth = async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const { year, month } = req.query;

      // ❗ Validaciones básicas
      if (!courseId || !year || !month) {
        return createResponse(res, 400, null, "Todos los campos son obligatorios");
      }

      // 📅 Validar año
      if (!/^\d{4}$/.test(year)) {
        return createResponse(res, 400, null, "Año inválido");
      }

      // 📅 Validar mes
      const monthNumber = parseInt(month);
      if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        return createResponse(res, 400, null, "Mes inválido");
      }

      const records = await this.service.getByCourseFromMonthService(
        courseId,
        year,
        monthNumber
      );

      return createResponse(
        res,
        200,
        records,
        "Inasistencias obtenidas correctamente"
      );

    } catch (error) {
      next(error);
    }
  };



  /// Revisarr -----------------------------------------------------
  // 🔓 Obtener inasistencias de un curso
  getByCourse = async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const { trimester, academicYear, date } = req.query;

      const filters = { courseId };
      if (trimester) filters.trimester = Number(trimester);
      if (academicYear) filters.academicYear = academicYear;
      if (date) filters.date = new Date(date);

      const records = await this.service.getByCourse(filters);
      createResponse(res, 200, records, "Inasistencias obtenidas correctamente");

    } catch (error) {
      next(error);
    }
  };

  // 🔓 Obtener inasistencias de un alumno
  getUserFromYear = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { academicYear } = req.query;

      const records = await this.service.getUserFromYearServices(userId , academicYear );
      createResponse(res, 200, records, "Inasistencias del alumno obtenidas correctamente");

    } catch (error) {
      next(error);
    }
  };

  // 🔒 Actualizar inasistencia
  update = async (req, res, next) => {
    try {
      const { attendanceId } = req.params;
      const data = req.body;

      if (data.attendanceStatus === "absent" && data.late?.isLate) {
        return createResponse(res, 400, null, "No puede llegar tarde si está ausente");
      }

      if (data.late?.isLate && (!data.late.minutes || data.late.minutes < 1)) {
        return createResponse(res, 400, null, "Debe indicar los minutos si llegó tarde");
      }

      const updated = await this.service.updateAttendance(attendanceId, data);
      createResponse(res, 200, updated, "Inasistencia actualizada correctamente");

    } catch (error) {
      next(error);
    }
  };

  // 🔒 Eliminar / corregir inasistencia
  delete = async (req, res, next) => {
    try {
      const { attendanceId } = req.params;
      await this.service.deleteAttendance(attendanceId);
      createResponse(res, 200, null, "Inasistencia eliminada correctamente");
    } catch (error) {
      next(error);
    }
  };
}
