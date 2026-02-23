import Subject from "../daos/mongodb/model/subject.model.js";

export default class SubjectService {
  // 🔹 Crear una nueva materia
  async createSubject(data) {
    const { academicYear, order } = data;

    if (!academicYear) {
      throw new Error("El año académico es obligatorio");
    }

    if (!order && order !== 0) {
      throw new Error("El campo 'order' es obligatorio");
    }

    // 🔎 Verificar que no exista ese orden en el mismo año
    const existingOrder = await Subject.findOne({
      academicYear,
      order
    });

    if (existingOrder) {
      throw new Error(
        `Ya existe una materia con el orden ${order} en el año ${academicYear}`
      );
    }

    try {
      const subject = await Subject.create(data);
      return subject;
    } catch (error) {
      // 🔥 Manejo elegante del error de índice único
      if (error.code === 11000) {
        throw new Error("El código o el orden ya están registrados");
      }
      throw error;
    }
  }

  // 🔹 Obtener lista de materias con paginación y búsqueda
  async getSubjects({ limit = 15, page = 1, q = "" }) {
    const filter = {};

    if (q) {
      // 🔎 Buscar por nombre o código
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } }
      ];
    }

    const subjects = await Subject.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ name: 1 }); // orden alfabético por nombre

    const total = await Subject.countDocuments(filter);

    return {
      subjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 🔹 Obtener materia por ID
  async getSubjectById(id) {
    const subject = await Subject.findById(id);
    if (!subject) throw new Error("Subject not found");
    return subject;
  }

  // 🔹 Actualizar materia
async updateSubject(id, data) {
  // Evitar actualizar _id accidentalmente
  if (data._id) delete data._id;

  const subject = await Subject.findById(id);
  if (!subject) throw new Error("Subject not found");

  // Si se intenta modificar academicYear o order
  const newAcademicYear = data.academicYear ?? subject.academicYear;
  const newOrder = data.order ?? subject.order;

  // 🔎 Verificar que no exista ese orden en el mismo año (excluyendo el actual)
  const existingOrder = await Subject.findOne({
    _id: { $ne: id },
    academicYear: newAcademicYear,
    order: newOrder
  });

  if (existingOrder) {
    throw new Error(
      `Ya existe una materia con el orden ${newOrder} en el año ${newAcademicYear}`
    );
  }

  try {
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );

    return updatedSubject;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("El código o el orden ya están registrados");
    }
    throw error;
  }
}

  // 🔹 Eliminar materia
  async deleteSubject(id) {
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) throw new Error("Subject not found");
    return true;
  }
}
