
//import mongoose from "mongoose";
import Course from "../daos/mongodb/model/course.model.js";
import User from "../daos/mongodb/model/users.model.js"


export default class CursoService {
  // 🔹 Crear curso
  async createCurso(data) {
    const { name, code, academicYear, active } = data;

    console.log(data);
    // Validaciones básicas
   if (!name || !code || !academicYear || active === undefined) {
  throw new Error("Todos los campos (nombre, codigo, año académico, activo) son obligatorios");
}


    // Verificar duplicado por código
    const existing = await Course.findOne({ code });
    if (existing) {
      throw new Error("Ya existe un curso con ese código");
    }

    // Crear curso
    const course = new Course({ name, code, academicYear, active });
    await course.save();
    console.log(course)
    return course;
  }

  // 🔹 Listar cursos con paginación
 async getCursos({ limit = 10, page = 1, q = "" }) {
  const skip = (page - 1) * limit;

  let filter = {};
  if (q) {
    // Busca por nombre o código insensible a mayúsculas
    filter = {
      $or: [
        { nombre: { $regex: q, $options: "i" } },
        { codigo: { $regex: q, $options: "i" } }
      ]
    };
  }

  const courses = await Course.find(filter)
    .sort({ nombre: 1 })
    .limit(Number(limit))
    .skip(Number(skip));

  const total = await Course.countDocuments(filter);

  return {
    courses,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

// 🔹 Listar cursos activos
async getCursoActive({ page = 1, limit = 50, q = "" }) {
  const skip = (page - 1) * limit;

  // Filtro inicial: solo cursos activos
  let filter = { active: true };

  // Si hay búsqueda, agregar condición $or
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { code: { $regex: q, $options: "i" } }
    ];
  }

  const courses = await Course.find(filter)
    .sort({ name: 1 })
    .limit(Number(limit))
    .skip(Number(skip));

  const total = await Course.countDocuments(filter);

  return {
    data: courses,          // renombrado a "data" para frontend
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

  // 🔹 Obtener curso completo por ID con info de materias y estudiantes
async getCursoById(id) {
  if (!id) throw new Error("Se requiere el ID del curso");

  const course = await Course.findById(id)
    .populate({
      path: "students.student",
      select: "nombre apellido dni email rol activo",
    })
    .populate({
      path: "subjects.subject",
      select: "name code academicYear order type active",
    })
    .populate({
      path: "subjects.teacher",
      select: "nombre apellido dni email rol activo",
    })
    .lean();

  if (!course) throw new Error("Curso no encontrado");

  // 🔹 Ordenar las materias por order para el boletín
  if (course.subjects && course.subjects.length > 0) {
    course.subjects.sort((a, b) => a.subject.order - b.subject.order);
  }

  // 🔹 Opcional: ordenar estudiantes alfabéticamente
  if (course.students && course.students.length > 0) {
    course.students.sort((a, b) => {
      const nameA = a.student.apellido.toLowerCase();
      const nameB = b.student.apellido.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  return course;
}

  // 🔹 Actualizar curso
  async updateCurso(id, data) {
   // Evitar accidentalmente actualizar _id
    if (data._id) delete data._id;
    const course = await Course.findByIdAndUpdate(id, data, { new: true});
    if (!course) throw new Error("Curso no encontrado");
    return course;
  }

  // 🔹 Eliminar curso
  async deleteCurso(id) {
    const course = await Course.findByIdAndDelete(id);
    if (!course) throw new Error("Curso no encontrado");
    return true;
  }

   async addUserToCourse(courseId, payload) {
  const { userId, role } = payload;

  if (!userId || !role) {
    throw new Error("userId y role son obligatorios");
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new Error("Usuario no encontrado");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error("Curso no encontrado");
  }

  const alreadyAssigned = course.users.some(
    (u) => u.user.toString() === userId
  );

  if (alreadyAssigned) {
    throw new Error("El usuario ya está asignado a este curso");
  }

  // ✅ UPDATE ATÓMICO
  await Course.updateOne(
    { _id: courseId },
    {
      $push: {
        users: { user: userId, role }
      }
    }
  );

  await User.updateOne(
    { _id: userId },
    {
      $push: {
        courses: {
          course: courseId,
          status: "activo",
          from: new Date()
        }
      }
    }
  );

  return {
    courseId,
    userId,
    role
  };
}
  async addStudentToCourse(courseId, studentId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error("Curso no encontrado");
    }

    // Verificar si el estudiante ya está en el curso
    const alreadyAdded = course.students.some(
      s => s.student.toString() === studentId
    );

    if (alreadyAdded) {
      throw new Error("El estudiante ya está agregado a este curso");
    }

    // Agregar estudiante
    await Course.updateOne(
    { _id: courseId },
    {
      $push: {
        students: { student: studentId, active: true }
      }
    }
    
  );

  await User.updateOne(
      { _id: studentId },
      {
        $push: {
          courses: {
            course: courseId,
            status: "activo",
            from: new Date()
          }
        }
      }
    );


    return {
      courseId: course._id,
      studentId
    };
  }

  async addSubjectToCourse(courseId, { subjectId, teacherId = null }) {
    // ⚠️ Verificar que exista el curso
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Curso no encontrado");

    // ⚠️ Evitar duplicados
    const alreadyAssigned = course.subjects.some(
      (s) => s.subject && s.subject.toString() === subjectId
    );
    if (alreadyAssigned) throw new Error("La materia ya está asignada al curso");

    // ✅ Update atómico
    await Course.updateOne(
      { _id: courseId },
      {
        $push: {
          subjects: { subject: subjectId, teacher: teacherId }
        }
      }
    );

    return {
      courseId: course._id,
      subjectId,
      teacherId
    };
  }
  async getCourseUsers(courseId) {
    const course = await Course.findById(courseId)
      .select("users")
      .populate("users.user", "nombre apellido email dni rol activo courses");

    if (!course) {
      throw new Error("Curso no encontrado");
    }

    const usersWithStatus = course.users.map(u => {
      // ⚠️ verificar que u.user exista
      if (!u.user) {
        return {
          ...u.toObject(),
          status: "Usuario no encontrado"
        };
      }

      const user = u.user.toObject();

      // ⚠️ asegurar que user.courses exista
      const userCourse = Array.isArray(user.courses)
        ? user.courses.find(c => c.course.toString() === courseId.toString())
        : null;

      return {
        ...u.toObject(),
        status: userCourse?.status || "No asignado"
      };
    });

    return usersWithStatus;
  }

  async getCourseStudents(courseId) {
    const course = await Course.findById(courseId)
      .select("students")
      .populate("students.student", "nombre apellido email dni rol activo courses");

    if (!course) {
      throw new Error("Curso no encontrado");
    }

    // Agregar status de este curso a cada estudiante
    const studentsWithStatus = course.students.map(s => {
      // ⚠️ Verificar que s.student exista
      if (!s.student) {
        return {
          ...s.toObject(),
          status: "Alumno no encontrado"
        };
      }

      const student = s.student.toObject();

      const studentCourse = Array.isArray(student.courses)
        ? student.courses.find(c => c.course.toString() === courseId.toString())
        : null;

      return {
        ...s.toObject(),
        status: studentCourse?.status || "No asignado"
      };
    });

    return studentsWithStatus;
  }

  async getCourseSubjects(courseId) {
    const course = await Course.findById(courseId)
      .select("subjects")
      .populate("subjects.subject", "name code type active") // materias
      .populate("subjects.teacher", "nombre apellido email rol"); // docente

    if (!course) {
      throw new Error("Curso no encontrado");
    }

    // Mapear para evitar nulls y agregar status opcional
    const subjectsWithInfo = course.subjects.map(s => {
      // Si subject es null, ponemos un placeholder
      const subject = s.subject ? s.subject.toObject() : null;

      // Si teacher es null, ponemos null también
      const teacher = s.teacher ? s.teacher.toObject() : null;

      return {
        ...s.toObject(), // mantiene _id y otras propiedades
        subject,
        teacher
      };
    });

    return subjectsWithInfo;
  }

    // Traer todos los cursos de un año académico específico
  async getCourseYearService(year) {
  try {
    if (!year) throw new Error("Debe indicar un año académico");

    const courses = await Course.find({ academicYear: year })
      .sort({ name: 1 })
      .populate("subjects.subject");

    // 🔥 Ordenar materias por order después del populate
    courses.forEach(course => {
      course.subjects.sort((a, b) => {
        return (a.subject?.order || 0) - (b.subject?.order || 0);
      });
    });

    return courses;

  } catch (error) {
    console.error("Error al obtener cursos por año:", error.message);
    throw error;
  }
}


 // Traer todos los cursos de un año académico específico
// Solo: _id, name, code
async getListCourseYearService(year) {
  try {

    console.log(year)
    if (!year) {
      throw new Error("Debe indicar un año académico");
    }

    const courses = await Course.find(
      { academicYear: year },
      { _id: 1, name: 1, code: 1 } // 🔥 solo estos campos
    )
    .sort({ name: 1 })
    .lean(); // 🔥 mejora performance

    return courses;

  } catch (error) {
    console.error("Error al obtener cursos por año:", error.message);
    throw error;
  }
}



//❌ Quitar usuario del curso
async updateStudentStatus(courseId, userId , status) {
   const course = await Course.findById(courseId);
  if (!course) throw new Error("Curso no encontrado");

  const student = await User.findById(userId);
  if (!student) throw new Error("Alumno no encontrado");

   // Actualizar el estado del curso dentro del arreglo courses del usuario
  await User.updateOne(
    { _id: users, "courses.course": courseId }, // filtramos el course específico
    { $set: { "courses.$.status": status } }       // actualizamos el campo status
  );
  return { courseId, userId, status };
}
//❌ Quitar alumno del curso
async updateStudentStatus(courseId, studentId, status = "abandonado") {

    const course = await Course.findById(courseId);
  if (!course) throw new Error("Curso no encontrado");

  const student = await User.findById(studentId);
  if (!student) throw new Error("Alumno no encontrado");

   // Actualizar el estado del curso dentro del arreglo courses del usuario
  await User.updateOne(
    { _id: studentId, "courses.course": courseId }, // filtramos el course específico
    { $set: { "courses.$.status": status } }       // actualizamos el campo status
  );
  return { courseId, studentId, status };

  }
//❌ Quitar materia del curso
async removeSubjectFromCourse(courseId, subjectId) {
  const course = await Course.findByIdAndUpdate(
    courseId,
    { $pull: { subjects: { subject: subjectId } } },
    { new: true }
  );

  if (!course) throw new Error("Curso no encontrado");
  return course;
}

//❌ Eliminar alumno del curso sin dejar registro
async rollbackStudentFromCourse(courseId, studentId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Curso no encontrado");

  const student = await User.findById(studentId);
  if (!student) throw new Error("Alumno no encontrado");

  // Quitar del curso
  await Course.updateOne(
    { _id: courseId },
    { $pull: { students: { student: studentId } } }
  );

  // Quitar del usuario
  await User.updateOne(
    { _id: studentId },
    { $pull: { courses: { course: courseId } } }
  );

  return { courseId, studentId, rollback: true };
}

async rollbackUserFromCourse(courseId, userId) {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Curso no encontrado");

  const student = await User.findById(userId);
  if (!student) throw new Error("Alumno no encontrado");

  // Quitar del curso
  await Course.updateOne(
    { _id: courseId },
    { $pull: { users: { user: userId } } }
  );

  // Quitar del usuario
  await User.updateOne(
    { _id: userId },
    { $pull: { courses: { course: courseId } } }
  );

  return { courseId, userId, rollback: true };
}


}
