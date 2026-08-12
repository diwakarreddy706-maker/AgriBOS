import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('🧪 AGRIBOS — DATABASE ENGINE SELECTION & HARDENING AUDIT');
console.log('====================================================\n');

// Helper to run node command in sub-process with custom env
function runNodeSubprocess(envVars = {}, codeSnippet = "import { checkIsPostgres } from './src/db/database.js'; console.log('ENGINE:' + (checkIsPostgres() ? 'POSTGRES' : 'SQLITE'));") {
  const env = { ...process.env, ...envVars };
  // Remove DATABASE_URL / POSTGRES_URL if explicitly set to empty string or undefined in envVars
  if (envVars.DATABASE_URL === '') delete env.DATABASE_URL;
  if (envVars.POSTGRES_URL === '') delete env.POSTGRES_URL;
  if (envVars.DB_ENGINE === '') delete env.DB_ENGINE;

  try {
    const stdout = execSync(`node --input-type=module -e "${codeSnippet}"`, {
      env,
      encoding: 'utf8',
      stderr: 'pipe'
    });
    return { success: true, stdout, stderr: '' };
  } catch (err) {
    return {
      success: false,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : err.message
    };
  }
}

// TEST 1: NODE_ENV=development without DATABASE_URL allows SQLite
console.log('--- TEST 1: Development Mode (SQLite Allowed) ---');
const res1 = runNodeSubprocess({ NODE_ENV: 'development', DATABASE_URL: '', POSTGRES_URL: '' });
assert(res1.success && res1.stdout.includes('ENGINE:SQLITE'), 'NODE_ENV=development correctly defaults to SQLite when DATABASE_URL is absent');

// TEST 2: NODE_ENV=test allows SQLite for local testing
console.log('\n--- TEST 2: Test Mode (SQLite Allowed for Test Suite) ---');
const res2 = runNodeSubprocess({ NODE_ENV: 'test', DATABASE_URL: '', POSTGRES_URL: '' });
assert(res2.success && res2.stdout.includes('ENGINE:SQLITE'), 'NODE_ENV=test correctly maintains SQLite support for test execution');

// TEST 3: NODE_ENV=production with DATABASE_URL selects PostgreSQL
console.log('\n--- TEST 3: Production Mode with DATABASE_URL (PostgreSQL Selected) ---');
const dummyPgUrl = 'postgresql://testuser:testpass@localhost:5432/testdb';
const res3 = runNodeSubprocess({ NODE_ENV: 'production', DATABASE_URL: dummyPgUrl });
assert(res3.success && res3.stdout.includes('ENGINE:POSTGRES'), 'NODE_ENV=production with DATABASE_URL correctly selects PostgreSQL engine');

// TEST 4: NODE_ENV=production with missing DATABASE_URL fails startup (Fail Fast)
console.log('\n--- TEST 4: Production Fail-Closed Rule (Missing DATABASE_URL Fails Fast) ---');
const res4 = runNodeSubprocess({ NODE_ENV: 'production', DATABASE_URL: '', POSTGRES_URL: '' });
assert(!res4.success, 'NODE_ENV=production with missing DATABASE_URL correctly aborted startup');
assert(res4.stderr.includes('DATABASE_URL is required when NODE_ENV=production') || res4.stderr.includes('SQLite fallback is strictly forbidden'), 'Fail-fast stderr contains explicit production database configuration error');

// TEST 5: NODE_ENV=production rejecting SQLite fallback
console.log('\n--- TEST 5: Production Mode Rejects SQLite Fallback ---');
const res5 = runNodeSubprocess({ NODE_ENV: 'production', DATABASE_URL: '', DB_ENGINE: 'sqlite' });
assert(!res5.success && (res5.stderr.includes('SQLite fallback is strictly forbidden') || res5.stderr.includes('DATABASE_URL is required')), 'NODE_ENV=production explicitly rejects SQLite-only fallback configuration');

// TEST 6: Frontend Source Code Security Audit (No Database Credentials)
console.log('\n--- TEST 6: Frontend Security Audit (No Direct DB Credentials) ---');
const frontendDir = path.resolve('../agribos-frontend/src');
let frontendHasDbCreds = false;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx?|jsx?|html)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('DATABASE_URL') || content.includes('postgres://') || content.includes('postgresql://')) {
        frontendHasDbCreds = true;
        console.error(`  ❌ Direct DB Reference found in ${fullPath}`);
      }
    }
  }
}

scanDir(frontendDir);
assert(!frontendHasDbCreds, 'React Frontend contains 0 database connection strings, credentials, or direct DB references');

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
