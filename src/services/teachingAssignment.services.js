import TeachingAssignment from "../daos/mongodb/model/TeachingAssignment.modal.js";
import Course from "../daos/mongodb/model/course.model.js";
import User from "../daos/mongodb/model/users.model.js";
import Subject from "../daos/mongodb/model/subject.model.js";



export default class TeachingAssignmentService {
  constructor() {}
  
  createAssignmentService = async (data) => {
    const { teacher, subject, course, academicYear } = data;

    /* =====================
      Validar docente
    ===================== */
    const teacherExists = await User.findById(teacher);
    if (!teacherExists) {
      const err = new Error("El docente no existe");
      err.status = 404;
      throw err;
    }

    if (teacherExists.rol !== "docente") {
      const err = new Error("El usuario no es un docente");
      err.status = 400;
      throw err;
    }

    /* =====================
      Validar materia
    ===================== */
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      const err = new Error("La materia no existe");
      err.status = 404;
      throw err;
    }

    /* =====================
      Validar curso
    ===================== */
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      const err = new Error("El curso no existe");
      err.status = 404;
      throw err;
    }

    /* =====================
      Validar duplicado
    ===================== */
    const alreadyAssigned = await TeachingAssignment.findOne({
      teacher,
      subject,
      course,
      academicYear
    });

    if (alreadyAssigned) {
      const err = new Error(
        "El docente ya está asignado a esta materia en este curso y año"
      );
      err.status = 409;
      throw err;
    }

    /* =====================
      Desactivar docente activo anterior
    ===================== */
    await TeachingAssignment.updateMany(
      {
        subject,
        course,
        academicYear,
        active: true
      },
      { active: false }
    );

    /* =====================
      Crear asignación
    ===================== */
    return await TeachingAssignment.create({
      teacher,
      subject,
      course,
      academicYear,
      active: true
    });
  };

// 🔹 Obtener Teacher (id + nombre) de un curso
getTeacherAndSubjetsByCourseService = async (courseId) => {
  // (opcional) validar curso
  const course = await Course.findById(courseId).lean();
  if (!course) throw new Error("Curso no encontrado");

  const assignments = await TeachingAssignment.find({
    course: courseId,
    //active: true
  })
    .populate("teacher", "nombre apellido") // 👈 traemos nombre (y código si querés)
    .populate("subject", "name code")      // opcional: traer info de la materia
    .lean();

  // 🔹 devolvemos formato listo para el front
  return assignments.map(a => ({
    TeachingAssignmentId: a._id,
    subjectId: a.subject._id,
    subjectName: a.subject.name,
    subjectCode: a.subject.code,
    teacherId: a.teacher._id,
    teacherNombre: a.teacher.nombre,
    teacherApellido: a.teacher.apellido,
    teacherStatusSubject: a.active,
    academicYearCourse: a.academicYear
  }));
};

  // 🔹 Obtener materias (id + nombre) que dicta un docente en un curso
getSubjectIdsByTeacherAndCourse = async (teacherId, courseId) => {
  // (opcional) validar curso
  const course = await Course.findById(courseId).lean();
  if (!course) throw new Error("Curso no encontrado");

  const assignments = await TeachingAssignment.find({
    teacher: teacherId,
    course: courseId,
    active: true
  })
    .populate("subject", "name code") // 👈 traemos nombre (y código si querés)
    .lean();

  // 🔹 devolvemos formato listo para el front
  return assignments.map(a => ({
    _id: a.subject._id,
    name: a.subject.name,
    code: a.subject.code
  }));
};

  // 🔹 Obtener materias (id )
getSubjectIdsByUserId = async (userId, active = true) => {

  const isActive =
    active === undefined ? true : active === "true" || active === true;

  const assignments = await TeachingAssignment.find({
    teacher: userId,
    active: isActive
  })
    .populate("subject", "name code")
    .lean();

  return assignments.map(a => ({
    _id: a.subject._id,
    name: a.subject.name,
    code: a.subject.code
  }));
};

  // 🔹  Cursos en el que dicta docente en el año enviado
getCoursesByUserIdAndYearService = async (userId, year) => {

  console.log(userId,year)
  const assignments = await TeachingAssignment.find({
    teacher: userId,
    academicYear: year,
    active: true
  })
    .populate("course", "name code")
    .lean();

  const coursesMap = new Map();

  for (const a of assignments) {
    if (a.course) {
      coursesMap.set(a.course._id.toString(), {
        _id: a.course._id,
        name: a.course.name,
        code: a.course.code
      });
    }
  }

  return Array.from(coursesMap.values());
};



deleteAssignmentService = async (teacherId , subjectId, courseId, academicYear) => {
 console.log(teacherId , subjectId, courseId, academicYear)
  const deleted = await TeachingAssignment.findOneAndDelete({
    teacher: teacherId,
    subject: subjectId,
    course: courseId,
    academicYear
  });

  if (!deleted) {
    throw new Error("Asignación no encontrada");
  }

  return deleted;
};

patchStateService = async (teacherId , subjectId, courseId, academicYear) => {
 console.log(teacherId , subjectId, courseId, academicYear)
 // 🛡️ Normalizar año
  academicYear = Number(academicYear);

  // 1️⃣ Desactivar todos los docentes de la materia
  await TeachingAssignment.updateMany(
    {
      subject: subjectId,
      course: courseId,
      academicYear
    },
    { active: false }
  );

  // 2️⃣ Activar el docente seleccionado
  const updated = await TeachingAssignment.findOneAndUpdate(
    {
      teacher: teacherId,
      subject: subjectId,
      course: courseId,
      academicYear
    },
    { active: true },
    { new: true }
  );

  if (!updated) {
    throw new Error("Asignación no encontrada");
  }

  return updated;
};

  // 🔹 Validar si un docente dicta una materia en un curso
isTeacherAssigned = async (teacherId, subjectId, courseId) => {
    return await TeachingAssignment.exists({
      teacher: teacherId,
      subject: subjectId,
      course: courseId,
      active: true
    });
};
}


