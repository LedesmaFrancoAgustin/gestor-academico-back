import {dirname} from 'path';
import { fileURLToPath } from 'url';
import moment from "moment-timezone";

export const __dirname = dirname(fileURLToPath(import.meta.url));

export const createResponse = (res, statusCode, data) => {
        return res.status(statusCode).json({data})
}

export const normalizeDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// 🔹 Función para normalizar fechas a Argentina
export function normalizeDateToArgentina(date) {
  if (!date) return null;

  return moment
    .tz(date, "America/Argentina/Buenos_Aires")
    .toDate();
}