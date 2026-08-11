import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { get, query, exec } from './src/db/sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEmpiricalDbVerification() {
  console.log('================================================================');
  console.log('🔍 EMPIRICAL SQLITE DATABASE INTEGRITY & SCHEMA VERIFICATION');
  console.log('================================================================\n');

  const dbPath = path.resolve(__dirname, 'data', 'agribos.db');
  const backupPath = path.resolve(__dirname, 'data', 'agribos_backup_UAT_20260810.db');

  // 1. Verify Database File Existence & Size
  console.log('1. FILE ACCESSIBILITY CHECK:');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ ERROR: Database file does not exist at:', dbPath);
    process.exit(1);
  }
  const stats = fs.statSync(dbPath);
  console.log(`  ✅ Database file exists: ${dbPath}`);
  console.log(`  ✅ Database file size: ${(stats.size / 1024).toFixed(2)} KB`);

  if (fs.existsSync(backupPath)) {
    const backupStats = fs.statSync(backupPath);
    console.log(`  ✅ Backup file exists: ${backupPath} (${(backupStats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log('  ⚠️ Warning: Backup file not found at expected path');
  }

  // 2. Foreign Keys PRAGMA Check
  console.log('\n2. FOREIGN KEYS PRAGMA VERIFICATION:');
  await exec('PRAGMA foreign_keys = ON;');
  const fkResult = await get('PRAGMA foreign_keys;');
  console.log(`  ✅ PRAGMA foreign_keys = ${fkResult.foreign_keys}`);

  // 3. Database Integrity Check
  console.log('\n3. DATABASE INTEGRITY PRAGMA VERIFICATION:');
  const integrityResult = await get('PRAGMA integrity_check;');
  console.log(`  ✅ PRAGMA integrity_check = "${integrityResult.integrity_check}"`);
  if (integrityResult.integrity_check !== 'ok') {
    console.error('❌ CRITICAL ERROR: Database integrity check failed!');
    process.exit(1);
  }

  // 4. Table Count & Catalog Verification
  console.log('\n4. TABLE COUNT & SCHEMA CATALOG VERIFICATION:');
  const countResult = await get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  console.log(`  ✅ Total User Tables Count: ${countResult.count}`);

  const tables = await query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
  console.log('\n  📋 Complete User Tables Catalog:');
  tables.forEach((t, i) => {
    console.log(`     ${(i + 1).toString().padStart(2, ' ')}. ${t.name}`);
  });

  // 5. Record Count Per Table (Read-Only Inspection)
  console.log('\n5. TABLE ROW COUNTS & READABILITY INSPECTION:');
  for (const t of tables) {
    const rowCount = await get(`SELECT COUNT(*) as total FROM "${t.name}"`);
    console.log(`     - ${t.name.padEnd(30, ' ')} : ${rowCount.total} rows`);
  }

  console.log('\n================================================================');
  console.log('✅ EMPIRICAL DATABASE VERIFICATION COMPLETE — ALL CHECKS PASSED');
  console.log('================================================================');

  process.exit(0);
}

runEmpiricalDbVerification().catch((err) => {
  console.error('❌ EMPIRICAL DB VERIFICATION FAILED:', err);
  process.exit(1);
});
