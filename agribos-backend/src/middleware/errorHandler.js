import { sendError } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Server Error:', err);

  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return sendError(res, 'Validation Failed', 422, formattedErrors);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, statusCode, err.errors || []);
};
