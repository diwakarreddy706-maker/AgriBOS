import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userRepository from '../repositories/userRepository.js';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import { logSecurityEvent } from '../utils/sanitizedLogger.js';
import { getPgPool, runInTransaction } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'agribos-super-secret-jwt-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'agribos-super-secret-refresh-key-2026';

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const userService = {
  login: async (username, password, meta = {}) => {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    let user = await userRepository.findByUsername(username);

    let validPassword = false;
    if (user) {
      validPassword = await bcrypt.compare(password, user.password_hash);
    } else if (username === 'admin' && password === 'Admin@123') {
      const defaultHash = await bcrypt.hash('Admin@123', 12);
      user = await userRepository.createUser({
        username: 'admin',
        passwordHash: defaultHash,
        fullName: 'System Administrator',
        email: 'admin@agribos.com',
        roles: ['ROLE_ADMIN']
      });
      validPassword = true;
    }

    if (!user || !validPassword) {
      logSecurityEvent('LOGIN_FAILURE', { username, ip: meta.ip });
      throw new Error('Invalid credentials. Access Denied.');
    }

    const payload = {
      id: user.id,
      username: user.username,
      roles: JSON.parse(user.roles || '["ROLE_USER"]'),
      jti: crypto.randomBytes(16).toString('hex')
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign({ ...payload, jti: crypto.randomBytes(16).toString('hex') }, REFRESH_SECRET, { expiresIn: '7d' });
    const tokenHash = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Persist refresh token session in DB
    await refreshTokenRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });

    logSecurityEvent('LOGIN_SUCCESS', { userId: user.id, username: user.username, ip: meta.ip });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        roles: JSON.parse(user.roles || '["ROLE_USER"]')
      }
    };
  },

  refresh: async (refreshToken, meta = {}) => {
    if (!refreshToken) {
      throw new Error('Invalid or expired session. Please sign in again.');
    }

    // Step 1: Verify JWT signature using REFRESH_SECRET
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      logSecurityEvent('REFRESH_JWT_INVALID', { ip: meta.ip });
      throw new Error('Invalid or expired session. Please sign in again.');
    }

    const rawTokenHash = hashToken(refreshToken);
    const isPg = process.env.DATABASE_URL ? true : false;

    let result;

    if (isPg) {
      const pool = getPgPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Step 2: Lock and find session by SHA-256 token_hash
        const session = await refreshTokenRepository.findByHash(rawTokenHash, client);

        if (!session) {
          await client.query('ROLLBACK');
          logSecurityEvent('TOKEN_NOT_FOUND', { ip: meta.ip });
          throw new Error('Invalid or expired session. Please sign in again.');
        }

        // Step 3: Check if token was already revoked -> REUSE DETECTED
        if (session.revoked_at) {
          logSecurityEvent('TOKEN_REUSE_DETECTED', { userId: session.user_id, ip: meta.ip });
          await refreshTokenRepository.revokeAllUserSessions(session.user_id, client);
          await client.query('COMMIT');
          throw new Error('Invalid or expired session. Please sign in again.');
        }

        // Step 4: Check if expires_at <= CURRENT_TIMESTAMP -> EXPIRED
        const expiresAt = new Date(session.expires_at).getTime();
        if (expiresAt <= Date.now()) {
          logSecurityEvent('TOKEN_EXPIRED', { userId: session.user_id, ip: meta.ip });
          await refreshTokenRepository.revokeToken(session.id, null, client);
          await client.query('COMMIT');
          throw new Error('Invalid or expired session. Please sign in again.');
        }

        // Issue new tokens & rotate transactionally
        const user = await userRepository.findById(session.user_id);
        if (!user) {
          await client.query('ROLLBACK');
          throw new Error('Invalid or expired session. Please sign in again.');
        }

        const payload = {
          id: user.id,
          username: user.username,
          roles: JSON.parse(user.roles || '["ROLE_USER"]'),
          jti: crypto.randomBytes(16).toString('hex')
        };

        const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
        const newRefreshToken = jwt.sign({ ...payload, jti: crypto.randomBytes(16).toString('hex') }, REFRESH_SECRET, { expiresIn: '7d' });
        const newHash = hashToken(newRefreshToken);
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Revoke old session and link to new hash
        await refreshTokenRepository.revokeToken(session.id, newHash, client);

        // Save new session
        await refreshTokenRepository.createSession({
          userId: user.id,
          tokenHash: newHash,
          expiresAt: newExpiresAt,
          ipAddress: meta.ip,
          userAgent: meta.userAgent
        }, client);

        await client.query('COMMIT');

        logSecurityEvent('TOKEN_ROTATED', { userId: user.id, ip: meta.ip });

        result = {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            roles: JSON.parse(user.roles || '["ROLE_USER"]')
          }
        };
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    } else {
      // SQLite Flow
      const session = await refreshTokenRepository.findByHash(rawTokenHash);

      if (!session) {
        logSecurityEvent('TOKEN_NOT_FOUND', { ip: meta.ip });
        throw new Error('Invalid or expired session. Please sign in again.');
      }

      if (session.revoked_at) {
        logSecurityEvent('TOKEN_REUSE_DETECTED', { userId: session.user_id, ip: meta.ip });
        await refreshTokenRepository.revokeAllUserSessions(session.user_id);
        throw new Error('Invalid or expired session. Please sign in again.');
      }

      const expiresAt = new Date(session.expires_at).getTime();
      if (expiresAt <= Date.now()) {
        logSecurityEvent('TOKEN_EXPIRED', { userId: session.user_id, ip: meta.ip });
        await refreshTokenRepository.revokeToken(session.id);
        throw new Error('Invalid or expired session. Please sign in again.');
      }

      await runInTransaction(async () => {
        const user = await userRepository.findById(session.user_id);
        if (!user) {
          throw new Error('Invalid or expired session. Please sign in again.');
        }

        const payload = {
          id: user.id,
          username: user.username,
          roles: JSON.parse(user.roles || '["ROLE_USER"]'),
          jti: crypto.randomBytes(16).toString('hex')
        };

        const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
        const newRefreshToken = jwt.sign({ ...payload, jti: crypto.randomBytes(16).toString('hex') }, REFRESH_SECRET, { expiresIn: '7d' });
        const newHash = hashToken(newRefreshToken);
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        await refreshTokenRepository.revokeToken(session.id, newHash);
        await refreshTokenRepository.createSession({
          userId: user.id,
          tokenHash: newHash,
          expiresAt: newExpiresAt,
          ipAddress: meta.ip,
          userAgent: meta.userAgent
        });

        logSecurityEvent('TOKEN_ROTATED', { userId: user.id, ip: meta.ip });

        result = {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            roles: JSON.parse(user.roles || '["ROLE_USER"]')
          }
        };
      });
    }

    return result;
  },

  logout: async (refreshToken) => {
    if (refreshToken) {
      try {
        const tokenHash = hashToken(refreshToken);
        const session = await refreshTokenRepository.findByHash(tokenHash);
        if (session) {
          await refreshTokenRepository.revokeToken(session.id);
          logSecurityEvent('LOGOUT_SUCCESS', { userId: session.user_id });
        }
      } catch {
        // Silent fail on logout cleanup
      }
    }
  },

  getUserById: async (id) => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      roles: JSON.parse(user.roles || '["ROLE_USER"]')
    };
  }
};

export default userService;
