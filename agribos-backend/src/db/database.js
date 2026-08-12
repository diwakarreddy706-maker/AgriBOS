import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Detect environment and database URL configuration
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Fail-closed security rule for production:
// Production MUST operate on PostgreSQL/Neon ONLY. SQLite fallback is strictly forbidden.
if (isProduction && !databaseUrl) {
  const errorMsg = '❌ CRITICAL CONFIGURATION ERROR: NODE_ENV=production requires a valid DATABASE_URL (Neon PostgreSQL). SQLite fallback is strictly forbidden in production.';
  console.error(errorMsg);
  throw new Error('Production database configuration error: DATABASE_URL is required when NODE_ENV=production');
}

const isPostgres = Boolean(databaseUrl || process.env.DB_ENGINE === 'postgres');

let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  if (!databaseUrl) {
    throw new Error('PostgreSQL engine selected but DATABASE_URL is missing.');
  }
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('⚡ Database Engine: PostgreSQL');
  console.log(`⚡ Environment: ${nodeEnv}`);
} else {
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(path.resolve('data'), 'agribos.db');

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Could not connect to SQLite database:', err);
    } else {
      console.log('⚡ Database Engine: SQLite');
      console.log(`⚡ Environment: ${nodeEnv}`);
    }
  });
}


/**
 * Converts SQLite positional '?' placeholders to PostgreSQL '$1, $2, $3...' placeholders
 */
export const convertSqlToPg = (sql) => {
  let paramIndex = 1;
  let inString = false;
  let stringChar = '';
  let result = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    if ((char === "'" || char === '"') && (i === 0 || sql[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      result += char;
    } else if (char === '?' && !inString) {
      result += `$${paramIndex++}`;
    } else {
      result += char;
    }
  }
  return result;
};

// Unified Query Execution Helper (returns array of rows)
export const query = async (sql, params = [], client = null) => {
  if (isPostgres) {
    const runner = client || pgPool;
    const pgSql = convertSqlToPg(sql);
    const res = await runner.query(pgSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
};

// Unified Get Single Row Helper (returns first row or undefined)
export const get = async (sql, params = [], client = null) => {
  if (isPostgres) {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('PRAGMA FOREIGN_KEYS')) {
      return { foreign_keys: 1 };
    }
    if (trimmed.startsWith('PRAGMA INTEGRITY_CHECK')) {
      return { integrity_check: 'ok' };
    }
    if (trimmed.startsWith('PRAGMA TABLE_INFO')) {
      const tableNameMatch = sql.match(/PRAGMA table_info\(([^)]+)\)/i);
      if (tableNameMatch) {
        const rawName = tableNameMatch[1].replace(/['"]/g, '').trim();
        const cols = await query(
          "SELECT column_name as name FROM information_schema.columns WHERE table_name = $1",
          [rawName],
          client
        );
        return cols;
      }
    }
    const runner = client || pgPool;
    const pgSql = convertSqlToPg(sql);
    const res = await runner.query(pgSql, params);
    return res.rows[0];
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
};

// Unified Run Command Helper (INSERT, UPDATE, DELETE) -> returns { id, changes }
export const run = async (sql, params = [], client = null) => {
  if (isPostgres) {
    const runner = client || pgPool;
    let pgSql = convertSqlToPg(sql);
    const upper = pgSql.trim().toUpperCase();
    
    if (upper.startsWith('INSERT') && !upper.includes('RETURNING')) {
      pgSql += ' RETURNING id';
    }

    const res = await runner.query(pgSql, params);
    const id = res.rows && res.rows[0] && res.rows[0].id ? res.rows[0].id : null;
    return { id, changes: res.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

// Raw Statement Exec Helper
export const exec = async (sql, client = null) => {
  if (isPostgres) {
    const runner = client || pgPool;
    await runner.query(sql);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
};

let sqliteTxPromise = Promise.resolve();

// Transaction Execution Wrapper
export const runInTransaction = async (callback) => {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const scopedTx = {
        query: (sql, params = []) => query(sql, params, client),
        get: (sql, params = []) => get(sql, params, client),
        run: (sql, params = []) => run(sql, params, client),
        exec: (sql) => exec(sql, client),
      };
      const result = await callback(scopedTx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    const currentTx = sqliteTxPromise.then(async () => {
      await run('BEGIN TRANSACTION');
      try {
        const scopedTx = {
          query: (sql, params = []) => query(sql, params),
          get: (sql, params = []) => get(sql, params),
          run: (sql, params = []) => run(sql, params),
          exec: (sql) => exec(sql),
        };
        const result = await callback(scopedTx);
        await run('COMMIT');
        return result;
      } catch (error) {
        await run('ROLLBACK');
        throw error;
      }
    });
    sqliteTxPromise = currentTx.catch(() => {});
    return currentTx;
  }
};

// PostgreSQL Native Table Schema Creation Definitions
export const initPgSchema = async (client = null) => {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      roles VARCHAR(255) DEFAULT '["ROLE_USER"]',
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP NULL,
      replaced_by_hash VARCHAR(64) NULL,
      ip_address VARCHAR(45),
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON user_refresh_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_refresh_user_id ON user_refresh_tokens(user_id);

    CREATE TABLE IF NOT EXISTS farmers (
      id SERIAL PRIMARY KEY,
      farmer_code VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      father_name VARCHAR(255),
      mobile_number VARCHAR(20) NOT NULL,
      village_name VARCHAR(255) NOT NULL,
      taluk_name VARCHAR(255) DEFAULT 'Gangavati',
      district_name VARCHAR(255) DEFAULT 'Raichur',
      status VARCHAR(50) DEFAULT 'ACTIVE',
      is_deleted SMALLINT DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_farmers_code ON farmers(farmer_code);
    CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(mobile_number);

    CREATE TABLE IF NOT EXISTS farmer_payments (
      id SERIAL PRIMARY KEY,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      bill_id INTEGER,
      payment_amount DECIMAL(12,2) NOT NULL,
      payment_mode VARCHAR(50) DEFAULT 'CASH',
      transaction_ref VARCHAR(255),
      remarks TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS machine_owners (
      id SERIAL PRIMARY KEY,
      owner_code VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      mobile_number VARCHAR(20) NOT NULL,
      alternate_phone VARCHAR(20),
      address TEXT,
      bank_name VARCHAR(255),
      account_no VARCHAR(100),
      ifsc_code VARCHAR(50),
      upi_id VARCHAR(100),
      village_name VARCHAR(255),
      total_machines INTEGER DEFAULT 1,
      advance_paid DECIMAL(12,2) DEFAULT 0,
      balance_due DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      is_deleted SMALLINT DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS owner_payouts (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER NOT NULL REFERENCES machine_owners(id) ON DELETE CASCADE,
      payout_date VARCHAR(50) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      payment_mode VARCHAR(50) DEFAULT 'BANK_TRANSFER',
      bank_ref VARCHAR(255),
      notes TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS machines (
      id SERIAL PRIMARY KEY,
      machine_code VARCHAR(50) UNIQUE NOT NULL,
      machine_name VARCHAR(255) NOT NULL,
      registration_number VARCHAR(100) NOT NULL,
      machine_type VARCHAR(50) DEFAULT 'HARVESTER',
      owner_type VARCHAR(50) DEFAULT 'COMPANY_OWNED',
      owner_id INTEGER REFERENCES machine_owners(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'AVAILABLE',
      hourly_rate DECIMAL(12,2) DEFAULT 2400,
      acre_rate DECIMAL(12,2) DEFAULT 1500,
      engine_hours DECIMAL(12,2) DEFAULT 0,
      latitude DECIMAL(10,6),
      longitude DECIMAL(10,6),
      speed DECIMAL(10,2) DEFAULT 0,
      last_gps_update TIMESTAMP,
      next_service_hours DECIMAL(12,2) DEFAULT 250,
      service_interval_hours DECIMAL(12,2) DEFAULT 250,
      service_status VARCHAR(50) DEFAULT 'OK',
      is_deleted SMALLINT DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(machine_code);

    CREATE TABLE IF NOT EXISTS vehicle_compliance (
      id SERIAL PRIMARY KEY,
      machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
      registration_number VARCHAR(100) NOT NULL,
      make_model_description TEXT,
      owner_name VARCHAR(255),
      owner_phone VARCHAR(20),
      insurance_policy_no VARCHAR(100),
      insurance_status VARCHAR(50) DEFAULT 'VALID',
      insurance_expiry_date VARCHAR(50),
      road_tax_receipt_no VARCHAR(100),
      road_tax_status VARCHAR(50) DEFAULT 'VALID',
      road_tax_expiry_date VARCHAR(50),
      nc_permit_status_no VARCHAR(100),
      nc_permit_status VARCHAR(50) DEFAULT 'VALID',
      nc_permit_expiry_date VARCHAR(50),
      fitness_expiry_date VARCHAR(50),
      fitness_status VARCHAR(50) DEFAULT 'VALID',
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS compliance_renewals (
      id SERIAL PRIMARY KEY,
      compliance_id INTEGER NOT NULL REFERENCES vehicle_compliance(id) ON DELETE CASCADE,
      doc_type VARCHAR(100) NOT NULL,
      doc_number VARCHAR(100) NOT NULL,
      new_expiry_date VARCHAR(50) NOT NULL,
      amount_paid DECIMAL(12,2) DEFAULT 0,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      employee_code VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'OPERATOR',
      mobile_number VARCHAR(20) NOT NULL,
      base_salary DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      is_deleted SMALLINT DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      booking_number VARCHAR(50) UNIQUE NOT NULL,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      machine_id INTEGER REFERENCES machines(id) ON DELETE SET NULL,
      season_id INTEGER DEFAULT 1,
      booking_date VARCHAR(50) NOT NULL,
      preferred_work_date VARCHAR(50) NOT NULL,
      machine_type VARCHAR(50) DEFAULT 'HARVESTER',
      estimated_acres DECIMAL(12,2) DEFAULT 5.0,
      estimated_hours DECIMAL(12,2) DEFAULT 8.0,
      priority VARCHAR(50) DEFAULT 'NORMAL',
      status VARCHAR(50) DEFAULT 'CONFIRMED',
      is_deleted SMALLINT DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id SERIAL PRIMARY KEY,
      dispatch_number VARCHAR(50) UNIQUE NOT NULL,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      operator_id INTEGER,
      driver_id INTEGER,
      dispatch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      start_engine_hours DECIMAL(12,2) DEFAULT 0,
      end_engine_hours DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'DISPATCHED',
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_entries (
      id SERIAL PRIMARY KEY,
      bill_number VARCHAR(50) UNIQUE NOT NULL,
      work_date VARCHAR(50) NOT NULL,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      machine_id INTEGER REFERENCES machines(id) ON DELETE SET NULL,
      machine_name VARCHAR(255),
      operator_name VARCHAR(255),
      village_name VARCHAR(255),
      crop_type VARCHAR(100),
      start_time VARCHAR(50),
      end_time VARCHAR(50),
      break_hours DECIMAL(12,2) DEFAULT 0,
      work_hours DECIMAL(12,2) DEFAULT 0,
      rate_type VARCHAR(50) DEFAULT 'HOURLY',
      rate_per_unit DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) DEFAULT 0,
      advance_amount DECIMAL(12,2) DEFAULT 0,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      balance_due DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'UNPAID',
      notes TEXT,
      receipt_image_url TEXT,
      is_deleted SMALLINT DEFAULT 0,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fuel_vouchers (
      id SERIAL PRIMARY KEY,
      voucher_number VARCHAR(50) UNIQUE NOT NULL,
      machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      operator_id INTEGER,
      fuel_station_id INTEGER,
      approved_liters DECIMAL(12,2) NOT NULL,
      issued_date VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'ISSUED',
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id SERIAL PRIMARY KEY,
      ticket_number VARCHAR(50) UNIQUE NOT NULL,
      log_date_time TIMESTAMP NOT NULL,
      machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      machine_name VARCHAR(255),
      operator_id INTEGER,
      operator_name VARCHAR(255),
      hour_meter DECIMAL(12,2) DEFAULT 0,
      fuel_type VARCHAR(50) DEFAULT 'Diesel',
      quantity_liters DECIMAL(12,2) NOT NULL,
      price_per_liter DECIMAL(12,2) NOT NULL,
      total_cost DECIMAL(12,2) NOT NULL,
      vendor_station VARCHAR(255),
      remarks TEXT,
      receipt_image_url TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cashbook_entries (
      id SERIAL PRIMARY KEY,
      entry_date VARCHAR(50) NOT NULL,
      entry_type VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      payment_mode VARCHAR(50) DEFAULT 'CASH',
      reference_no VARCHAR(255),
      description TEXT,
      receipt_image_url TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS master_data (
      id SERIAL PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100),
      meta_json TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      username VARCHAR(100) DEFAULT 'system',
      module VARCHAR(100) NOT NULL,
      action VARCHAR(100) NOT NULL,
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spare_parts (
      id SERIAL PRIMARY KEY,
      part_number VARCHAR(100) UNIQUE NOT NULL,
      part_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      unit_of_measure VARCHAR(50) DEFAULT 'PCS',
      current_stock INTEGER DEFAULT 0,
      minimum_stock_level INTEGER DEFAULT 5,
      unit_cost DECIMAL(12,2) DEFAULT 0,
      location_rack VARCHAR(100) DEFAULT 'RACK-A',
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_jobs (
      id SERIAL PRIMARY KEY,
      job_number VARCHAR(50) UNIQUE NOT NULL,
      machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      breakdown_date VARCHAR(50) NOT NULL,
      issue_description TEXT,
      status VARCHAR(50) DEFAULT 'OPEN',
      cost DECIMAL(12,2) DEFAULT 0,
      receipt_image_url TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      invoice_date VARCHAR(50) NOT NULL,
      total_amount DECIMAL(12,2) DEFAULT 0,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'UNPAID',
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_entries (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      pay_period VARCHAR(50) NOT NULL,
      base_salary DECIMAL(12,2) DEFAULT 0,
      net_salary DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'DISBURSED',
      is_deleted SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS machine_telematics_history (
      id SERIAL PRIMARY KEY,
      machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      latitude DECIMAL(10,6) NOT NULL,
      longitude DECIMAL(10,6) NOT NULL,
      speed DECIMAL(10,2) DEFAULT 0,
      engine_hours DECIMAL(12,2) DEFAULT 0,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      source VARCHAR(50) DEFAULT 'TELEMATICS_API',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_telematics_machine_id ON machine_telematics_history(machine_id);
    CREATE INDEX IF NOT EXISTS idx_telematics_recorded_at ON machine_telematics_history(recorded_at);

    CREATE TABLE IF NOT EXISTS document_sequences (
      sequence_key VARCHAR(100) PRIMARY KEY,
      current_val INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      invoice_type VARCHAR(50) NOT NULL,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      source_transaction_type VARCHAR(50),
      source_transaction_id INTEGER,
      invoice_date VARCHAR(50) NOT NULL,
      subtotal DECIMAL(12,2) DEFAULT 0,
      discount DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      grand_total DECIMAL(12,2) DEFAULT 0,
      paid_amount DECIMAL(12,2) DEFAULT 0,
      balance_due DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'UNPAID',
      notes TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoices_farmer ON invoices(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_source ON invoices(source_transaction_type, source_transaction_id);

    CREATE TABLE IF NOT EXISTS invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      item_type VARCHAR(50),
      item_name VARCHAR(255) NOT NULL,
      item_name_kn VARCHAR(255),
      quantity DECIMAL(12,2) DEFAULT 1,
      unit VARCHAR(50) DEFAULT 'PCS',
      unit_price DECIMAL(12,2) DEFAULT 0,
      total_price DECIMAL(12,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON invoice_items(invoice_id);

    CREATE TABLE IF NOT EXISTS receipts (
      id SERIAL PRIMARY KEY,
      receipt_number VARCHAR(50) UNIQUE NOT NULL,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      farmer_payment_id INTEGER REFERENCES farmer_payments(id) ON DELETE SET NULL,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
      payment_date VARCHAR(50) NOT NULL,
      previous_balance DECIMAL(12,2) DEFAULT 0,
      payment_amount DECIMAL(12,2) NOT NULL,
      remaining_balance DECIMAL(12,2) DEFAULT 0,
      payment_mode VARCHAR(50) DEFAULT 'CASH',
      transaction_ref VARCHAR(255),
      notes TEXT,
      is_deleted SMALLINT DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
    CREATE INDEX IF NOT EXISTS idx_receipts_farmer ON receipts(farmer_id);
  `;
  await exec(schemaSql, client);
};

export const initSqliteSchema = async () => {
  await exec('PRAGMA foreign_keys = ON;');
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      roles TEXT DEFAULT '["ROLE_USER"]',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      replaced_by_hash TEXT NULL,
      ip_address TEXT,
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON user_refresh_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_refresh_user_id ON user_refresh_tokens(user_id);

    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      father_name TEXT,
      mobile_number TEXT NOT NULL,
      village_name TEXT NOT NULL,
      taluk_name TEXT DEFAULT 'Gangavati',
      district_name TEXT DEFAULT 'Raichur',
      status TEXT DEFAULT 'ACTIVE',
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_farmers_code ON farmers(farmer_code);
    CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(mobile_number);

    CREATE TABLE IF NOT EXISTS farmer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      bill_id INTEGER,
      payment_amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'CASH',
      transaction_ref TEXT,
      remarks TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    );

    CREATE TABLE IF NOT EXISTS machine_owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      alternate_phone TEXT,
      address TEXT,
      bank_name TEXT,
      account_no TEXT,
      ifsc_code TEXT,
      upi_id TEXT,
      village_name TEXT,
      total_machines INTEGER DEFAULT 1,
      advance_paid REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS owner_payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      payout_date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'BANK_TRANSFER',
      bank_ref TEXT,
      notes TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES machine_owners(id)
    );

    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_code TEXT UNIQUE NOT NULL,
      machine_name TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      machine_type TEXT DEFAULT 'HARVESTER',
      owner_type TEXT DEFAULT 'COMPANY_OWNED',
      owner_id INTEGER,
      status TEXT DEFAULT 'AVAILABLE',
      hourly_rate REAL DEFAULT 2400,
      acre_rate REAL DEFAULT 1500,
      engine_hours REAL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      speed REAL DEFAULT 0,
      last_gps_update DATETIME,
      next_service_hours REAL DEFAULT 250,
      service_interval_hours REAL DEFAULT 250,
      service_status TEXT DEFAULT 'OK',
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES machine_owners(id)
    );
    CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(machine_code);

    CREATE TABLE IF NOT EXISTS vehicle_compliance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER,
      registration_number TEXT NOT NULL,
      make_model_description TEXT,
      owner_name TEXT,
      owner_phone TEXT,
      insurance_policy_no TEXT,
      insurance_status TEXT DEFAULT 'VALID',
      insurance_expiry_date TEXT,
      road_tax_receipt_no TEXT,
      road_tax_status TEXT DEFAULT 'VALID',
      road_tax_expiry_date TEXT,
      nc_permit_status_no TEXT,
      nc_permit_status TEXT DEFAULT 'VALID',
      nc_permit_expiry_date TEXT,
      fitness_expiry_date TEXT,
      fitness_status TEXT DEFAULT 'VALID',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS compliance_renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compliance_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      doc_number TEXT NOT NULL,
      new_expiry_date TEXT NOT NULL,
      amount_paid REAL DEFAULT 0,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (compliance_id) REFERENCES vehicle_compliance(id)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'OPERATOR',
      mobile_number TEXT NOT NULL,
      base_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_number TEXT UNIQUE NOT NULL,
      farmer_id INTEGER NOT NULL,
      machine_id INTEGER,
      season_id INTEGER DEFAULT 1,
      booking_date TEXT NOT NULL,
      preferred_work_date TEXT NOT NULL,
      machine_type TEXT DEFAULT 'HARVESTER',
      estimated_acres REAL DEFAULT 5.0,
      estimated_hours REAL DEFAULT 8.0,
      priority TEXT DEFAULT 'NORMAL',
      status TEXT DEFAULT 'CONFIRMED',
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id),
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_number TEXT UNIQUE NOT NULL,
      booking_id INTEGER NOT NULL,
      machine_id INTEGER NOT NULL,
      operator_id INTEGER,
      driver_id INTEGER,
      dispatch_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      start_engine_hours REAL DEFAULT 0,
      end_engine_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'DISPATCHED',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS work_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT UNIQUE NOT NULL,
      work_date TEXT NOT NULL,
      farmer_id INTEGER NOT NULL,
      machine_id INTEGER,
      machine_name TEXT,
      operator_name TEXT,
      village_name TEXT,
      crop_type TEXT,
      start_time TEXT,
      end_time TEXT,
      break_hours REAL DEFAULT 0,
      work_hours REAL DEFAULT 0,
      rate_type TEXT DEFAULT 'HOURLY',
      rate_per_unit REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      advance_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      status TEXT DEFAULT 'UNPAID',
      notes TEXT,
      receipt_image_url TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_number TEXT UNIQUE NOT NULL,
      machine_id INTEGER NOT NULL,
      operator_id INTEGER,
      fuel_station_id INTEGER,
      approved_liters REAL NOT NULL,
      issued_date TEXT NOT NULL,
      status TEXT DEFAULT 'ISSUED',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      log_date_time DATETIME NOT NULL,
      machine_id INTEGER NOT NULL,
      machine_name TEXT,
      operator_id INTEGER,
      operator_name TEXT,
      hour_meter REAL DEFAULT 0,
      fuel_type TEXT DEFAULT 'Diesel',
      quantity_liters REAL NOT NULL,
      price_per_liter REAL NOT NULL,
      total_cost REAL NOT NULL,
      vendor_station TEXT,
      remarks TEXT,
      receipt_image_url TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS cashbook_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'CASH',
      reference_no TEXT,
      description TEXT,
      receipt_image_url TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS master_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      meta_json TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT DEFAULT 'system',
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spare_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_number TEXT UNIQUE NOT NULL,
      part_name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_of_measure TEXT DEFAULT 'PCS',
      current_stock INTEGER DEFAULT 0,
      minimum_stock_level INTEGER DEFAULT 5,
      unit_cost REAL DEFAULT 0,
      location_rack TEXT DEFAULT 'RACK-A',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_number TEXT UNIQUE NOT NULL,
      machine_id INTEGER NOT NULL,
      breakdown_date TEXT NOT NULL,
      issue_description TEXT,
      status TEXT DEFAULT 'OPEN',
      cost REAL DEFAULT 0,
      receipt_image_url TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      farmer_id INTEGER NOT NULL,
      invoice_date TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'UNPAID',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      pay_period TEXT NOT NULL,
      base_salary REAL DEFAULT 0,
      net_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'DISBURSED',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS machine_telematics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL DEFAULT 0,
      engine_hours REAL DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT DEFAULT 'TELEMATICS_API',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );
    CREATE INDEX IF NOT EXISTS idx_telematics_machine_id ON machine_telematics_history(machine_id);
    CREATE INDEX IF NOT EXISTS idx_telematics_recorded_at ON machine_telematics_history(recorded_at);

    CREATE TABLE IF NOT EXISTS document_sequences (
      sequence_key TEXT PRIMARY KEY,
      current_val INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      invoice_type TEXT NOT NULL,
      farmer_id INTEGER NOT NULL,
      source_transaction_type TEXT,
      source_transaction_id INTEGER,
      invoice_date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      status TEXT DEFAULT 'UNPAID',
      notes TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoices_farmer ON invoices(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_source ON invoices(source_transaction_type, source_transaction_id);

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      item_type TEXT,
      item_name TEXT NOT NULL,
      item_name_kn TEXT,
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'PCS',
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON invoice_items(invoice_id);

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT UNIQUE NOT NULL,
      farmer_id INTEGER NOT NULL,
      farmer_payment_id INTEGER,
      invoice_id INTEGER,
      payment_date TEXT NOT NULL,
      previous_balance REAL DEFAULT 0,
      payment_amount REAL NOT NULL,
      remaining_balance REAL DEFAULT 0,
      payment_mode TEXT DEFAULT 'CASH',
      transaction_ref TEXT,
      notes TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
      FOREIGN KEY (farmer_payment_id) REFERENCES farmer_payments(id) ON DELETE SET NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);
    CREATE INDEX IF NOT EXISTS idx_receipts_farmer ON receipts(farmer_id);
  `;
  await exec(schema);
};

async function ensureWorkEntriesColumns() {
  const newCols = [
    { name: 'start_time', typePg: 'VARCHAR(50)', typeSqlite: 'TEXT' },
    { name: 'end_time', typePg: 'VARCHAR(50)', typeSqlite: 'TEXT' },
    { name: 'break_hours', typePg: 'DECIMAL(12,2) DEFAULT 0', typeSqlite: 'REAL DEFAULT 0' },
    { name: 'rate_type', typePg: "VARCHAR(50) DEFAULT 'HOURLY'", typeSqlite: "TEXT DEFAULT 'HOURLY'" },
  ];

  for (const col of newCols) {
    try {
      if (isPostgres) {
        await exec(`ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS ${col.name} ${col.typePg}`);
      } else {
        const tableInfo = await query("PRAGMA table_info('work_entries')");
        const exists = tableInfo.some((c) => c.name === col.name);
        if (!exists) {
          await exec(`ALTER TABLE work_entries ADD COLUMN ${col.name} ${col.typeSqlite}`);
        }
      }
    } catch (e) {
      // Column may already exist
    }
  }
}

// Primary Initialization Routine
export const initDb = async () => {
  if (isPostgres) {
    if (!pgPool) {
      throw new Error('PostgreSQL connection pool is not initialized.');
    }
    try {
      const client = await pgPool.connect();
      client.release();
    } catch (connErr) {
      console.error('❌ PostgreSQL connection failed:', connErr.message);
      if (isProduction) {
        throw new Error(`Production PostgreSQL connection failed: ${connErr.message}`);
      }
      throw connErr;
    }
    console.log('⚡ Active Database Engine: PostgreSQL');
    console.log(`⚡ Environment: ${nodeEnv}`);
    await initPgSchema();
    await ensureWorkEntriesColumns();
    const adminUser = await get('SELECT * FROM users WHERE username = $1', ['admin']);
    if (!adminUser) {
      const defaultHash = await bcrypt.hash('Admin@123', 10);
      await run(
        `INSERT INTO users (username, password_hash, full_name, email, roles) VALUES ($1, $2, $3, $4, $5)`,
        ['admin', defaultHash, 'System Administrator', 'admin@agribos.com', JSON.stringify(['ROLE_ADMIN'])]
      );
    }
    console.log('✅ PostgreSQL Database initialized successfully with complete ERP schema.');
  } else {
    console.log('⚡ Active Database Engine: SQLite');
    console.log(`⚡ Environment: ${nodeEnv}`);
    await initSqliteSchema();
    await ensureWorkEntriesColumns();
    const adminUser = await get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      const defaultHash = await bcrypt.hash('Admin@123', 10);
      await run(
        `INSERT INTO users (username, password_hash, full_name, email, roles) VALUES (?, ?, ?, ?, ?)`,
        ['admin', defaultHash, 'System Administrator', 'admin@agribos.com', JSON.stringify(['ROLE_ADMIN'])]
      );
    }
    console.log('✅ SQLite Database initialized successfully with complete ERP schema.');
  }
};


export const getPgPool = () => pgPool;
export const getSqliteDb = () => sqliteDb;
export const checkIsPostgres = () => isPostgres;

export default {
  query,
  get,
  run,
  exec,
  runInTransaction,
  initDb,
  isPostgres: checkIsPostgres,
};
