import { sendError } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Resource or endpoint not found`, 404);
};

export const errorHandler = (err, req, res, next) => {
  // Server-side logging without revealing secrets
  console.error('❌ Server Error:', err.message || err);

  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return sendError(res, 'Validation Failed', 422, formattedErrors);
  }

  const statusCode = err.statusCode || (err.message && err.message.includes('Access Denied') ? 401 : 500);

  // In production, suppress stack traces, SQL strings, database URLs, and internal file paths
  const isProd = process.env.NODE_ENV === 'production';
  let safeMessage = err.message || 'An internal server error occurred.';

  if (isProd && (statusCode === 500 || safeMessage.includes('SELECT') || safeMessage.includes('postgres') || safeMessage.includes('sqlite'))) {
    safeMessage = 'An internal server error occurred. Please contact system administrator.';
  }

  return sendError(res, safeMessage, statusCode);
};
