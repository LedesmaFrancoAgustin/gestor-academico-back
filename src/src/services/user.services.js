import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Usuario from "../daos/mongodb/model/users.model.js";

export default class UserService {

  async register({ nombre, apellido, dni, email, password, rol ,curso , division , area}) {
  // 1. Verificar si existe por email o dni
  const exists = await Usuario.findOne({
    $or: [{ email }, { dni }]
  });

  if (exists) {
  const error = new Error("El email o DNI ya está registrado");
  error.statusCode = 409; // Conflict
  error.code = "USER_ALREADY_EXISTS";
  throw error;
}


  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Crear usuario
  const user = await Usuario.create({
    nombre,
    apellido,
    dni,
    email,
    password: hashedPassword,
    rol,
    activo: true,
    area: area,
    // inasistencias NO se pasan → se inicializa vacío
    // 🔹 Curso actual (solo si es alumno, para docentes puede quedar null)
    currentCourse: rol === "alumno" ? {
      currentClass: curso || null,
      currentDivision: division || null
    } : null
  });

  // 5. Respuesta controlada (sin password)
  return {
    id: user._id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    rol: user.rol,
    activo: user.activo,
    area : user.area,
    currentCourse: user.currentCourse
  };
}

 async login({ email, password }) {
  const user = await Usuario.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Credenciales inválidas");
  }

  if (!user.activo) {
    throw new Error("Usuario deshabilitado");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Credenciales inválidas");
  }

  // Access token (corto)
  const token = jwt.sign(
    {
      id: user._id,
      rol: user.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES} // corto
  );

  // Refresh token (largo)
  const refreshToken = jwt.sign(
    {
      id: user._id,
      rol: user.rol
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    refreshToken,
    user: {
      id: user._id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol
    }
  };
}
async refreshTokenService(refreshToken) {
  if (!refreshToken) throw new Error("Refresh token requerido");

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await Usuario.findById(decoded.id);
  if (!user) throw new Error("Usuario no encontrado");

  const newToken = jwt.sign(
    { id: user._id, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  return {
    token: newToken,
    refreshToken // opcional: podés generar uno nuevo si querés
  };
}
  async getUsers({ limit, page }) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    Usuario.find()
      .select("-password")
      .limit(limit)
      .skip(skip)
      .lean(),

    Usuario.countDocuments()
  ]);

  return {
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async getSearchUsers({ limit, page, q, roles }) {
  console.log("role",roles)
  
  let filter = {};

  // 🔹 Filtro de búsqueda
  if (q) {
    if (!isNaN(q)) {
      // 🔎 Buscar por DNI
      filter.dni = q;
    } else {
      // 🔎 Buscar por nombre o apellido
      filter.$or = [
        { nombre: { $regex: q, $options: "i" } },
        { apellido: { $regex: q, $options: "i" } }
      ];
    }
  }
  // 🔹 Filtrar por rol si viene
  // 🔹 Filtrar por roles si vienen
if (roles && roles.length > 0) {
  filter.rol = {
    $in: roles.map(role => role.toLowerCase())
  };
}


  const users = await Usuario.find(filter)
    .select("-password")
    .limit(limit)
    .skip((page - 1) * limit)
    .sort({ apellido: 1 });

  const total = await Usuario.countDocuments(filter);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}


async getSearchUsersIds({ limit = 15, page = 1, q = "", roles = [], ids = [] }) {
  const filter = {};

  // 🔹 Validar IDs
  const validIds = Array.isArray(ids)
    ? ids.filter(id => mongoose.Types.ObjectId.isValid(id))
    : [];

  if (validIds.length > 0) {
    filter._id = { $in: validIds.map(id => new mongoose.Types.ObjectId(id)) };

  }

  // 🔹 Filtro por q
  if (q) {
    filter.$or = !isNaN(q)
      ? [{ dni: q }]
      : [
          { nombre: { $regex: q, $options: "i" } },
          { apellido: { $regex: q, $options: "i" } }
        ];
  }

  // 🔹 Filtrar por roles
  if (Array.isArray(roles) && roles.length > 0) {
    filter.rol = { $in: roles.map(r => r.toLowerCase()) };
  }

  // 🔹 Consultar DB
  const users = await Usuario.find(filter)
    .select("-password")
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ apellido: 1 });

  const total = await Usuario.countDocuments(filter);

  return {
    data: users,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

  // Obtener todos los cursos del usuario logueado
async getMyCourses(userId) {
  const courses = await Usuario.findById(userId)
    .populate({
      path: "courses.course",
      select: "name code academicYear active students" // Traemos solo students para contar
    })
    .select("courses")
    .lean();

  if (!courses) throw new Error("Usuario no encontrado");

  // Mapear para devolver solo lo necesario
  const result = courses.courses.map((c) => ({
    _id: c.course._id,
    name: c.course.name,
    code: c.course.code,
    academicYear: c.course.academicYear,
    active: c.course.active,
    studentsCount: c.course.students ? c.course.students.length : 0 // 🔹 cantidad de estudiantes
  }));

  return result;
}


async update(userId, updates) {
  // Hash de password si se envió
  console.log("updates:  ",updates)
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  
  // Actualizar solo los campos enviados
  const user = await Usuario.findByIdAndUpdate(userId, updates, { new: true });
  if (!user) throw new Error("Usuario no encontrado");

  return user
}

async changeMyPassword(userId, currentPassword, newPassword) {

  const user = await Usuario
    .findById(userId)
    .select("+password");

  if (!user) throw new Error("Usuario no encontrado");

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw new Error("Contraseña actual incorrecta");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return true;
}

async changeMyEmail(userId, newEmail) {
  // Validación básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw new Error("Formato de email inválido");
  }

  // Verificar si el email ya existe en otro usuario
  const existingUser = await Usuario.findOne({ email: newEmail });
  if (existingUser && existingUser._id.toString() !== userId) {
    throw new Error("El email ya está en uso");
  }

  // Actualizar email
  const user = await Usuario.findById(userId);
  if (!user) throw new Error("Usuario no encontrado");

  user.email = newEmail;
  await user.save();

  return true;
}




}
