import Subject from "../daos/mongodb/model/subject.model.js";

export default class SubjectService {
  // 🔹 Crear una nueva materia
  async createSubject(data) {
    const subject = await Subject.create(data);
    return subject;
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
     // Evitar accidentalmente actualizar _id
    if (data._id) delete data._id;
    const subject = await Subject.findByIdAndUpdate(id, data, { new: true });
    if (!subject) throw new Error("Subject not found");
    return subject;
  }

  // 🔹 Eliminar materia
  async deleteSubject(id) {
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) throw new Error("Subject not found");
    return true;
  }
}
