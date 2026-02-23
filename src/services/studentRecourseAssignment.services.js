import mongoose from "mongoose";
import StudentRecourseAssignment from "../daos/mongodb/model/studentRecourseAssignment.model.js";
import TeachingAssignment from "../daos/mongodb/model/TeachingAssignment.modal.js";

export default class StudentRecourseAssignmentService {

 async createService({ studentId, teachingAssignmentId, academicYear }) {
  try {
    if (!studentId || !teachingAssignmentId || !academicYear) {
      throw new Error("Datos incompletos para crear recursada");
    }

    // 🔎 Verificar existencia previa en mismo año
    const existing = await StudentRecourseAssignment.findOne({
      studentId,
      teachingAssignmentId,
      academicYear
    });

    if (existing && existing.active) {
      throw new Error("El alumno ya está asignado a esta comisión este año");
    }

    if (existing && !existing.active) {
      existing.active = true;
      await existing.save();
      return existing;
    }

    const recourse = await StudentRecourseAssignment.create({
      studentId,
      teachingAssignmentId,
      academicYear,
      active: true
    });

    return recourse;

  } catch (error) {
    if (error.code === 11000) {
      throw new Error("El alumno ya está asignado a esta comisión este año");
    }
    throw error;
  }
}

  async getRecourseFromCourseService({ courseId }) {

    // 1️⃣ Buscar asignaciones docentes del curso
    const teachingAssignments = await TeachingAssignment.find({
      course: courseId,
      active: true
    }).select("_id");

    if (!teachingAssignments.length) {
      return [];
    }

    const teachingIds = teachingAssignments.map(t => t._id);

    // 2️⃣ Buscar recursantes asociados a esas asignaciones
    const recourseStudents = await StudentRecourseAssignment.find({
      teachingAssignmentId: { $in: teachingIds },
      active: true
    })
      .populate({
        path: "studentId",
        select: "nombre apellido email dni"
      })
      .populate({
        path: "teachingAssignmentId",
        populate: [
          { path: "subject", select: "name code" },
          { path: "course", select: "name" }
        ]
      });

    return recourseStudents.map((r, index) => ({
        index: index + 1,
        id: r._id,
        studentId: r.studentId?._id, 
        studentName: r.studentId?.nombre,
        studentLastName: r.studentId?.apellido,
        email: r.studentId?.email,
        dni: r.studentId?.dni,
        subject: r.teachingAssignmentId?.subject?.name,
        subjectCode: r.teachingAssignmentId?.subject?.code,
        academicYear: r.academicYear
      }));


  }

async getRecourseFromTeacherService({ teacherId, subjectId, academicYear }) {

  if (!teacherId || !subjectId || !academicYear) {
    throw new Error("teacherId, subjectId y academicYear son obligatorios");
  }

  // 1️⃣ Buscar la asignación docente específica
  const teachingAssignment = await TeachingAssignment.findOne({
    teacher: teacherId,
    subject: subjectId,
    academicYear,
    active: true
  });

  if (!teachingAssignment) {
    return [];
  }

  // 2️⃣ Buscar recursantes de esa asignación
  const recourseStudents = await StudentRecourseAssignment.find({
    teachingAssignmentId: teachingAssignment._id,
    academicYear,
    active: true
  })
    .populate({
      path: "studentId",
      select: "nombre apellido email dni"
    });

  return recourseStudents.map((r, index) => ({
    index: index + 1,
    id: r._id,
    studentId: r.studentId?._id,
    studentNombre: r.studentId?.nombre,
    studentApellido: r.studentId?.apellido ,
    email: r.studentId?.email,
    studentDni: r.studentId?.dni,
    academicYear: r.academicYear
  }));
}


  async deleteRecourseStudentsService(studentRecourseAssignmentId) {

  // ✅ Validar ID
  if (!mongoose.Types.ObjectId.isValid(studentRecourseAssignmentId)) {
    throw new Error("ID inválido");
  }

  // 🔹 Eliminar directamente
  const deleted = await StudentRecourseAssignment.findByIdAndDelete(
    studentRecourseAssignmentId
  );

  if (!deleted) {
    throw new Error("Recursante no encontrado");
  }

  return {
    message: "Recursante eliminado correctamente",
    id: deleted._id
  };
}
}
