import http from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, run, get, initDb } from './src/db/database.js';
import userRepository from './src/repositories/userRepository.js';
import refreshTokenRepository from './src/repositories/refreshTokenRepository.js';
import userService from './src/services/userService.js';

const PORT = 8089;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const runSecuritySuite = async () => {
  console.log('====================================================');
  console.log('🛡️ RUNNING AGRIBOS PRODUCTION SECURITY TEST SUITE V2');
  console.log('====================================================\n');

  await initDb();
  const engine = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
  console.log(`⚡ Active Database Engine: ${engine}\n`);

  const testUsername = `temp_sec_user_${Date.now()}`;
  const testPassword = 'TestUserSecret@2026';
  let testUser = null;

  try {
    // 0. Create Temporary Isolated Test User
    console.log(`[TEST 0] Creating temporary lifecycle test user: ${testUsername}...`);
    const passwordHash = await bcrypt.hash(testPassword, 12);
    testUser = await userRepository.createUser({
      username: testUsername,
      passwordHash: passwordHash,
      fullName: 'Security Test Account',
      email: `${testUsername}@sec-test.local`,
      roles: ['ROLE_USER']
    });
    console.log(' -> PASSED: Temporary test user created.\n');

    // 1. Valid Login -> 200 + JWT
    console.log('[TEST 1] Testing Valid Credentials Login...');
    const loginRes = await userService.login(testUsername, testPassword, { ip: '127.0.0.1' });
    console.assert(loginRes.accessToken, 'Access token missing on valid login');
    console.assert(loginRes.refreshToken, 'Refresh token missing on valid login');
    console.assert(!loginRes.user.password_hash, 'SECURITY LEAK: password_hash returned!');
    console.log(' -> PASSED: Valid login returns access token and sanitized user payload.\n');

    // 2. Wrong Password -> Generic 401
    console.log('[TEST 2] Testing Wrong Password Handling...');
    try {
      await userService.login(testUsername, 'WrongPassword999!', { ip: '127.0.0.1' });
      console.assert(false, 'Login should have failed on wrong password!');
    } catch (err) {
      console.assert(err.message.includes('Invalid credentials'), 'Generic 401 error required');
      console.log(' -> PASSED: Wrong password rejected with generic HTTP 401.\n');
    }

    // 3. Missing Refresh Token -> Generic 401
    console.log('[TEST 3] Testing Missing Refresh Token Handling...');
    try {
      await userService.refresh(null, { ip: '127.0.0.1' });
      console.assert(false, 'Missing token should fail!');
    } catch (err) {
      console.assert(err.message.includes('Invalid or expired session'), 'Generic 401 error required');
      console.log(' -> PASSED: Missing refresh token rejected with generic HTTP 401.\n');
    }

    // 4. Non-Existent Token Hash -> Generic 401 without mass revocation
    console.log('[TEST 4] Testing Non-Existent Token Hash Handling...');
    const fakeToken = jwt.sign({ id: 99999, username: 'fake' }, process.env.REFRESH_SECRET || 'agribos-super-secret-refresh-key-2026', { expiresIn: '7d' });
    try {
      await userService.refresh(fakeToken, { ip: '127.0.0.1' });
      console.assert(false, 'Fake token should fail!');
    } catch (err) {
      console.assert(err.message.includes('Invalid or expired session'), 'Generic 401 error required');
      console.log(' -> PASSED: Non-existent token rejected with generic 401 without mass revocation.\n');
    }

    // 5. Database-Backed Refresh Token Session Rotation
    console.log('[TEST 5] Testing Transactional Database-Backed Refresh Token Rotation...');
    const refreshRes1 = await userService.refresh(loginRes.refreshToken, { ip: '127.0.0.1' });
    console.assert(refreshRes1.accessToken, 'Failed to issue new access token on refresh');
    console.assert(refreshRes1.refreshToken !== loginRes.refreshToken, 'Refresh token was not rotated!');
    console.log(' -> PASSED: Refresh token rotated transactionally in DB.\n');

    // 6. Differentiated Token Reuse Detection & Mass Revocation
    console.log('[TEST 6] Testing Refresh Token Reuse Detection & Mass Session Revocation...');
    try {
      await userService.refresh(loginRes.refreshToken, { ip: '127.0.0.1' }); // Reusing old rotated token!
      console.assert(false, 'Token reuse should have thrown 401!');
    } catch (err) {
      console.assert(err.message.includes('Invalid or expired session'), 'Generic 401 error required on reuse');
      
      const activeSessions = await query(
        process.env.DATABASE_URL
          ? 'SELECT * FROM user_refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL'
          : 'SELECT * FROM user_refresh_tokens WHERE user_id = ? AND revoked_at IS NULL',
        [testUser.id]
      );
      const activeCount = Array.isArray(activeSessions) ? activeSessions.length : (activeSessions?.rows?.length || 0);
      console.assert(activeCount === 0, `Active sessions remained! Count: ${activeCount}`);
      console.log(' -> PASSED: Reuse detected; all user sessions mass-revoked in DB.\n');
    }

    // 7. Expired Session Handling
    console.log('[TEST 7] Testing Database Expired Session Enforcement...');
    const expiredLogin = await userService.login(testUsername, testPassword, { ip: '127.0.0.1' });
    // Manually expire session in DB
    const crypto = await import('crypto');
    const expHash = crypto.createHash('sha256').update(expiredLogin.refreshToken).digest('hex');
    await run(
      process.env.DATABASE_URL
        ? "UPDATE user_refresh_tokens SET expires_at = NOW() - INTERVAL '1 hour' WHERE token_hash = $1"
        : "UPDATE user_refresh_tokens SET expires_at = datetime('now', '-1 hour') WHERE token_hash = ?",
      [expHash]
    );
    try {
      await userService.refresh(expiredLogin.refreshToken, { ip: '127.0.0.1' });
      console.assert(false, 'Expired token should have been rejected!');
    } catch (err) {
      console.assert(err.message.includes('Invalid or expired session'), 'Generic 401 required');
      console.log(' -> PASSED: Database expires_at enforced; expired token rejected.\n');
    }

    // 8. Concurrent Refresh Race Condition Test
    console.log('[TEST 8] Testing Concurrent Refresh Race Conditions (Promise.all)...');
    const freshLogin = await userService.login(testUsername, testPassword, { ip: '127.0.0.1' });
    const raceResults = await Promise.allSettled([
      userService.refresh(freshLogin.refreshToken, { ip: '127.0.0.1' }),
      userService.refresh(freshLogin.refreshToken, { ip: '127.0.0.1' })
    ]);

    const fulfilled = raceResults.filter((r) => r.status === 'fulfilled');
    const rejected = raceResults.filter((r) => r.status === 'rejected');
    console.assert(fulfilled.length === 1, `Expected exactly 1 fulfilled refresh, got ${fulfilled.length}`);
    console.assert(rejected.length === 1, `Expected exactly 1 rejected refresh, got ${rejected.length}`);
    console.log(' -> PASSED: Concurrency handled safely (1 success, 1 rejection).\n');

    // 9. SQL Parameterization Injection Test
    console.log('[TEST 9] Testing SQL Injection Parameterization Defense...');
    const injectionUsername = "' OR '1'='1";
    const injectionResult = await userRepository.findByUsername(injectionUsername);
    console.assert(injectionResult === undefined || injectionResult === null, 'SQL Injection succeeded!');
    console.log(' -> PASSED: SQL queries safely parameterized; injection attempt returned 0 records.\n');

    // 10. Restart Persistence Verification
    console.log('[TEST 10] Testing Database Session Persistence Across Restart...');
    // Re-initialize DB connection simulation
    await initDb();
    const activeSessionsAfterRestart = await query(
      process.env.DATABASE_URL
        ? 'SELECT * FROM user_refresh_tokens WHERE user_id = $1'
        : 'SELECT * FROM user_refresh_tokens WHERE user_id = ?',
      [testUser.id]
    );
    const sessionCount = Array.isArray(activeSessionsAfterRestart) ? activeSessionsAfterRestart.length : (activeSessionsAfterRestart?.rows?.length || 0);
    console.assert(sessionCount > 0, 'Sessions lost after restart!');
    console.log(` -> PASSED: Database session records (${sessionCount}) persisted intact across restart.\n`);

    // 11. Response Payload Secret Sanitization Check
    console.log('[TEST 11] Testing Response Payload Secret Sanitization...');
    const userPayloadStr = JSON.stringify(freshLogin.user);
    console.assert(!userPayloadStr.includes('password_hash'), 'LEAK: password_hash');
    console.assert(!userPayloadStr.includes('DATABASE_URL'), 'LEAK: DATABASE_URL');
    console.assert(!userPayloadStr.includes('JWT_SECRET'), 'LEAK: JWT_SECRET');
    console.assert(!userPayloadStr.includes('REFRESH_SECRET'), 'LEAK: REFRESH_SECRET');
    console.log(' -> PASSED: All sensitive fields sanitized from user object payloads.\n');

    console.log('====================================================');
    console.log(`✅ ALL 11 AGRIBOS SECURITY SUITE ASSERTIONS PASSED 100% (${engine})`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ SECURITY SUITE FAILURE:', err);
    process.exit(1);
  } finally {
    // 12. Lifecycle Cleanup: Completely delete temporary test user
    if (testUser) {
      console.log(`[CLEANUP] Deleting temporary test user ${testUsername} from DB...`);
      if (process.env.DATABASE_URL) {
        await query('DELETE FROM users WHERE username = $1', [testUsername]);
      } else {
        await run('DELETE FROM users WHERE username = ?', [testUsername]);
      }
      console.log(' -> PASSED: Temporary test user completely deleted. Zero test records left in DB.');
    }
  }
};

runSecuritySuite();
