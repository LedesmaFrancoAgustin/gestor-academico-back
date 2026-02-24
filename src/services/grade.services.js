import Grade from "../daos/mongodb/model/grade.model.js"; // tu modelo de notas
import Course from "../daos/mongodb/model/course.model.js"; 
import AcademicConfig from "../daos/mongodb/model/academicYearPeriodConfig.model.js"
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

async registerIndividualNote({
  studentId,
  courseId,
  subjectId,
  academicYear,
  term,
  value,
  user,
  isRepeating = false
}) {

  const isSuperAdmin = user.role === "superAdmin";
  const teacherId = user.id;

  const isDeleting = value === null;

  // ✅ Validación solo si NO es borrado
  if (!isDeleting) {
    if (typeof value !== "number" || value < 1 || value > 10) {
      throw new Error("La nota debe estar entre 1 y 10");
    }
  }

  const academicConfig = await AcademicConfig.findOne({
    academicYear
  }).lean();

  if (!academicConfig) {
    throw new Error("No existe configuración académica para el año");
  }

  const existingGrade = await Grade.findOne({
    student: studentId,
    subject: subjectId,
    course: courseId,
    academicYear
  }).lean();

  const currentGrades = existingGrade?.grades || {};

  // 🔐 Validar instancias permitidas (solo si no es superAdmin)
  if (!isSuperAdmin) {

    const allowedInstances = evaluateAllowedInstances(currentGrades);
    const alreadyLoaded = getGradeValue(currentGrades, term) !== null;

    if (!allowedInstances.includes(term) && !alreadyLoaded) {
      throw new Error(`No está permitido modificar ${term} en este momento`);
    }
  }

  // 🔎 Determinar período
  const [periodKey, evaluationType] = term.includes(".")
    ? term.split(".")
    : [term, null];

  const periodConfig = academicConfig.periods.find(
    p => p.key === periodKey
  );

  if (!periodConfig) {
    throw new Error(`No existe configuración para ${periodKey}`);
  }

  // ⏱ Validación calendario (solo si no es superAdmin)
  if (!isSuperAdmin) {

    if (evaluationType) {
      if (!isEvaluationOpen(periodConfig, evaluationType)) {
        throw new Error(
          `La evaluación ${evaluationType} de ${periodConfig.name} no está habilitada`
        );
      }
    } else {
      if (periodConfig.isManuallyClosed) {
        throw new Error(`El período ${periodConfig.name} está cerrado`);
      }
    }
  }

  // ============================
  // 🧱 Construcción dinámica
  // ============================

  let updateOperation;

  if (isDeleting) {
    // 🔥 BORRAR NOTA
    updateOperation = {
      $set: {
        academicYear,
        isRepeating,
        updatedAt: new Date(),
        [`grades.${term}.value`]: null,
        [`grades.${term}.loadedBy`]: null,
        [`grades.${term}.loadedAt`]: null
      },
      $setOnInsert: { createdAt: new Date() }
    };
  } else {
    // ✅ GUARDAR NOTA
    updateOperation = {
      $set: {
        academicYear,
        isRepeating,
        updatedAt: new Date(),
        [`grades.${term}.value`]: value,
        [`grades.${term}.loadedBy`]: teacherId,
        [`grades.${term}.loadedAt`]: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    };
  }

  const grade = await Grade.findOneAndUpdate(
    {
      student: studentId,
      subject: subjectId,
      course: courseId,
      academicYear
    },
    updateOperation,
    {
      upsert: true,
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

async getGradesByCourse(courseId, term = null, academicYear = null) {

  if (!courseId) throw new Error("No se proporcionó courseId");

  const query = { course: courseId };

  // 👉 opcional pero recomendable
  if (academicYear) {
    query.academicYear = academicYear;
  }

  const grades = await Grade.find(query)
    .populate("student", "nombre apellido dni")
    .populate("subject", "name")
    .lean();

  const validTerms = [
    "firstTerm.partial",
    "firstTerm.final",
    "secondTerm.partial",
    "secondTerm.final",
    "recuperatoryFirstTerm",
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
      isRepeating: g.isRepeating,
      academicYear: g.academicYear
    };

    // 🔥 Si NO viene term → devolvemos estructura completa
    if (!term) {
      return {
        ...baseData,
        grades: g.grades
      };
    }

    // ❌ term inválido
    if (!validTerms.includes(term)) {
      throw new Error("Término inválido");
    }

    const gradeData = getNestedValue(g.grades, term);

    return {
      ...baseData,
      grade: gradeData
        ? {
            value: gradeData.value,
            loadedBy: gradeData.loadedBy,
            loadedAt: gradeData.loadedAt
          }
        : null
    };
  });
}
async getGradesByCourseAndSubject(courseId, subjectId, term = null, academicYear) {

  if (!courseId) throw new Error("No se proporcionó courseId");
  if (!subjectId) throw new Error("No se proporcionó subjectId");
  if (!academicYear) throw new Error("Debe especificar el año académico");

  const grades = await Grade.find({
    academicYear: Number(academicYear),
    course: courseId,
    subject: subjectId
  })
    .select("student subject grades academicYear isRepeating")
    .populate("student", "nombre apellido dni")
    .populate("subject", "name")
    .lean();

  const validTerms = [
    "firstTerm.partial",
    "firstTerm.final",
    "secondTerm.partial",
    "secondTerm.final",
    "recuperatoryFirstTerm",
    "december",
    "february"
  ];

  return grades.map(g => {

    const baseData = {
      academicYear: g.academicYear,
      studentId: g.student._id,
      studentNombre: g.student.nombre,
      studentApellido: g.student.apellido,
      studentDni: g.student.dni,
      subjectId: g.subject._id,
      subjectName: g.subject.name,
      isRepeating: g.isRepeating
    };

    // 👉 SIN term → devolvemos estructura completa real
    if (!term) {
      return {
        ...baseData,
        grades: g.grades
      };
    }

    // 👉 Validación
    if (!validTerms.includes(term)) {
      throw new Error("Término inválido");
    }

    const gradeData = getNestedValue(g.grades, term);

    return {
      ...baseData,
      grade: gradeData ?? null
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
    .select("subject grades updatedAt isRepeating")
    .populate("subject", "name")
    .lean();

  if (period === "all") {
    return grades.map(g => ({
      subject: g.subject,
      isRepeating: g.isRepeating,
      grades: g.grades,
      updatedAt: g.updatedAt
    }));
  }

  return grades.map(g => ({
    subject: g.subject,
    isRepeating: g.isRepeating,
    grade: getNestedValue(g.grades, period), // 🔥 clave
    updatedAt: g.updatedAt
  }));
}

// 🔹 Guardar varias notas (bulk)
async saveGrades(gradesArray, teacherId) {

  console.log("gradesArray: ",gradesArray)
  if (!Array.isArray(gradesArray) || gradesArray.length === 0) {
    throw new Error("No se enviaron notas para guardar");
  }

  const academicConfig = await AcademicConfig.findOne({
    academicYear: gradesArray[0].academicYear
  }).lean();

  if (!academicConfig) {
    throw new Error("No existe configuración académica para el año");
  }

  const bulkOps = [];

  for (const data of gradesArray) {

    const {
      student,
      course,
      subject,
      grades,
      academicYear,
      isRepeating = false
    } = data;

    const existingGrade = await Grade.findOne({
      student,
      subject,
      course,
      academicYear
    }).lean();

    const currentGrades = existingGrade?.grades || {};

    // 🔐 Instancias permitidas según historial
    const allowedInstances = evaluateAllowedInstances(currentGrades);

    for (const [path, gradeObj] of Object.entries(grades)) {

      const alreadyLoaded = getGradeValue(currentGrades, path) !== null;

      if (!allowedInstances.includes(path) && !alreadyLoaded) {
        throw new Error(`No está permitido cargar ${path} en este momento`);
      }

      // 🔎 Determinar período + evaluación
      const [periodKey, evaluationType] = path.includes(".")
        ? path.split(".")
        : [path, null];

      const periodConfig = academicConfig.periods.find(
        p => p.key === periodKey
      );

      if (!periodConfig) {
        throw new Error(`No existe configuración para ${periodKey}`);
      }

      // ⏱ Validar ventana
      if (evaluationType) {
        if (!isEvaluationOpen(periodConfig, evaluationType)) {
          throw new Error(
            `La evaluación ${evaluationType} de ${periodConfig.name} no está habilitada`
          );
        }
      } else {
        if (periodConfig.isManuallyClosed) {
          throw new Error(`El período ${periodConfig.name} está cerrado`);
        }
      }

      // 📏 Validar rango
      if (
        typeof gradeObj.value !== "number" ||
        gradeObj.value < 1 ||
        gradeObj.value > 10
      ) {
        throw new Error(`La nota de ${path} debe estar entre 1 y 10`);
      }
    }

    // 🧱 Construcción dinámica del $set
    const setFields = {
      academicYear,
      isRepeating,
      updatedAt: new Date()
    };

    for (const [path, gradeObj] of Object.entries(grades)) {
      setFields[`grades.${path}.value`] = gradeObj.value;
      setFields[`grades.${path}.loadedBy`] = teacherId;
      setFields[`grades.${path}.loadedAt`] = new Date();
    }

    bulkOps.push({
      updateOne: {
        filter: { student, subject, course, academicYear },
        update: {
          $set: setFields,
          $setOnInsert: { createdAt: new Date() }
        },
        upsert: true
      }
    });
  }

  await Grade.bulkWrite(bulkOps);

  return { success: true };
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


// ============================================================================================================
// 🔹 FUNCION PARA LA LOGINA DE LAS NOTAS
 //============================================================================================================
const GRADE_ORDER = [
  "firstTerm.partial",
  "firstTerm.final",
  "secondTerm.partial",
  "secondTerm.final",
  "recuperatoryFirstTerm",
  "december",
  "february"
];

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}
function getGradeValue(grades, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], grades)?.value ?? null;
}

function evaluateAllowedInstances(grades) {
  const firstFinal = getGradeValue(grades, "firstTerm.final");
  const secondFinal = getGradeValue(grades, "secondTerm.final");

  // 🎓 Promoción directa
  if (firstFinal >= 7 && secondFinal >= 7) {
    return [];
  }

  // Buscar la primera instancia pendiente según el orden
  for (const key of GRADE_ORDER) {
    const value = getGradeValue(grades, key);
    if (value == null) return [key];
  }

  return [];
}

function isEvaluationOpen(periodConfig, evaluationType) {
  if (!periodConfig || periodConfig.isManuallyClosed) return false;

  const evaluation = periodConfig.evaluations?.find(
    e => e.type === evaluationType
  );

  if (!evaluation) return false;

  const now = new Date();
  const start = new Date(evaluation.gradingWindow.startDate);
  const end = new Date(evaluation.gradingWindow.endDate);

  return now >= start && now <= end;
}

