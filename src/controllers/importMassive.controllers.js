import ImportMassiveService from '../services/importMassive.services.js';

export default class PdfController{
  constructor() {
    this.service = new ImportMassiveService;
  }

 createMassiveStudets = async (req, res, next) => {
  try {
    const result = await this.service.createMassiveStudetsService(req.file);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error en carga masiva:", error); // log en consola para debugging
    return res.status(500).json({
      message: "Error en la carga masiva",
      error: error.message || "Error desconocido"
    });
  }
};


}