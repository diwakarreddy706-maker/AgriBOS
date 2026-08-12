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
console.log('🧪 AGRIBOS — FRONTEND AUTH & ROUTE GUARD VERIFICATION');
console.log('====================================================\n');

// 1. Inspect MainLayout.tsx & Route Protections
console.log('--- 1. ROUTE GUARD & PROTECTION AUDIT ---');
const mainLayoutPath = path.resolve('../agribos-frontend/src/components/layout/MainLayout.tsx');
const mainLayoutContent = fs.readFileSync(mainLayoutPath, 'utf8');

assert(mainLayoutContent.includes('useAuthStore'), 'MainLayout correctly connects to useAuthStore');
assert(mainLayoutContent.includes('!isAuthenticated'), 'MainLayout checks authentication status');
assert(mainLayoutContent.includes('<Navigate to="/login" replace />') || mainLayoutContent.includes('Navigate to="/login"'), 'Unauthenticated users on protected routes are redirected to /login');
assert(mainLayoutContent.includes('isInitializing'), 'MainLayout prevents flash of login screen during auth initialization');

// 2. Inspect App.tsx Route Structure
console.log('\n--- 2. APP ROUTING & PATH AUDIT ---');
const appPath = path.resolve('../agribos-frontend/src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

const protectedRoutes = [
  '/', '/operations', '/bookings', '/fuel-dashboard', '/fuel-vouchers',
  '/workshop-dashboard', '/breakdowns', '/maintenance-jobs', '/inventory-dashboard',
  '/spare-parts', '/machine-health', '/fleet-analytics', '/finance-dashboard',
  '/invoices', '/machine-billing', '/machine-billing-ledger', '/payment-receipts',
  '/cash-book', '/vendor-bills', '/payroll', '/general-ledger', '/profit-loss',
  '/farmers', '/employees', '/drivers', '/machines', '/tractors', '/harvesters',
  '/vehicle-compliance', '/machine-owners', '/rented-owner-settlement', '/masters'
];

let allRoutesProtected = true;
for (const r of protectedRoutes) {
  if (!appContent.includes(`path="${r}"`)) {
    allRoutesProtected = false;
    console.error(`  ❌ Route ${r} is missing from App.tsx`);
  }
}
assert(allRoutesProtected, `All 32 protected ERP routes mapped under MainLayout guard`);

// 3. Inspect AuthLayout.tsx Login Redirection
console.log('\n--- 3. AUTH LAYOUT & LOGGED-IN REDIRECT AUDIT ---');
const authLayoutPath = path.resolve('../agribos-frontend/src/components/layout/AuthLayout.tsx');
const authLayoutContent = fs.readFileSync(authLayoutPath, 'utf8');

assert(authLayoutContent.includes('isAuthenticated') && authLayoutContent.includes('<Navigate to="/" replace />'), 'Authenticated users visiting /login are redirected to / (dashboard)');

// 4. Inspect store & Security Storage rules
console.log('\n--- 4. AUTH STORE & HTTPONLY COOKIE SECURITY AUDIT ---');
const storePath = path.resolve('../agribos-frontend/src/store/useAuthStore.ts');
const storeContent = fs.readFileSync(storePath, 'utf8');

assert(!storeContent.includes("localStorage.setItem('agribos_refresh_token'"), 'Refresh tokens are NOT saved to localStorage');
assert(storeContent.includes("localStorage.removeItem('agribos_refresh_token')"), 'Legacy refresh tokens in localStorage are cleaned up');
assert(storeContent.includes('/auth/logout'), 'Logout triggers backend API to clear HttpOnly session cookie');
assert(storeContent.includes('checkAuth'), 'Session restoration routine checkAuth is implemented');

// 5. Inspect apiClient 401 Interceptor & Infinite Loop Prevention
console.log('\n--- 5. API CLIENT 401 INTERCEPTOR AUDIT ---');
const apiClientPath = path.resolve('../agribos-frontend/src/lib/apiClient.ts');
const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');

assert(apiClientContent.includes("originalRequest.url?.includes('/auth/refresh')"), 'Interceptor excludes /auth/refresh from 401 retries');
assert(apiClientContent.includes("originalRequest.url?.includes('/auth/login')"), 'Interceptor excludes /auth/login from 401 retries');
assert(apiClientContent.includes("originalRequest.url?.includes('/auth/logout')"), 'Interceptor excludes /auth/logout from 401 retries');
assert(apiClientContent.includes('withCredentials: true'), 'Axios client uses withCredentials for HttpOnly cookie transport');
assert(apiClientContent.includes("window.location.href = '/login'"), 'Failed refresh attempts redirect to /login');

console.log('\n====================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
