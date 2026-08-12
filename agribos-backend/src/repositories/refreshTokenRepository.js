import { query, run, get, checkIsPostgres } from '../db/database.js';

export const refreshTokenRepository = {
  /**
   * Create a new refresh token session in DB.
   */
  createSession: async ({ userId, tokenHash, expiresAt, ipAddress, userAgent }, txClient = null) => {
    const isPg = checkIsPostgres();
    const sql = isPg
      ? `INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`
      : `INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`;

    const params = [userId, tokenHash, expiresAt, ipAddress || null, userAgent || null];

    if (txClient) {
      const res = await txClient.query(sql, params);
      return res.rows ? res.rows[0] : res[0];
    } else if (isPg) {
      const res = await query(sql, params);
      return Array.isArray(res) ? res[0] : res.rows[0];
    } else {
      const result = await run(sql, params);
      return { id: result.id, user_id: userId, token_hash: tokenHash, expires_at: expiresAt };
    }
  },

  /**
   * Find session by SHA-256 token_hash. Uses FOR UPDATE row lock if in PostgreSQL transaction.
   */
  findByHash: async (tokenHash, txClient = null) => {
    const isPg = checkIsPostgres();
    const sql = isPg
      ? `SELECT * FROM user_refresh_tokens WHERE token_hash = $1 ${txClient ? 'FOR UPDATE' : ''}`
      : `SELECT * FROM user_refresh_tokens WHERE token_hash = ?`;

    if (txClient) {
      const res = await txClient.query(sql, [tokenHash]);
      return res.rows ? res.rows[0] || null : res[0] || null;
    } else if (isPg) {
      const res = await query(sql, [tokenHash]);
      return Array.isArray(res) ? res[0] || null : res.rows[0] || null;
    } else {
      return await get(sql, [tokenHash]);
    }
  },

  /**
   * Revoke single session and record replacement token hash.
   */
  revokeToken: async (tokenId, replacedByHash = null, txClient = null) => {
    const isPg = checkIsPostgres();
    const sql = isPg
      ? `UPDATE user_refresh_tokens 
         SET revoked_at = CURRENT_TIMESTAMP, replaced_by_hash = $2 
         WHERE id = $1 RETURNING *`
      : `UPDATE user_refresh_tokens 
         SET revoked_at = CURRENT_TIMESTAMP, replaced_by_hash = ? 
         WHERE id = ?`;

    const params = isPg ? [tokenId, replacedByHash] : [replacedByHash, tokenId];

    if (txClient) {
      const res = await txClient.query(sql, params);
      return res.rows ? res.rows[0] : res[0];
    } else if (isPg) {
      const res = await query(sql, params);
      return Array.isArray(res) ? res[0] : res.rows[0];
    } else {
      return await run(sql, params);
    }
  },

  /**
   * Revoke ALL active sessions for a user (Triggered on token reuse detection).
   */
  revokeAllUserSessions: async (userId, txClient = null) => {
    const isPg = checkIsPostgres();
    const sql = isPg
      ? `UPDATE user_refresh_tokens 
         SET revoked_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND revoked_at IS NULL`
      : `UPDATE user_refresh_tokens 
         SET revoked_at = CURRENT_TIMESTAMP 
         WHERE user_id = ? AND revoked_at IS NULL`;

    if (txClient) {
      return await txClient.query(sql, [userId]);
    } else if (isPg) {
      return await query(sql, [userId]);
    } else {
      return await run(sql, [userId]);
    }
  }
};

export default refreshTokenRepository;
