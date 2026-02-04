import {dirname} from 'path';
import { fileURLToPath } from 'url';
export const __dirname = dirname(fileURLToPath(import.meta.url));

export const createResponse = (res, statusCode, data) => {
        return res.status(statusCode).json({data})
}