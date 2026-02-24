import AcademicYearPeriodConfig from '../daos/mongodb/model/academicYearPeriodConfig.model.js';
import { normalizeDateToArgentina } from "../utils.js";

export default class AcademicYearPeriodConfigService {

// 🔹 Crear un AcademicYearPeriodConfig
async createAcademicYearPeriodConfigService(data) {
  const { academicYear, periods, createdBy } = data;

  if (!academicYear || !periods || !createdBy) {
    throw new Error(
      "Faltan datos obligatorios: academicYear, periods, createdBy"
    );
  }

  // 1️⃣ Verificar si ya existe
  const existing = await AcademicYearPeriodConfig.findOne({ academicYear });
  if (existing) {
    throw new Error(
      `El año académico ${academicYear} ya tiene configuración`
    );
  }

  if (!Array.isArray(periods) || periods.length === 0) {
    throw new Error("Debe enviar al menos un período");
  }

  const normalizedPeriods = periods.map(period => {

    if (!period.key || !period.name) {
      throw new Error("Cada período debe tener key y name");
    }

    if (!Array.isArray(period.evaluations)) {
      throw new Error(
        `El período ${period.key} debe contener evaluaciones`
      );
    }

    const evaluationTypes = period.evaluations.map(e => e.type);
    const uniqueTypes = new Set(evaluationTypes);

    if (uniqueTypes.size !== evaluationTypes.length) {
      throw new Error(
        `El período ${period.key} tiene evaluaciones duplicadas`
      );
    }

    const normalizedEvaluations = period.evaluations.map(evaluation => {

      if (
        !evaluation.type ||
        !evaluation.gradingWindow?.startDate ||
        !evaluation.gradingWindow?.endDate ||
        !evaluation.publicationDate
      ) {
        throw new Error(
          `Evaluación inválida en período ${period.key}`
        );
      }

      const startDate = normalizeDateToArgentina(
        evaluation.gradingWindow.startDate
      );

      const endDate = normalizeDateToArgentina(
        evaluation.gradingWindow.endDate
      );

      const publicationDate = normalizeDateToArgentina(
        evaluation.publicationDate
      );

      // 🔥 Validación importante
      if (endDate < startDate) {
        throw new Error(
          `La fecha fin no puede ser menor que inicio en ${period.key}`
        );
      }

      return {
        type: evaluation.type,
        gradingWindow: {
          startDate,
          endDate
        },
        publicationDate
      };
    });

    return {
      key: period.key,
      name: period.name,
      evaluations: normalizedEvaluations,
      isManuallyClosed: false,
      closedAt: null,
      closedBy: null
    };
  });

  const newConfig = new AcademicYearPeriodConfig({
    academicYear,
    periods: normalizedPeriods,
    createdBy
  });

  return await newConfig.save();
}



// 🔹 Actualizar un solo periodo de un AcademicYearPeriodConfig
async updateAcademicYearPeriodConfigService(configId, data, updatedBy) {

  if (!configId) {
    throw new Error("Debe indicar el ID de la configuración a actualizar");
  }

  const { periodKey, evaluationType, evaluationData } = data;

  if (!periodKey || !evaluationType || !evaluationData) {
    throw new Error(
      "Faltan datos: periodKey, evaluationType y evaluationData son obligatorios"
    );
  }

  const config = await AcademicYearPeriodConfig.findById(configId);
  if (!config) {
    throw new Error(`No existe configuración para el ID: ${configId}`);
  }

  // 🔹 Buscar período
  const period = config.periods.find(p => p.key === periodKey);
  if (!period) {
    throw new Error(`No se encontró el periodo con key: ${periodKey}`);
  }

  // 🔹 Buscar evaluación dentro del período
  const evaluation = period.evaluations.find(e => e.type === evaluationType);
  if (!evaluation) {
    throw new Error(
      `No se encontró evaluación tipo ${evaluationType} en ${periodKey}`
    );
  }

  // 🔹 Normalizar fechas
  const startDate = normalizeDateToArgentina(
    evaluationData.gradingWindow?.startDate
  );

  const endDate = normalizeDateToArgentina(
    evaluationData.gradingWindow?.endDate
  );

  const publicationDate = normalizeDateToArgentina(
    evaluationData.publicationDate
  );

  if (!startDate || !endDate || !publicationDate) {
    throw new Error("Las fechas son obligatorias");
  }

  if (endDate < startDate) {
    throw new Error("La fecha fin no puede ser menor que inicio");
  }

  // 🔹 Actualizar evaluación
  evaluation.gradingWindow.startDate = startDate;
  evaluation.gradingWindow.endDate = endDate;
  evaluation.publicationDate = publicationDate;

  config.updatedBy = updatedBy;
  config.updatedAt = new Date();

  return await config.save();
}

// 🔹 Obtener configuración (sin cambios)
async getAcademicYearPeriodConfigService(academicYear) {
  if (!academicYear) throw new Error("Falta el año académico");

  const existing = await AcademicYearPeriodConfig.findOne({ academicYear });
  if (!existing) {
      throw new Error(`No existe configuración para el año ${academicYear}`);
  }

  return existing;
}


}
