export const sendSuccess = (res, data = null, message = 'Success', pagination = null, statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: pagination || undefined,
    meta: Object.keys(meta).length ? meta : undefined
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};
