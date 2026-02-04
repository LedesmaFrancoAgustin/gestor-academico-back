import Grade from "../daos/mongodb/model/grade.model.js"; // tu modelo de notas
import Course from "../daos/mongodb/model/course.model.js"; 
import mongoose from "mongoose";

export default class GradeService {
  constructor() {}

  // 🔹 Crear una nota
register = async (data) => {
  const { student, course, subject, teacher, grades } = data;

  if (!student || !course || !subject || !teacher || !grades) {
    throw new Error("Faltan datos obligatorios para crear la nota");
  }

  const courseData = await Course.findById(course);
  if (!courseData) throw new Error("Curso no encontrado");

  // 1️⃣ Alumno inscrito y activo
  const isStudentEnrolled = courseData.students.some(
    (s) => s.student.toString() === student.toString() && s.active
  );
  if (!isStudentEnrolled) throw new Error("El alumno no está inscrito en este curso o no está activo");

  // 2️⃣ Teacher asignado a la materia del curso
  const subjectInCourse = courseData.subjects.find(
    (subj) => subj.subject.toString() === subject.toString()
  );
  if (!subjectInCourse) throw new Error("La materia no pertenece a este curso");
  if (subjectInCourse.teacher.toString() !== teacher.toString()) {
    throw new Error("El docente no está asignado a esta materia en el curso");
  }

  // Crear la nota
  const newGrade = new Grade({
    student,
    course,
    subject,
    teacher,
    grades,
    updatedAt: new Date()
  });

  await newGrade.save();
  return newGrade;
};

async registerIndividualNote({ studentId, courseId, subjectId, term, value, teacherId }) {

  const validTerms = [
    "firstTerm",
    "secondTerm",
    "recuperatory",
    "december",
    "february"
  ];

  if (!validTerms.includes(term)) {
    throw new Error("Tipo de nota inválido");
  }

  const grade = await Grade.findOneAndUpdate(
    { student: studentId, course: courseId, subject: subjectId },
    {
      $set: {
        [`grades.${term}`]: value,
        teacher: teacherId,
        updatedAt: new Date()
      }
    },
    {
      upsert: true,     // 👈 crea si no existe
      new: true
    }
  );

  return grade;
}
  // 🔹 Actualizar nota existente
  update = async (gradeId, data) => {
    if (!mongoose.Types.ObjectId.isValid(gradeId)) {
      throw new Error("ID de nota inválido");
    }

    const grade = await Grade.findById(gradeId);
    if (!grade) throw new Error("Nota no encontrada");

    // Actualizamos solo las propiedades que vienen en body
    if (data.grades) grade.grades = { ...grade.grades, ...data.grades };
    if (data.teacher) grade.teacher = data.teacher;

    grade.updatedAt = new Date();
    await grade.save();

    return grade;
  };
  // 🔹 Obtener nota por ID
  getById = async (gradeId) => {
    if (!mongoose.Types.ObjectId.isValid(gradeId)) {
      throw new Error("ID de nota inválido");
    }

    const grade = await Grade.findById(gradeId)
      .populate("student", "nombre dni")
      .populate("course", "name code academicYear")
      .populate("subject", "name code")
      .populate("teacher", "nombre email");

    if (!grade) throw new Error("Nota no encontrada");
    return grade;
  };

async getGradesByCourse(courseId, term = null) {
  if (!courseId) throw new Error("No se proporcionó courseId");

  const grades = await Grade.find({ course: courseId })
    .populate("student", "nombre apellido dni")
    .populate("subject", "name")
    .lean();

  const validTerms = [
    "firstTerm",
    "secondTerm",
    "recuperatory",
    "december",
    "february"
  ];

  return grades.map(g => {
    const baseData = {
      studentId: g.student._id,
      studentNombre: g.student.nombre,
      studentApellido: g.student.apellido,
      studentDni: g.student.dni,
      subjectId: g.subject._id,
      subjectName: g.subject.name,
    };

    // 👉 Si NO viene term → enviamos las 5 notas
    if (!term) {
      return {
        ...baseData,
        grades: {
          firstTerm: g.grades.firstTerm ?? null,
          secondTerm: g.grades.secondTerm ?? null,
          recuperatory: g.grades.recuperatory ?? null,
          december: g.grades.december ?? null,
          february: g.grades.february ?? null,
        }
      };
    }

    // 👉 Si viene term válido → enviamos solo esa nota
    if (!validTerms.includes(term)) {
      throw new Error("Término inválido");
    }

    return {
      ...baseData,
      value: g.grades[term] ?? null
    };
  });
}
async getGradesByCourseAndSubject(courseId, subjectId, term = null) {
  if (!courseId) throw new Error("No se proporcionó courseId");
  if (!subjectId) throw new Error("No se proporcionó subjectId");

  const grades = await Grade.find({
    course: courseId,
    subject: subjectId
  })
    .populate("student", "nombre apellido dni")
    .populate("subject", "name")
    .lean();

  const validTerms = [
    "firstTerm",
    "secondTerm",
    "recuperatory",
    "december",
    "february"
  ];

  return grades.map(g => {
    const baseData = {
      studentId: g.student._id,
      studentNombre: g.student.nombre,
      studentApellido: g.student.apellido,
      studentDni: g.student.dni,
      subjectId: g.subject._id,
      subjectName: g.subject.name
    };

    // 👉 SIN term → enviamos todas las notas
    if (!term) {
      return {
        ...baseData,
        grades: {
          firstTerm: g.grades.firstTerm ?? null,
          secondTerm: g.grades.secondTerm ?? null,
          recuperatory: g.grades.recuperatory ?? null,
          december: g.grades.december ?? null,
          february: g.grades.february ?? null
        }
      };
    }

    // 👉 CON term válido → enviamos solo esa nota
    if (!validTerms.includes(term)) {
      throw new Error("Término inválido");
    }

    return {
      ...baseData,
      value: g.grades[term] ?? null
    };
  });
}

async getGradesByCourseAndStudent(courseId, userId, period = "all") {
  if (!courseId) throw new Error("No se proporcionó courseId");
  if (!userId) throw new Error("No se proporcionó userId");

  const grades = await Grade.find({
    course: courseId,
    student: userId
  })
    .select("subject grades updatedAt")
    .populate("subject", "name")
    .lean();

  if (period === "all") return grades;

  return grades.map(g => ({
    subject: g.subject,
    grade: g.grades[period],
    updatedAt: g.updatedAt
  }));
}


// 🔹 Guardar varias notas (bulk)
async saveGrades(gradesArray) {
  if (!Array.isArray(gradesArray) || gradesArray.length === 0) {
    throw new Error("No se enviaron notas para guardar");
  }

  console.log("gradesArray: ", gradesArray)
  const bulkOps = [];

  for (const data of gradesArray) {
    const { student, course, subject, teacher, grades } = data;

    if (!student || !course || !subject || !teacher || !grades) {
      throw new Error("Faltan datos obligatorios en una de las notas");
    }

    const courseData = await Course.findById(course).lean();
    if (!courseData) throw new Error("Curso no encontrado");

    const isStudentEnrolled = courseData.students?.some(
        s => s.student?.toString() === student?.toString() && s.active
      );
    if (!isStudentEnrolled) {
        console.error("Alumno no encontrado en curso:", { student, course, courseStudents: courseData.students });
        throw new Error(`El alumno ${student} no está inscrito o activo en el curso`);
      }

    const subjectInCourse = courseData.subjects?.find(
        subj => subj.subject?.toString() === subject?.toString()
      );
      if (!subjectInCourse) {
        console.error("Materia no encontrada en curso:", { subject, course, courseSubjects: courseData.subjects });
        throw new Error(`La materia ${subject} no pertenece a este curso`);
      }
      
      const VALID_RANGE = { min: 1, max: 10 };

      for (const [term, value] of Object.entries(grades)) {
        if (value === null) continue;

        if (value < VALID_RANGE.min || value > VALID_RANGE.max) {
          throw new Error(
            `La nota de ${term} debe estar entre ${VALID_RANGE.min} y ${VALID_RANGE.max}`
          );
        }
      }

    // 3️⃣ Preparar operación bulkWrite (upsert)
    bulkOps.push({
      updateOne: {
        filter: { student, course, subject },
        update: {
          $set: {
            teacher,
            grades,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    });
  }

  // Ejecutar todas las operaciones en un solo request a la DB
  const result = await Grade.bulkWrite(bulkOps);

  return result; // devuelve info de cuántos insertados / modificados
}


  // 🔹 Listar notas según filtros
  list = async (filters = {}) => {
    const query = {};

    if (filters.student) query.student = filters.student;
    if (filters.course) query.course = filters.course;
    if (filters.subject) query.subject = filters.subject;

    const grades = await Grade.find(query)
      .populate("student", "nombre dni")
      .populate("course", "name code academicYear")
      .populate("subject", "name code")
      .populate("teacher", "nombre email");

    return grades;
  };
}
