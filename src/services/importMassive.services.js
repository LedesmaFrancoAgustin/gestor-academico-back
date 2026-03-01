import xlsx from "xlsx";
import bcrypt from "bcrypt";
import { parse } from "csv-parse/sync";
import User from "../daos/mongodb/model/users.model.js";
import Course from "../daos/mongodb/model/course.model.js";


export default class ImportMassiveService {

  createMassiveStudetsService = async (file) => {
    if (!file) throw new Error("No file uploaded");

    const workbook = xlsx.read(file.buffer);
    const sheetName = workbook.SheetNames[0];

    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return { message: "Excel vacío" };
    }

    const errors = [];
    let insertedCount = 0;
    let updatedCount = 0;

    for (let index = 0; index < data.length; index++) {

      const row = data[index];
      const excelRowNumber = index + 2; // +2 porque fila 1 es header

      try {

        console.log(`Procesando fila ${excelRowNumber}, DNI: ${row.DNI}`);

        // 🔹 Validación obligatoria
        if (!row.DNI || !row.APELLIDO || !row.NOMBRES || !row.CONTRASEÑA || !row["CURSO CODE"]) {
          errors.push({
            row: excelRowNumber,
            dni: row.DNI || "sin DNI",
            error: "Faltan datos obligatorios"
          });
          continue;
        }

        const courseCode = String(row["CURSO CODE"]).toUpperCase().trim();
        const course = await Course.findOne({ code: courseCode });

        if (!course) {
          errors.push({
            row: excelRowNumber,
            dni: row.DNI,
            error: `Curso ${courseCode} no encontrado`
          });
          continue;
        }

        const hashedPassword = await bcrypt.hash(String(row.CONTRASEÑA), 10);

        // 🔹 Fecha de nacimiento
        let fechaNacimiento = null;
        if (row["FECHA DE NACIMIENTO"]) {
          const f = new Date(row["FECHA DE NACIMIENTO"]);
          fechaNacimiento = isNaN(f.getTime()) ? null : f;
        }

        // 🔹 Género
        let genero = null;
        if (row.GENERO) {
          const g = row.GENERO.toUpperCase();
          if (g === "M") genero = "masculino";
          if (g === "F") genero = "femenino";
        }

        // 🔹 Email temporal si falta
        let email = row.EMAIL;
        if (!email) email = `sinemail_${row.DNI}@fake.com`;

        // 🔹 Legajo temporal si falta
        let legajo = row.LEGAJO;
        if (!legajo) legajo = `sinlegajo_${row.DNI}`;

        let student = await User.findOne({ dni: String(row.DNI) });
        student?.courses || (student && (student.courses = []));

        // ============================================================
        // 🔹 SI NO EXISTE → CREAR
        // ============================================================
        if (!student) {

          student = await User.create({
            nombre: row.NOMBRES,
            apellido: row.APELLIDO,
            dni: String(row.DNI),
            password: hashedPassword,
            rol: "alumno",
            legajo,
            libroFolio: row["LIBRO Y FOLIO"] || null,
            fechaNacimiento,
            genero,
            email,
            courses: [{
              course: course._id,
              status: "activo",
              from: new Date()
            }]
          });

          insertedCount++;

        } else {

          // ============================================================
          // 🔹 SI EXISTE → ACTUALIZAR CURSO SI ES NECESARIO
          // ============================================================
          const activeCourse = student.courses.find(c => c.status === "activo");

          if (!activeCourse) {
            student.courses.push({
              course: course._id,
              status: "activo",
              from: new Date()
            });
          } else if (activeCourse.course.toString() !== course._id.toString()) {
            activeCourse.status = "finalizado";
            activeCourse.to = new Date();
            student.courses.push({
              course: course._id,
              status: "activo",
              from: new Date()
            });
          }

          await student.save();
          updatedCount++;
        }

        // ============================================================
        // 🔹 AGREGAR ALUMNO AL CURSO SI NO ESTÁ
        // ============================================================
        course.students || (course.students = []);
        const existsInCourse = course.students.some(
          s => s.student.toString() === student._id.toString()
        );

        if (!existsInCourse) {
          course.students.push({
            student: student._id,
            active: true
          });
          await course.save();
        }

      } catch (err) {
        console.error(`Fila ${excelRowNumber} falló:`, err);
        errors.push({
          row: excelRowNumber,
          dni: row?.DNI || "sin DNI",
          error: err.message
        });
      }
    }

    return {
      inserted: insertedCount,
      updated: updatedCount,
      errors,
      message: "Carga masiva finalizada"
    };
  }

  bulkUpdateFechaNacimientoService = async (file) => {

    if (!file) {
      throw new Error("No se envió ningún archivo");
    }

    // Convertimos buffer a string y eliminamos BOM si existe
    const csvString = file.buffer
      .toString("utf-8")
      .replace(/^\uFEFF/, "");

    // Detectar delimitador automáticamente (; o ,)
    const delimiter = csvString.includes(";") ? ";" : ",";

    // Parsear CSV
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter
    });

    if (!records.length) {
      throw new Error("El archivo está vacío o mal formateado");
    }

    const bulkOps = [];
    let ignorados = 0;

    for (const row of records) {

      const dni = row.dni?.toString().trim();
      const fechaNacimiento = row.fechaNacimiento?.toString().trim();

      // Ignorar si falta DNI o fecha
      if (!dni || !fechaNacimiento) {
        ignorados++;
        continue;
      }

      // Validar formato DD/MM/YYYY
      const [day, month, year] = fechaNacimiento.split("/");

      if (!day || !month || !year) {
        ignorados++;
        continue;
      }

      const fecha = new Date(Date.UTC(year, month - 1, day));

      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        ignorados++;
        continue;
      }

      bulkOps.push({
        updateOne: {
          filter: { dni },
          update: { $set: { fechaNacimiento: fecha } }
        }
      });
    }

    if (!bulkOps.length) {
      return {
        message: "No hay registros válidos para actualizar",
        totalRegistros: records.length,
        actualizados: 0,
        ignorados
      };
    }

    const result = await User.bulkWrite(bulkOps, { ordered: false });

    return {
      message: "Actualización masiva completada",
      totalRegistros: records.length,
      actualizados: result.modifiedCount,
      ignorados
    };
  };
}


