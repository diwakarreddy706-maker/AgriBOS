import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1. Helmet HTTP Security Headers Configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https:", "http://localhost:*"]
    }
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
});

// 2. Authentication Rate Limiters (In-memory for single-instance Render)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  }
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 refresh attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please try again later.'
  }
});

// 3. CSRF Verification Middleware
export const verifyCsrf = (req, res, next) => {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Exempt auth endpoints and public APIs
  const exemptPaths = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/health', '/api/v1/docs'];
  if (exemptPaths.some((p) => req.originalUrl.startsWith(p))) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const allowedFrontendUrl = process.env.FRONTEND_URL || '';

  const isAllowedHost = (urlStr) => {
    if (!urlStr) return false;
    try {
      const parsed = new URL(urlStr);
      if (process.env.NODE_ENV !== 'production') {
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
      }
      if (allowedFrontendUrl) {
        const parsedFrontend = new URL(allowedFrontendUrl);
        if (parsed.origin === parsedFrontend.origin) return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Rule 1: Check Origin if present
  if (origin) {
    if (isAllowedHost(origin)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'CSRF verification failed. Unauthorized Origin.'
    });
  }

  // Rule 2: Check Referer if Origin is absent
  if (referer) {
    if (isAllowedHost(referer)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'CSRF verification failed. Unauthorized Referer.'
    });
  }

  // Rule 3: Reject state-changing requests when both Origin & Referer are absent (unless explicitly non-production / header override)
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'CSRF verification failed. Missing Origin and Referer headers.'
    });
  }

  next();
};

export default { securityHeaders, loginRateLimiter, refreshRateLimiter, verifyCsrf };
