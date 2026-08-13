/**
 * Sanitized Security Logger for AgriBOS
 * Redacts passwords, hashes, JWT secrets, database URLs, and authorization tokens.
 */

const REDACTED_KEYS = ['password', 'password_hash', 'passwordHash', 'token', 'refreshToken', 'accessToken', 'secret', 'authorization', 'cookie', 'DATABASE_URL', 'JWT_SECRET', 'REFRESH_SECRET'];

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSecretKey = REDACTED_KEYS.some((rk) => key.toLowerCase().includes(rk.toLowerCase()));
    if (isSecretKey) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

export const logSecurityEvent = (eventType, details = {}) => {
  const sanitizedDetails = sanitizeObject(details);
  const logPayload = {
    timestamp: new Date().toISOString(),
    event: eventType,
    environment: process.env.NODE_ENV || 'development',
    details: sanitizedDetails
  };

  console.log(`[SECURITY EVENT] ${eventType}:`, JSON.stringify(logPayload));
};

export default { sanitizeObject, logSecurityEvent };
