import userService from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const data = await userService.login(username, password);
    return sendSuccess(res, data, 'Login successful');
  } catch (error) {
    return sendError(res, error.message, 401);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const data = await userService.refresh(refreshToken);
    return sendSuccess(res, data, 'Token refreshed successfully');
  } catch (error) {
    return sendError(res, error.message, 401);
  }
};

export const me = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthorized access', 401);
    }
    const data = await userService.getUserById(userId);
    return sendSuccess(res, data, 'User details retrieved');
  } catch (error) {
    return sendError(res, error.message, 404);
  }
};

export default { login, refresh, me };
