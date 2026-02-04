import TeachingAssignment from "../daos/mongodb/model/TeachingAssignment.modal.js";
import Course from "../daos/mongodb/model/course.model.js";

export default class TeachingAssignmentService {
  constructor() {}

  // 🔹 Asignar docente a materia + curso
  createAssignment = async (data) => {
    return await TeachingAssignment.create(data);
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


