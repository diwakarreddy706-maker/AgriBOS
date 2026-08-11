import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initPgSchema, convertSqlToPg } from './src/db/database.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function runMigration() {
  console.log('================================================================');
  console.log('🚀 AGRIBOS — SQLITE TO POSTGRESQL DATA MIGRATION ENGINE');
  console.log('================================================================\n');

  if (!databaseUrl) {
    console.log('⚠️ No DATABASE_URL specified.');
    console.log('💡 Pass DATABASE_URL="postgres://user:pass@host:5432/dbname" node migrate_sqlite_to_postgres.js');
    console.log('ℹ️ Performing dry-run validation against local SQLite database...\n');
  }

  const sqlitePath = path.resolve(__dirname, 'data', 'agribos.db');
  if (!fs.existsSync(sqlitePath)) {
    console.error('❌ SQLite database file not found at:', sqlitePath);
    process.exit(1);
  }

  const sqliteDb = new sqlite3.Database(sqlitePath);

  const getSqliteData = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const sqliteTables = await getSqliteData(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
  );

  console.log(`📋 Found ${sqliteTables.length} user tables in SQLite database.`);

  const sqliteCounts = {};
  for (const t of sqliteTables) {
    const res = await getSqliteData(`SELECT COUNT(*) as count FROM "${t.name}"`);
    sqliteCounts[t.name] = res[0].count;
  }

  console.log('\n📊 SQLite Table Record Counts:');
  console.table(
    Object.entries(sqliteCounts).map(([table, count]) => ({
      Table: table,
      'SQLite Records': count,
    }))
  );

  if (!databaseUrl) {
    console.log('\n✅ Dry-Run Verification Completed Successfully.');
    console.log('================================================================');
    process.exit(0);
  }

  // PostgreSQL Connection & Migration
  const pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  });

  const pgClient = await pgPool.connect();

  try {
    console.log('\n⚡ Connected to PostgreSQL. Initializing Schema...');
    await pgClient.query('BEGIN;');

    // 1. Initialize Schema
    await initPgSchema(pgClient);

    // 2. Migration Order (Dependencies first)
    const migrationOrder = [
      'users',
      'master_data',
      'farmers',
      'machine_owners',
      'employees',
      'machines',
      'vehicle_compliance',
      'compliance_renewals',
      'spare_parts',
      'bookings',
      'dispatches',
      'work_entries',
      'fuel_vouchers',
      'fuel_logs',
      'cashbook_entries',
      'audit_logs',
      'maintenance_jobs',
      'customer_invoices',
      'farmer_payments',
      'owner_payouts',
      'payroll_entries',
      'machine_telematics_history',
    ];

    const pgCounts = {};

    for (const table of migrationOrder) {
      const rows = await getSqliteData(`SELECT * FROM "${table}"`);
      if (rows.length === 0) {
        pgCounts[table] = 0;
        continue;
      }

      // Column names
      const cols = Object.keys(rows[0]);
      const colNamesStr = cols.map(c => `"${c}"`).join(', ');

      for (const row of rows) {
        const values = cols.map(c => row[c]);
        const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
        const insertSql = `INSERT INTO "${table}" (${colNamesStr}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
        await pgClient.query(insertSql, values);
      }

      // Reset sequence
      const seqCheck = await pgClient.query(
        `SELECT pg_get_serial_sequence('${table}', 'id') as seq;`
      );
      if (seqCheck.rows[0]?.seq) {
        await pgClient.query(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1));`
        );
      }

      const countRes = await pgClient.query(`SELECT COUNT(*) as count FROM "${table}";`);
      pgCounts[table] = parseInt(countRes.rows[0].count, 10);
    }

    await pgClient.query('COMMIT;');

    console.log('\n================================================================');
    console.log('📊 MIGRATION VERIFICATION COMPARISON MATRIX');
    console.log('================================================================');

    let totalDiff = 0;
    const reportData = migrationOrder.map(table => {
      const sqCount = sqliteCounts[table] || 0;
      const pgCount = pgCounts[table] || 0;
      const diff = pgCount - sqCount;
      totalDiff += Math.abs(diff);
      return {
        Table: table,
        'SQLite Count': sqCount,
        'Postgres Count': pgCount,
        Difference: diff === 0 ? '0 (MATCH)' : `${diff} ❌`,
      };
    });

    console.table(reportData);

    if (totalDiff !== 0) {
      console.error('❌ MIGRATION FAILED: Table record counts do not match!');
      process.exit(1);
    }

    console.log('\n✅ 100% RECORDS SUCCESSFULLY MIGRATED TO POSTGRESQL.');
  } catch (err) {
    await pgClient.query('ROLLBACK;');
    console.error('❌ MIGRATION ERROR:', err);
    process.exit(1);
  } finally {
    pgClient.release();
    await pgPool.end();
    sqliteDb.close();
  }
}

runMigration().catch(err => {
  console.error('❌ MIGRATION SCRIPT CRASHED:', err);
  process.exit(1);
});
