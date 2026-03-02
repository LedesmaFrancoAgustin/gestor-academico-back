import mongoose from "mongoose";
import User from "../daos/mongodb/model/users.model.js";
import Course from "../daos/mongodb/model/course.model.js";
import Subject from "../daos/mongodb/model/subject.model.js";
import TeachingAssignment  from "../daos/mongodb/model/TeachingAssignment.modal.js";

export default class DashboardService {
  // 🔹 Obtener todas las estadísticas del dashboard
  async getStats() {
    // 🔹 Contamos en paralelo usando Promise.all
    const [users ,students, teachers, courses, subjects] = await Promise.all([
      User.countDocuments({activo: true }),
      User.countDocuments({ rol: "alumno", activo: true }),
      User.countDocuments({ rol: "docente", activo: true }),
      Course.countDocuments({ active: true }),
      Subject.countDocuments({ active: true })
    ]);

    return { users , students, teachers, courses, subjects };
  }


  async  getStatsTeacherService(teacherId) {

  const [
    totalAssignments,
    courses,
    subjects,
    academicYears
  ] = await Promise.all([

    TeachingAssignment.countDocuments({
      teacher: teacherId,
      active: true
    }),

    TeachingAssignment.distinct("course", {
      teacher: teacherId,
      active: true
    }),

    TeachingAssignment.distinct("subject", {
      teacher: teacherId,
      active: true
    }),

    TeachingAssignment.distinct("academicYear", {
      teacher: teacherId,
      active: true
    })
  ]);

  // 🔹 Traemos los cursos con sus alumnos
  const coursesData = await Course.find({
    _id: { $in: courses }
  });

  // 🔹 Contamos alumnos activos
  const totalStudents = coursesData.reduce((acc, course) => {
    const activeStudents = course.students.filter(s => s.active).length;
    return acc + activeStudents;
  }, 0);

  return {
    totalAssignments,
    totalCourses: courses.length,
    totalSubjects: subjects.length,
    totalStudents,
    academicYears
  };
}

   async  getStatsPreceptorDashboardService(idPreceptor) {

    if (!idPreceptor || !/^[0-9a-fA-F]{24}$/.test(idPreceptor)) {
      throw new Error("Se requiere un ID válido del preceptor");
    }

    const preceptorObjectId = new mongoose.Types.ObjectId(idPreceptor); // 🔹 con 'new'

    // Contar cursos activos
    const coursesResult = await Course.aggregate([
      {
        $match: {
          active: true,
          users: { $elemMatch: { user: preceptorObjectId} }
        }
      },
      { $count: "totalCourses" }
    ]);

    // Contar alumnos activos
    const studentsResult = await Course.aggregate([
      {
        $match: {
          active: true,
          users: { $elemMatch: { user: preceptorObjectId} }
        }
      },
      { $project: { students: 1 } },
      { $unwind: "$students" },
      { $match: { "students.active": true } },
      { $count: "totalStudents" }
    ]);

    return {
      courses: coursesResult[0]?.totalCourses || 0,
      students: studentsResult[0]?.totalStudents || 0
    };
  }

}