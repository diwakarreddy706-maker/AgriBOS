import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(path.resolve('data'), 'agribos.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Could not connect to SQLite database:', err);
  } else {
    console.log('⚡ Connected to SQLite database at:', dbPath);
  }
});

// Helper for running SQL statements (INSERT, UPDATE, DELETE)
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Helper for fetching a single row
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

// Helper for fetching multiple rows
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Helper for executing raw SQL (schema initialization)
export const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Transaction Helpers
export const beginTransaction = () => run('BEGIN TRANSACTION');
export const commitTransaction = () => run('COMMIT');
export const rollbackTransaction = () => run('ROLLBACK');

export const runInTransaction = async (callback) => {
  await beginTransaction();
  try {
    const result = await callback();
    await commitTransaction();
    return result;
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
};

// Database Initialization
export const initDb = async () => {
  await exec('PRAGMA foreign_keys = ON;');
  const schema = `
    -- Users Table
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

    -- Farmers Table
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

    -- Farmer Payments Table
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

    -- Machine Owners Table
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

    -- Owner Payouts Table
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

    -- Machines Table
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
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES machine_owners(id)
    );
    CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(machine_code);

    -- Vehicle Compliance Table
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

    -- Compliance Renewals Table
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

    -- Employees Table
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

    -- Bookings Table
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

    -- Dispatches Table
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

    -- Work Entries Table
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
      work_hours REAL DEFAULT 0,
      rate_per_unit REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      advance_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      status TEXT DEFAULT 'UNPAID',
      notes TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    );

    -- Fuel Vouchers Table
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

    -- Fuel Logs Table
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
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    -- Cashbook Entries Table
    CREATE TABLE IF NOT EXISTS cashbook_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      entry_type TEXT NOT NULL, -- INFLOW or OUTFLOW
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'CASH',
      reference_no TEXT,
      description TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Master Data Table
    CREATE TABLE IF NOT EXISTS master_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL, -- VILLAGE, CROP, FUEL_STATION, EXPENSE_CATEGORY
      name TEXT NOT NULL,
      code TEXT,
      meta_json TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Logs Table
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

    -- Spare Parts Table
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

    -- Maintenance Jobs Table
    CREATE TABLE IF NOT EXISTS maintenance_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_number TEXT UNIQUE NOT NULL,
      machine_id INTEGER NOT NULL,
      breakdown_date TEXT NOT NULL,
      issue_description TEXT,
      status TEXT DEFAULT 'OPEN',
      cost REAL DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customer Invoices Table
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

    -- Payroll Entries Table
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

    -- Machine Telematics History Table
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
  `;

  await exec(schema);

  // Dynamic Column Migration Checks for Existing Database Files
  const machineCols = await query("PRAGMA table_info(machines)");
  const machineColNames = machineCols.map(c => c.name);
  if (!machineColNames.includes('owner_id')) {
    await exec("ALTER TABLE machines ADD COLUMN owner_id INTEGER");
  }
  if (!machineColNames.includes('owner_type')) {
    await exec("ALTER TABLE machines ADD COLUMN owner_type TEXT DEFAULT 'COMPANY_OWNED'");
  }
  if (!machineColNames.includes('hourly_rate')) {
    await exec("ALTER TABLE machines ADD COLUMN hourly_rate REAL DEFAULT 2400");
  }
  if (!machineColNames.includes('acre_rate')) {
    await exec("ALTER TABLE machines ADD COLUMN acre_rate REAL DEFAULT 1500");
  }
  if (!machineColNames.includes('engine_hours')) {
    await exec("ALTER TABLE machines ADD COLUMN engine_hours REAL DEFAULT 0");
  }
  if (!machineColNames.includes('is_deleted')) {
    await exec("ALTER TABLE machines ADD COLUMN is_deleted INTEGER DEFAULT 0");
  }
  if (!machineColNames.includes('latitude')) {
    await exec("ALTER TABLE machines ADD COLUMN latitude REAL");
  }
  if (!machineColNames.includes('longitude')) {
    await exec("ALTER TABLE machines ADD COLUMN longitude REAL");
  }
  if (!machineColNames.includes('speed')) {
    await exec("ALTER TABLE machines ADD COLUMN speed REAL DEFAULT 0");
  }
  if (!machineColNames.includes('last_gps_update')) {
    await exec("ALTER TABLE machines ADD COLUMN last_gps_update DATETIME");
  }
  if (!machineColNames.includes('next_service_hours')) {
    await exec("ALTER TABLE machines ADD COLUMN next_service_hours REAL DEFAULT 250");
  }
  if (!machineColNames.includes('service_interval_hours')) {
    await exec("ALTER TABLE machines ADD COLUMN service_interval_hours REAL DEFAULT 250");
  }
  if (!machineColNames.includes('service_status')) {
    await exec("ALTER TABLE machines ADD COLUMN service_status TEXT DEFAULT 'OK'");
  }

  // Receipt Image URL Column Checks for Expenses
  const fuelCols = await query("PRAGMA table_info(fuel_logs)");
  if (!fuelCols.map(c => c.name).includes('receipt_image_url')) {
    await exec("ALTER TABLE fuel_logs ADD COLUMN receipt_image_url TEXT");
  }

  const maintCols = await query("PRAGMA table_info(maintenance_jobs)");
  if (!maintCols.map(c => c.name).includes('receipt_image_url')) {
    await exec("ALTER TABLE maintenance_jobs ADD COLUMN receipt_image_url TEXT");
  }

  const cashbookCols = await query("PRAGMA table_info(cashbook_entries)");
  if (!cashbookCols.map(c => c.name).includes('receipt_image_url')) {
    await exec("ALTER TABLE cashbook_entries ADD COLUMN receipt_image_url TEXT");
  }

  const workCols = await query("PRAGMA table_info(work_entries)");
  if (!workCols.map(c => c.name).includes('machine_id')) {
    await exec("ALTER TABLE work_entries ADD COLUMN machine_id INTEGER");
  }

  const ownerCols = await query("PRAGMA table_info(machine_owners)");
  const ownerNames = ownerCols.map(c => c.name);
  if (!ownerNames.includes('alternate_phone')) await exec("ALTER TABLE machine_owners ADD COLUMN alternate_phone TEXT");
  if (!ownerNames.includes('address')) await exec("ALTER TABLE machine_owners ADD COLUMN address TEXT");
  if (!ownerNames.includes('bank_name')) await exec("ALTER TABLE machine_owners ADD COLUMN bank_name TEXT");
  if (!ownerNames.includes('account_no')) await exec("ALTER TABLE machine_owners ADD COLUMN account_no TEXT");
  if (!ownerNames.includes('ifsc_code')) await exec("ALTER TABLE machine_owners ADD COLUMN ifsc_code TEXT");
  if (!ownerNames.includes('upi_id')) await exec("ALTER TABLE machine_owners ADD COLUMN upi_id TEXT");
  if (!ownerNames.includes('village_name')) await exec("ALTER TABLE machine_owners ADD COLUMN village_name TEXT");

  // Seed default Admin User if not present
  const adminUser = await get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!adminUser) {
    const defaultHash = await bcrypt.hash('Admin@123', 10);
    await run(
      `INSERT INTO users (username, password_hash, full_name, email, roles) VALUES (?, ?, ?, ?, ?)`,
      ['admin', defaultHash, 'System Administrator', 'admin@agribos.com', JSON.stringify(['ROLE_ADMIN'])]
    );
  }

  console.log('✅ SQLite Database initialized successfully with complete ERP schema at:', dbPath);
};

export default {
  run,
  get,
  query,
};
