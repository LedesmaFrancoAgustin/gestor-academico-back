import ImportMassiveService from '../services/importMassive.services.js';

export default class PdfController{
  constructor() {
    this.service = new ImportMassiveService;
  }

 createMassiveStudets = async (req, res, next) => {
    try {
        const result = await this.service.createMassiveStudetsService(req.file);
        createResponse(res, 201, result);
    } catch (error) {
        next(error);
    }
    };


}