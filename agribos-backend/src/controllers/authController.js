import userService from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const meta = {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    };
    const data = await userService.login(username, password, meta);

    // Set HttpOnly cookie for refresh token security
    if (data.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);
    }

    return sendSuccess(res, data, 'Login successful');
  } catch (error) {
    return sendError(res, 'Invalid credentials. Access Denied.', 401);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const meta = {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    };

    const data = await userService.refresh(refreshToken, meta);

    if (data.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);
    }

    return sendSuccess(res, data, 'Token refreshed successfully');
  } catch (error) {
    res.clearCookie('refreshToken', { path: '/' });
    return sendError(res, 'Invalid or expired session. Please sign in again.', 401);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await userService.logout(refreshToken);
    res.clearCookie('refreshToken', { path: '/' });
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    res.clearCookie('refreshToken', { path: '/' });
    return sendSuccess(res, null, 'Logged out successfully');
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
    return sendError(res, 'User not found', 404);
  }
};

export default { login, refresh, logout, me };
