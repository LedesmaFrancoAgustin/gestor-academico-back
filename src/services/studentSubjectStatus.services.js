import mongoose from "mongoose";
import StudentSubjectStatus from "../daos/mongodb/model/studentSubjectStatus.modal.js";
import Course from "../daos/mongodb/model/course.model.js"
import User from "../daos/mongodb/model/users.model.js"

export default class StudentSubjectStatusService {

  // ✅ Crear resultado académico
  async createStatus({ student, subject, academicYear, status }) {

    if (!student || !subject || !academicYear || !status) {
      throw new Error("Faltan datos obligatorios");
    }

    if (!["aprobada", "desaprobada"].includes(status)) {
      throw new Error("Estado inválido");
    }

    // 🔎 Verificar si ya existe registro ese año
    const existing = await StudentSubjectStatus.findOne({
      student,
      subject,
      academicYear
    });

    if (existing) {
      throw new Error("Ya existe resultado para esta materia en ese año");
    }

    // 🛑 Si intenta marcar desaprobada pero ya está aprobada en un año anterior
    if (status === "desaprobada") {
      const alreadyApproved = await StudentSubjectStatus.findOne({
        student,
        subject,
        status: "aprobada"
      });

      if (alreadyApproved) {
        throw new Error("La materia ya fue aprobada anteriormente");
      }
    }

    const newStatus = await StudentSubjectStatus.create({
      student,
      subject,
      academicYear,
      status
    });

    return newStatus;
  }
    // ✅ Obtener todos los estados de un año
  async getByYear(year) {

    const result = await StudentSubjectStatus.aggregate([
      {
        $match: {
          academicYear: Number(year)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subject"
        }
      },
      { $unwind: "$subject" },
      {
        $project: {
          _id: 1,
          academicYear: 1,
          status: 1,
          "student._id": 1,
          "student.name": 1,
          "student.lastname": 1,
          "student.dni": 1,
          "subject._id": 1,
          "subject.name": 1
        }
      }
    ]);

    return result;
  }

  async getPendingByStudentsAndSubjectIdService(limit = 15, q = "", subjectId) {

    console.log("subjectId: ",subjectId)

    const search = q.trim();

    const result = await StudentSubjectStatus.aggregate([

      // 1️⃣ Filtrar directamente por materia
      {
        $match: {
          subject: new mongoose.Types.ObjectId(subjectId)
        }
      },

      // 2️⃣ Ordenar por año descendente (para quedarnos con el último estado)
      { $sort: { academicYear: -1 } },

      // 3️⃣ Agrupar por alumno + materia (nos quedamos con el último estado)
      {
        $group: {
          _id: {
            student: "$student",
            subject: "$subject"
          },
          latestStatus: { $first: "$status" },
          latestYear: { $first: "$academicYear" }
        }
      },

      // 4️⃣ Solo los que el último estado sea desaprobada
      {
        $match: {
          latestStatus: "desaprobada"
        }
      },

      // 5️⃣ Join con users
      {
        $lookup: {
          from: "users",
          localField: "_id.student",
          foreignField: "_id",
          as: "student"
        }
      },

      { $unwind: "$student" },

      // 6️⃣ Filtro por búsqueda
      {
        $match: {
          "student.rol": "alumno",
          ...(search && {
            $or: [
              { "student.nombre": { $regex: search, $options: "i" } },
              { "student.apellido": { $regex: search, $options: "i" } },
              { "student.dni": { $regex: search, $options: "i" } }
            ]
          })
        }
      },

      // 7️⃣ Proyección final
      {
        $project: {
          _id: "$student._id",
          name: "$student.nombre",
          lastname: "$student.apellido",
          email: "$student.email",
          dni: "$student.dni",
          academicYear: "$latestYear"
        }
      },

      { $sort: { name: 1 } },

      { $limit: Number(limit) }

    ]);

    return result;
  }

  async getPendingByStudentService(limit = 15, q = "") {

    const search = q.trim();

    const result = await StudentSubjectStatus.aggregate([

      // 1️⃣ Ordenamos por año descendente
      { $sort: { academicYear: -1 } },

      // 2️⃣ Agrupamos por alumno + materia
      {
        $group: {
          _id: {
            student: "$student",
            subject: "$subject"
          },
          latestStatus: { $first: "$status" },
          latestYear: { $first: "$academicYear" }
        }
      },

      // 3️⃣ Solo materias cuyo ÚLTIMO estado es desaprobada
      {
        $match: {
          latestStatus: "desaprobada"
        }
      },

      // 4️⃣ Agrupamos por alumno
      {
        $group: {
          _id: "$_id.student",
          pendingSubjects: { $sum: 1 }
        }
      },

      // 5️⃣ Join con users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },

      { $unwind: "$student" },

      // 6️⃣ Filtro por búsqueda
      {
        $match: {
          "student.rol": "alumno",
          ...(search && {
            $or: [
              { "student.nombre": { $regex: search, $options: "i" } },
              { "student.apellido": { $regex: search, $options: "i" } },
              { "student.dni": { $regex: search, $options: "i" } }
            ]
          })
        }
      },

      {
        $project: {
          _id: 1,
          name: "$student.nombre",
          lastname: "$student.apellido",
          email: "$student.email",
          dni: "$student.dni",
          pendingSubjects: 1
        }
      },

      { $sort: { name: 1 } },

      { $limit: Number(limit) }

    ]);

    return result;
  }
  async getPendingByStudentId(studentId) {

  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const result = await StudentSubjectStatus.aggregate([

    // 1️⃣ Solo registros del alumno
    {
      $match: {
        student: studentObjectId
      }
    },

    // 2️⃣ Agrupar por materia
    {
      $group: {
        _id: "$subject",
        statuses: { $push: "$status" },
        years: { $push: "$academicYear" }
      }
    },

    // 3️⃣ Filtrar:
    // Tiene desaprobada
    // Y NO tiene aprobada
    {
      $match: {
        statuses: { $in: ["desaprobada"] },
        $expr: {
          $not: {
            $in: ["aprobada", "$statuses"]
          }
        }
      }
    },

    // 4️⃣ Lookup materia
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },

    // 5️⃣ Formato final
    {
      $project: {
        _id: 0,
        subjectId: "$subject._id",
        subjectName: "$subject.name",
        academicYear: "$subject.academicYear"
      }
    }

  ]);

  return result;
  }

  async getPendingByCourseService(courseId) {

    console.log("ccourseId: " ,courseId)
    const course = await Course.findById(courseId).lean();

    console.log("course: " ,course)

    const studentIds = course.students.map(s => s.student);

    const result = await StudentSubjectStatus.aggregate([

      {
        $match: {
          student: { $in: studentIds }
        }
      },

      {
        $group: {
          _id: {
            student: "$student",
            subject: "$subject"
          },
          statuses: { $push: "$status" }
        }
      },

      {
        $match: {
          statuses: { $in: ["desaprobada"] },
          $expr: {
            $not: { $in: ["aprobada", "$statuses"] }
          }
        }
      },

      {
        $lookup: {
          from: "subjects",
          localField: "_id.subject",
          foreignField: "_id",
          as: "subject"
        }
      },
      { $unwind: "$subject" },

      {
        $lookup: {
          from: "users",
          localField: "_id.student",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },

      {
        $project: {
          _id: 0,
          studentId: "$student._id",
          studentName: "$student.nombre",
          studentLastname: "$student.apellido",
          subjectName: "$subject.name",
          subjectYear: "$subject.academicYear"
        }
      }

    ]);

    return result;
  }


}



