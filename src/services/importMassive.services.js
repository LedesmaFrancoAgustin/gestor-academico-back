import xlsx from "xlsx";
import bcrypt from "bcrypt";
import User from "../daos/mongodb/model/users.model.js";

export default class ImportMassiveService {

  createMassiveStudetsService = async (file) => {

    if (!file) throw new Error("No file uploaded");

    const workbook = xlsx.read(file.buffer);
    const sheetName = workbook.SheetNames[0];

    const data = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName]
    );

    if (data.length === 0) {
      return { message: "Excel vacío" };
    }

    const bulkOperations = [];
    const errors = [];

    for (const row of data) {

      // ✅ Validación por fila
      if (!row.DNI || !row.APELLIDO || !row.NOMBRES || !row.CONTRASEÑA) {
        errors.push({
          dni: row.DNI || "sin DNI",
          error: "Faltan datos obligatorios"
        });
        continue; // no frena todo el proceso
      }

      const hashedPassword = await bcrypt.hash(
        String(row.CONTRASEÑA),
        10
      );

      const fechaNacimiento = row["FECHA DE NACIMIENTO"]
        ? new Date(row["FECHA DE NACIMIENTO"])
        : null;

      let genero = null;
      if (row.GENERP) {
        const g = row.GENERP.toUpperCase();
        if (g === "M") genero = "masculino";
        if (g === "F") genero = "femenino";
      }

      const email = `${row.DNI}@alumno.com`;

      bulkOperations.push({
        updateOne: {
          filter: { dni: String(row.DNI) },
          update: {
            $setOnInsert: {
              nombre: row.NOMBRES,
              apellido: row.APELLIDO,
              dni: String(row.DNI),
              email,
              password: hashedPassword,
              rol: "alumno",
              legajo: row.LEGAJO || null,
              libroFolio: row["LIBRO Y FOLIO"] || null,
              fechaNacimiento,
              genero
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOperations.length === 0) {
      return { message: "No hay registros válidos para insertar", errors };
    }

    const result = await User.bulkWrite(bulkOperations);

    return {
      inserted: result.upsertedCount,
      errors,
      message: "Carga masiva finalizada"
    };
  };
}


/*
{
  "_id": {
    "$oid": "6965b21503a43193d40d4f3f"
  },
  "nombre": "Agustín",
  "apellido": "Ledesma",
  "email": "ledesmafranco50@gmail.com",
  "password": "$2b$10$ZJ1Q6dRWZ6/n7As8EXxuye1kHSotxM59vBHP156uECs22xeSARatq",
  "rol": "superAdmin",
  "activo": true,
  "createdAt": {
    "$date": "2026-01-13T02:46:45.188Z"
  },
  "updatedAt": {
    "$date": "2026-01-31T00:10:59.319Z"
  },
  "__v": 1,
  "curso": null,
  "division": null,
  "dni": "41099153",
  "courses": [],
  "inasistencias": []
}
*/