import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import User from "../daos/mongodb/model/users.model.js";
import Grade from "../daos/mongodb/model/grade.model.js";

export default class PdfService {

  generateStudentPdfBoletin = async (studentId, courseId) => {

    // 1️⃣ Buscar alumno
    const student = await User.findById(studentId);
    if (!student) throw new Error("Alumno no encontrado");

    // 2️⃣ Buscar notas del alumno en el curso
    const grades = await Grade.find({
      student: studentId,
      course: courseId
    }).populate("subject", "name");

    // 3️⃣ Cargar PDF base
    const pdfPath = path.resolve("src/pdf/Boletin-Secundaria-Estatal.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // 4️⃣ Datos fijos del alumno
    form.getTextField("nameStudent")
      .setText(`${student.nombre} ${student.apellido}`);

    form.getTextField("dni")
      .setText(this.safeText(student.dni));

    // 5️⃣ Materias (solo las que tengan alguna nota)
    grades
      .filter(g => this.hasAnyGrade(g.grades))
      .forEach((g, index) => {

        const i = index + 1;

        form.getTextField(`Subject-${i}`)
          .setText(this.safeText(g.subject.name));

        form.getTextField(`firstTerm-${i}`)
          .setText(this.safeText(g.grades.firstTerm));

        form.getTextField(`secondTerm-${i}`)
          .setText(this.safeText(g.grades.secondTerm));

        form.getTextField(`recuperatory-${i}`)
          .setText(this.safeText(g.grades.recuperatory));

        form.getTextField(`december-${i}`)
          .setText(this.safeText(g.grades.december));

        form.getTextField(`february-${i}`)
          .setText(this.safeText(g.grades.february));
      });

    // 6️⃣ Bloquear edición del PDF
    form.flatten();

    // 7️⃣ Retornar buffer + datos para el nombre del archivo
    return {
      pdfBuffer: await pdfDoc.save(),
      student: {
        name: student.nombre,
        lastName: student.apellido
      }
    };
  };

   // 🔹 Helper: evita que aparezca "null" en el PDF
  safeText = (value) => {
    return value === null || value === undefined ? "" : String(value);
  };

  // 🔹 Helper: determina si la materia tiene al menos una nota
  hasAnyGrade = (grades) => {
    return Object.values(grades).some(v => v !== null);
  };
}
