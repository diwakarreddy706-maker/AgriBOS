import { sendError } from '../utils/response.js';

export const validate = (schema) => async (req, res, next) => {
  try {
    if (schema.body) req.body = await schema.body.parseAsync(req.body);
    if (schema.query) req.query = await schema.query.parseAsync(req.query);
    if (schema.params) req.params = await schema.params.parseAsync(req.params);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const formatted = error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return sendError(res, 'Request Validation Error', 400, formatted);
    }
    next(error);
  }
};
