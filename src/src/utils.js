import {dirname} from 'path';
import { fileURLToPath } from 'url';
export const __dirname = dirname(fileURLToPath(import.meta.url));

export const createResponse = (res, statusCode, data) => {
        return res.status(statusCode).json({data})
}

export const normalizeDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};
