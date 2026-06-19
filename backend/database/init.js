const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'tracker.db');
let _wrapper = null;

// ═══════════════════════════════════════════════════════════════════════════
// SQLite Wrapper — provides a better-sqlite3-compatible synchronous API
// on top of sql.js (pure JS SQLite compiled to WebAssembly)
// ═══════════════════════════════════════════════════════════════════════════

class PreparedStatement {
  constructor(sqlDb, sql, wrapper) {
    this._sqlDb = sqlDb;
    this._sql = sql;
    this._wrapper = wrapper;
  }

  // Normalize arguments for sql.js: handle positional (?), named (@key), and spread args
  _normalizeParams(args) {
    if (args.length === 0) return undefined;
    // Single object argument → named parameters (add @ prefix for sql.js)
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
      const obj = {};
      for (const [key, value] of Object.entries(args[0])) {
        const k = (key.startsWith('@') || key.startsWith('$') || key.startsWith(':')) ? key : `@${key}`;
        obj[k] = value === undefined ? null : value;
      }
      return obj;
    }
    // Multiple args → positional parameters as array
    return args.map(v => (v === undefined ? null : v));
  }

  run(...args) {
    const params = this._normalizeParams(args);
    console.log(`[DB RUN] SQL: ${this._sql.trim().replace(/\s+/g, ' ')} | Params:`, params);
    if (params !== undefined) {
      this._sqlDb.run(this._sql, params);
    } else {
      this._sqlDb.run(this._sql);
    }
    const changes = this._sqlDb.getRowsModified();
    const lastResult = this._sqlDb.exec('SELECT last_insert_rowid()');
    const lastInsertRowid = lastResult.length > 0 ? lastResult[0].values[0][0] : 0;
    this._wrapper._save();
    return { changes, lastInsertRowid };
  }

  get(...args) {
    const params = this._normalizeParams(args);
    let stmt;
    try {
      stmt = this._sqlDb.prepare(this._sql);
      if (params !== undefined) stmt.bind(params);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return undefined;
    } finally {
      if (stmt) stmt.free();
    }
  }

  all(...args) {
    const params = this._normalizeParams(args);
    let stmt;
    try {
      stmt = this._sqlDb.prepare(this._sql);
      if (params !== undefined) stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      if (stmt) stmt.free();
    }
  }
}

class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
    this._inTransaction = false;
  }

  prepare(sql) {
    return new PreparedStatement(this._db, sql, this);
  }

  exec(sql) {
    console.log(`[DB EXEC] SQL: ${sql.trim().replace(/\s+/g, ' ')}`);
    this._db.exec(sql);
    this._save();
  }

  pragma(str) {
    try {
      this._db.run(`PRAGMA ${str}`);
    } catch (e) {
      // Some pragmas are not supported in sql.js — ignore silently
    }
  }

  transaction(fn) {
    const self = this;
    return function (...args) {
      console.log('[DB TRANSACTION] BEGIN');
      self._db.run('BEGIN TRANSACTION');
      self._inTransaction = true;
      try {
        const result = fn(...args);
        console.log('[DB TRANSACTION] COMMIT');
        self._db.run('COMMIT');
        self._inTransaction = false;
        self._save();
        return result;
      } catch (e) {
        console.error('DB Transaction failed with original error:', e);
        try {
          console.log('[DB TRANSACTION] ROLLBACK');
          self._db.run('ROLLBACK');
        } catch (rollbackErr) {
          console.error('Rollback failed:', rollbackErr.message);
        }
        self._inTransaction = false;
        throw e;
      }
    };
  }

  _save() {
    console.log(`[DB SAVE] Checking save. inTransaction: ${this._inTransaction}`);
    if (this._inTransaction) return;
    console.log('[DB SAVE] Exporting database and writing to disk...');
    const data = this._db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Database Initialization (async — called once at server startup)
// ═══════════════════════════════════════════════════════════════════════════

async function initDatabase() {
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  _wrapper = new DatabaseWrapper(sqlDb);

  // Enable foreign keys
  _wrapper.pragma('foreign_keys = ON');

  // ─── Create Tables ─────────────────────────────────────────────────────

  _wrapper.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  _wrapper.exec(`
    CREATE TABLE IF NOT EXISTS academy_annual_contract_renewal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academy_name TEXT NOT NULL,
      equipment_categories TEXT NOT NULL,
      contract_value REAL NOT NULL,
      price_revision REAL DEFAULT 0,
      relationship_manager TEXT NOT NULL,
      renewal_date DATE NOT NULL,
      contract_start_date DATE NOT NULL,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active','Expiring Soon','Expired','Renewed','Cancelled')),
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  _wrapper.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_renewal_id INTEGER,
      action TEXT NOT NULL,
      field_changed TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_renewal_id) REFERENCES academy_annual_contract_renewal(id) ON DELETE CASCADE
    )
  `);

  // ─── Seed Default Admin User ───────────────────────────────────────────

  const existingAdmin = _wrapper.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    _wrapper.prepare(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
    ).run('admin', 'admin@oxygensports.com', hashedPassword, 'admin');
    console.log('  ✅ Default admin user created (admin / admin123)');
  }

  // ─── Seed 15 Realistic Contracts ───────────────────────────────────────

  const existingContracts = _wrapper.prepare('SELECT COUNT(*) as count FROM academy_annual_contract_renewal').get();
  if (existingContracts.count === 0) {
    const seedContracts = [
      // EXPIRED contracts (renewal_date in the past)
      {
        academy_name: 'Mumbai Cricket Academy',
        equipment_categories: 'Cricket',
        contract_value: 850000,
        price_revision: 5.5,
        relationship_manager: 'Rajesh Sharma',
        renewal_date: '2026-03-15',
        contract_start_date: '2025-03-15',
        status: 'Expired',
        notes: 'Long-standing partner. Needs follow-up for renewal.',
        created_by: 'admin'
      },
      {
        academy_name: 'Bangalore Football Club Academy',
        equipment_categories: 'Football',
        contract_value: 620000,
        price_revision: 3.0,
        relationship_manager: 'Priya Nair',
        renewal_date: '2026-05-01',
        contract_start_date: '2025-05-01',
        status: 'Expired',
        notes: 'Contract lapsed. Awaiting management decision.',
        created_by: 'admin'
      },
      {
        academy_name: 'Hyderabad Badminton Center',
        equipment_categories: 'Badminton',
        contract_value: 430000,
        price_revision: 2.5,
        relationship_manager: 'Suresh Reddy',
        renewal_date: '2026-04-10',
        contract_start_date: '2025-04-10',
        status: 'Expired',
        notes: 'Shuttle and racket supply contract expired.',
        created_by: 'admin'
      },
      // EXPIRING SOON contracts (within 30 days from today: ~2026-06-18)
      {
        academy_name: 'Chennai Athletics Training Institute',
        equipment_categories: 'Athletics',
        contract_value: 540000,
        price_revision: 4.0,
        relationship_manager: 'Anand Kumar',
        renewal_date: '2026-06-28',
        contract_start_date: '2025-06-28',
        status: 'Expiring Soon',
        notes: 'Track and field equipment. Urgent renewal needed.',
        created_by: 'admin'
      },
      {
        academy_name: 'Delhi Tennis Academy',
        equipment_categories: 'Tennis',
        contract_value: 780000,
        price_revision: 6.0,
        relationship_manager: 'Neha Gupta',
        renewal_date: '2026-07-05',
        contract_start_date: '2025-07-05',
        status: 'Expiring Soon',
        notes: 'Premium rackets and ball machine contract.',
        created_by: 'admin'
      },
      {
        academy_name: 'Pune Swimming Academy',
        equipment_categories: 'Swimming',
        contract_value: 350000,
        price_revision: 2.0,
        relationship_manager: 'Vikram Joshi',
        renewal_date: '2026-07-10',
        contract_start_date: '2025-07-10',
        status: 'Expiring Soon',
        notes: 'Pool equipment and swimwear supply.',
        created_by: 'admin'
      },
      {
        academy_name: 'Kolkata Hockey Academy',
        equipment_categories: 'Hockey',
        contract_value: 490000,
        price_revision: 3.5,
        relationship_manager: 'Amit Das',
        renewal_date: '2026-07-15',
        contract_start_date: '2025-07-15',
        status: 'Expiring Soon',
        notes: 'Hockey sticks and protective gear. Renewal discussion ongoing.',
        created_by: 'admin'
      },
      // ACTIVE contracts (renewal_date > 90 days from today)
      {
        academy_name: 'Jaipur Cricket & Sports Club',
        equipment_categories: 'Cricket, Football',
        contract_value: 1200000,
        price_revision: 7.0,
        relationship_manager: 'Rajesh Sharma',
        renewal_date: '2027-01-15',
        contract_start_date: '2026-01-15',
        status: 'Active',
        notes: 'Multi-sport equipment contract. High value client.',
        created_by: 'admin'
      },
      {
        academy_name: 'Ahmedabad Table Tennis Center',
        equipment_categories: 'Table Tennis',
        contract_value: 280000,
        price_revision: 1.5,
        relationship_manager: 'Priya Nair',
        renewal_date: '2027-03-20',
        contract_start_date: '2026-03-20',
        status: 'Active',
        notes: 'Tables, nets, and paddle supply agreement.',
        created_by: 'admin'
      },
      {
        academy_name: 'Lucknow Boxing Academy',
        equipment_categories: 'Boxing',
        contract_value: 390000,
        price_revision: 4.5,
        relationship_manager: 'Suresh Reddy',
        renewal_date: '2027-02-10',
        contract_start_date: '2026-02-10',
        status: 'Active',
        notes: 'Gloves, bags, and ring equipment.',
        created_by: 'admin'
      },
      {
        academy_name: 'Chandigarh Basketball Academy',
        equipment_categories: 'Basketball',
        contract_value: 560000,
        price_revision: 3.0,
        relationship_manager: 'Anand Kumar',
        renewal_date: '2026-12-01',
        contract_start_date: '2025-12-01',
        status: 'Active',
        notes: 'Basketballs, hoops, and court accessories.',
        created_by: 'admin'
      },
      {
        academy_name: 'Goa Volleyball & Beach Sports',
        equipment_categories: 'Volleyball, Athletics',
        contract_value: 420000,
        price_revision: 2.5,
        relationship_manager: 'Neha Gupta',
        renewal_date: '2027-04-25',
        contract_start_date: '2026-04-25',
        status: 'Active',
        notes: 'Beach sports and volleyball equipment.',
        created_by: 'admin'
      },
      // RENEWED contract
      {
        academy_name: 'Indore Gymnastics Academy',
        equipment_categories: 'Gymnastics',
        contract_value: 670000,
        price_revision: 5.0,
        relationship_manager: 'Vikram Joshi',
        renewal_date: '2027-06-18',
        contract_start_date: '2026-06-18',
        status: 'Renewed',
        notes: 'Successfully renewed for another year. Mats and apparatus.',
        created_by: 'admin'
      },
      // CANCELLED contract
      {
        academy_name: 'Bhopal Archery Range',
        equipment_categories: 'Archery',
        contract_value: 310000,
        price_revision: 0,
        relationship_manager: 'Amit Das',
        renewal_date: '2026-08-30',
        contract_start_date: '2025-08-30',
        status: 'Cancelled',
        notes: 'Academy closed operations. Contract cancelled.',
        created_by: 'admin'
      },
      // Another ACTIVE with far future date
      {
        academy_name: 'Nagpur Multi-Sport Complex',
        equipment_categories: 'Cricket, Football, Badminton, Athletics',
        contract_value: 1850000,
        price_revision: 8.0,
        relationship_manager: 'Rajesh Sharma',
        renewal_date: '2027-05-30',
        contract_start_date: '2026-05-30',
        status: 'Active',
        notes: 'Largest multi-sport contract. Flagship account.',
        created_by: 'admin'
      }
    ];

    const insertSql = `
      INSERT INTO academy_annual_contract_renewal 
        (academy_name, equipment_categories, contract_value, price_revision, relationship_manager, renewal_date, contract_start_date, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const auditSql = `INSERT INTO audit_logs (contract_renewal_id, action, changed_by) VALUES (?, 'CREATE', 'admin')`;

    const seedAll = _wrapper.transaction(() => {
      for (const c of seedContracts) {
        const result = _wrapper.prepare(insertSql).run(
          c.academy_name, c.equipment_categories, c.contract_value, c.price_revision,
          c.relationship_manager, c.renewal_date, c.contract_start_date, c.status,
          c.notes, c.created_by
        );
        _wrapper.prepare(auditSql).run(result.lastInsertRowid);
      }
    });

    seedAll();
    console.log('  ✅ 15 seed contracts inserted with audit logs');
  }

  console.log('  ✅ Database initialized successfully');
  return _wrapper;
}

// ─── Getter (used by routes after init) ──────────────────────────────────

function getDb() {
  if (!_wrapper) throw new Error('Database not initialized. Call initDatabase() first.');
  return _wrapper;
}

const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'initDatabase') return initDatabase;
    if (prop === 'getDb') return getDb;
    const db = getDb();
    const val = db[prop];
    if (typeof val === 'function') {
      return val.bind(db);
    }
    return val;
  },
  set(target, prop, val) {
    getDb()[prop] = val;
    return true;
  }
});

module.exports = dbProxy;
