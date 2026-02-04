import pdfService from '../services/pdf.services.js';

export default class PdfController{
  constructor() {
    this.service = new pdfService;
  }

  generateStudentPdfBoletin = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {courseId} = req.params;

    const { pdfBuffer, student } = await this.service.generateStudentPdfBoletin(studentId,courseId);
    const fileName = `boletin-${student.lastName}_${student.name}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al generar PDF" });
  }
};


}