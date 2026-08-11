# AgriBOS — Production Security Architecture & Hardening Guide V2

## Overview
AgriBOS implements an enterprise-grade defense-in-depth security model protecting the web application, REST APIs, and database across local development and Render/Neon PostgreSQL production environments.

---

## 1. Authentication & Token Architecture

- **Access Token**: Short-lived JSON Web Token (JWT) signed with `JWT_SECRET`, valid for 8 hours. Sent via `Authorization: Bearer <token>` header.
- **Refresh Token**: Long-lived JWT signed with `REFRESH_SECRET`, valid for 7 days. Delivered securely via `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Never exposed in client `localStorage` or JavaScript scope.
- **SHA-256 Token Hashing**: Raw refresh tokens are never stored in the database. Only SHA-256 hashes (`token_hash`) are stored in `user_refresh_tokens`.

---

## 2. Refresh Token Rotation & Reuse Protection

1. **Transactional Rotation**: Every successful call to `/api/v1/auth/refresh` locks the existing session row, marks `revoked_at = CURRENT_TIMESTAMP`, issues a new refresh token, and inserts the new session `token_hash`.
2. **Reuse Detection & Mass Revocation**: If an already-revoked refresh token hash is presented, reuse is detected. The system immediately revokes **ALL** active sessions for that `user_id` inside a database transaction and returns generic HTTP 401.
3. **Generic Error Responses**: To prevent token enumeration and timing attacks, client responses for missing, expired, revoked, or reused tokens return an identical generic message:
   ```json
   {
     "success": false,
     "message": "Invalid or expired session. Please sign in again."
   }
   ```

---

## 3. CSRF & Header Security

- **Cookie Security**: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production (`NODE_ENV === 'production'`).
- **CSRF Verification**: State-changing API endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) inspect `Origin` and `Referer` headers against `FRONTEND_URL`. Missing or unauthorized headers return HTTP 403.
- **Helmet Headers**: Includes HSTS over HTTPS, Frameguard (`X-Frame-Options: DENY`), `X-Content-Type-Options: nosniff`, Referrer-Policy, and Content-Security-Policy (CSP).

---

## 4. Rate Limiting & DoS Protection

- **/auth/login**: Max 10 requests / 15 minutes per IP.
- **/auth/refresh**: Max 30 requests / 15 minutes per IP.
- **Payload Limit**: Express JSON body parser enforces a strict 1MB maximum payload limit.

> [!NOTE]
> For multi-instance distributed deployments, replace the single-instance in-memory rate limiters with a shared Redis store (`rate-limit-redis`).

---

## 5. Password Security & Payload Sanitization

- **Password Hashing**: Bcrypt with cost factor 12. Plaintext passwords are never stored or logged.
- **Payload Sanitization**: All API payloads strip `password`, `password_hash`, `refresh_token`, `token_hash`, `JWT_SECRET`, and `DATABASE_URL` before returning JSON responses to clients or administrators.

---

## 6. Production Deployment Checklist (Render & Neon)

Ensure the following environment variables are set in the Render environment dashboard:

| Variable | Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon PostgreSQL Connection String |
| `JWT_SECRET` | 64+ Character Random Secret Key |
| `REFRESH_SECRET` | 64+ Character Random Secret Key (Distinct from `JWT_SECRET`) |
| `FRONTEND_URL` | `https://agribos-frontend.onrender.com` |
