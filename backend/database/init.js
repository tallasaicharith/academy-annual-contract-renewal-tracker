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

  _normalizeParams(args) {
    if (args.length === 0) return undefined;
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
      const obj = {};
      for (const [key, value] of Object.entries(args[0])) {
        const k = (key.startsWith('@') || key.startsWith('$') || key.startsWith(':')) ? key : `@${key}`;
        obj[k] = value === undefined ? null : value;
      }
      return obj;
    }
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
      // Ignore
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
        console.error('DB Transaction failed:', e);
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
    if (this._inTransaction) return;
    const data = this._db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Database Initialization
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

  // DROP old tables first to ensure clean migration structure
  _wrapper.exec(`DROP TABLE IF EXISTS audit_logs`);
  _wrapper.exec(`DROP TABLE IF EXISTS academy_annual_contract_renewal`);
  _wrapper.exec(`DROP TABLE IF EXISTS users`);
  _wrapper.exec(`DROP TABLE IF EXISTS system_config`);
  _wrapper.exec(`DROP TABLE IF EXISTS equipment_categories`);

  // ─── Create Tables ─────────────────────────────────────────────────────

  _wrapper.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'employee')) DEFAULT 'employee',
      avatar_url TEXT,
      title TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      renewal_alert_threshold INTEGER DEFAULT 30,
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
      relationship_manager_id INTEGER NOT NULL,
      renewal_date DATE NOT NULL,
      contract_start_date DATE NOT NULL,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active','Expiring Soon','Expired','Renewed','Cancelled')),
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (relationship_manager_id) REFERENCES users(id) ON DELETE RESTRICT
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

  _wrapper.exec(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  _wrapper.exec(`
    CREATE TABLE IF NOT EXISTS equipment_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Seed system configuration
  _wrapper.prepare(`INSERT INTO system_config (key, value) VALUES (?, ?)`).run('default_renewal_alert_threshold', '30');
  _wrapper.prepare(`INSERT INTO system_config (key, value) VALUES (?, ?)`).run('default_price_revision_suggestion', '5.0');

  // Seed equipment categories
  const defaultCategories = [
    'Cricket', 'Football', 'Tennis', 'Badminton', 'Athletics', 
    'Swimming', 'Apparel', 'Footwear', 'Gym Gear', 'Team Kits', 'Nutrition'
  ];
  const catInsert = _wrapper.prepare(`INSERT INTO equipment_categories (name) VALUES (?)`);
  defaultCategories.forEach(cat => catInsert.run(cat));

  // ─── Seed Demo Users (Bcrypt hashed) ───────────────────────────────────

  const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
  const hashedEmployeePassword = bcrypt.hashSync('password', 10);

  // Insert Admin
  const adminId = _wrapper.prepare(`
    INSERT INTO users (username, name, email, password, role, title, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'admin', 
    'Alex Rivers', 
    'admin@oxygensports.com', 
    hashedAdminPassword, 
    'admin', 
    'Lead Administrator', 
    '+91 99999 99999', 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80'
  ).lastInsertRowid;

  // Insert Sarah
  const sarahId = _wrapper.prepare(`
    INSERT INTO users (username, name, email, password, role, title, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sarah.jenkins', 
    'Sarah Jenkins', 
    'sarah.jenkins@oxygensports.com', 
    hashedEmployeePassword, 
    'employee', 
    'Relationship Manager', 
    '+91 88888 88888', 
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80'
  ).lastInsertRowid;

  // Insert Marcus
  const marcusId = _wrapper.prepare(`
    INSERT INTO users (username, name, email, password, role, title, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'marcus.thorne', 
    'Marcus Thorne', 
    'marcus.thorne@oxygensports.com', 
    hashedEmployeePassword, 
    'employee', 
    'Relationship Manager', 
    '+91 77777 77777', 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80'
  ).lastInsertRowid;

  console.log('  ✅ Seed users created (Admin + 2 Employees with hashed passwords)');

  // ─── Seed 15 Contracts (Distributed) ───────────────────────────────────

  const seedContracts = [
    {
      academy_name: 'Pinnacle Athletics',
      equipment_categories: 'Cricket, Football',
      contract_value: 750000,
      price_revision: 5.5,
      relationship_manager_id: sarahId,
      renewal_date: '2026-09-01',
      contract_start_date: '2025-09-01',
      status: 'Active',
      notes: 'Main athletics and training wear contract.',
      created_by: 'admin'
    },
    {
      academy_name: 'Nexus Sports Academy',
      equipment_categories: 'Badminton, Tennis',
      contract_value: 920000,
      price_revision: 6.0,
      relationship_manager_id: marcusId,
      renewal_date: '2026-07-15',
      contract_start_date: '2025-07-15',
      status: 'Expiring Soon',
      notes: 'Premium rackets and tennis court nets supply.',
      created_by: 'admin'
    },
    {
      academy_name: 'Elite Athletes Club',
      equipment_categories: 'Football, Sportswear',
      contract_value: 1200000,
      price_revision: 7.5,
      relationship_manager_id: sarahId,
      renewal_date: '2026-07-02',
      contract_start_date: '2025-07-02',
      status: 'Expiring Soon',
      notes: 'High-value customer. Custom sportswear orders.',
      created_by: 'admin'
    },
    {
      academy_name: 'Star Cricket Academy',
      equipment_categories: 'Cricket',
      contract_value: 1500000,
      price_revision: 4.0,
      relationship_manager_id: marcusId,
      renewal_date: '2026-05-10',
      contract_start_date: '2025-05-10',
      status: 'Expired',
      notes: 'Requires urgent follow-up for cricket bats and leather balls.',
      created_by: 'admin'
    },
    {
      academy_name: 'Apex Junior Cricket Academy',
      equipment_categories: 'Cricket',
      contract_value: 680000,
      price_revision: 3.5,
      relationship_manager_id: sarahId,
      renewal_date: '2026-04-20',
      contract_start_date: '2025-04-20',
      status: 'Expired',
      notes: 'Junior safety kits and protective guards.',
      created_by: 'admin'
    },
    {
      academy_name: 'Global Sports Textile Co.',
      equipment_categories: 'Sportswear',
      contract_value: 450000,
      price_revision: 2.0,
      relationship_manager_id: marcusId,
      renewal_date: '2026-10-01',
      contract_start_date: '2025-10-01',
      status: 'Active',
      notes: 'Apparel fabric and tracksuits.',
      created_by: 'admin'
    },
    {
      academy_name: 'Universal Fitness Equipment',
      equipment_categories: 'Fitness',
      contract_value: 850000,
      price_revision: 5.0,
      relationship_manager_id: sarahId,
      renewal_date: '2027-06-01',
      contract_start_date: '2026-06-01',
      status: 'Renewed',
      notes: 'Strength equipment and treadmills. Successfully renewed.',
      created_by: 'admin'
    },
    {
      academy_name: 'Elite Performance Apparel Ltd.',
      equipment_categories: 'Sportswear',
      contract_value: 1100000,
      price_revision: 0,
      relationship_manager_id: marcusId,
      renewal_date: '2026-08-15',
      contract_start_date: '2025-08-15',
      status: 'Cancelled',
      notes: 'Contract terminated by mutually agreed terms.',
      created_by: 'admin'
    },
    {
      academy_name: 'Mumbai Cricket Academy',
      equipment_categories: 'Cricket',
      contract_value: 850000,
      price_revision: 5.5,
      relationship_manager_id: sarahId,
      renewal_date: '2026-11-15',
      contract_start_date: '2025-11-15',
      status: 'Active',
      notes: 'Standard bats, balls, and protective gear supply.',
      created_by: 'admin'
    },
    {
      academy_name: 'Bangalore Football Club Academy',
      equipment_categories: 'Football',
      contract_value: 620000,
      price_revision: 3.0,
      relationship_manager_id: marcusId,
      renewal_date: '2026-12-01',
      contract_start_date: '2025-12-01',
      status: 'Active',
      notes: 'Biannual delivery of soccer balls and training cones.',
      created_by: 'admin'
    },
    {
      academy_name: 'Hyderabad Badminton Center',
      equipment_categories: 'Badminton',
      contract_value: 430000,
      price_revision: 2.5,
      relationship_manager_id: sarahId,
      renewal_date: '2026-10-10',
      contract_start_date: '2025-10-10',
      status: 'Active',
      notes: 'Nylon and feather shuttles contract.',
      created_by: 'admin'
    },
    {
      academy_name: 'Chennai Athletics Training Institute',
      equipment_categories: 'Athletics',
      contract_value: 540000,
      price_revision: 4.0,
      relationship_manager_id: marcusId,
      renewal_date: '2026-09-28',
      contract_start_date: '2025-09-28',
      status: 'Active',
      notes: 'Training hurdles, stopwatches and relays.',
      created_by: 'admin'
    },
    {
      academy_name: 'Delhi Tennis Academy',
      equipment_categories: 'Tennis',
      contract_value: 780000,
      price_revision: 6.0,
      relationship_manager_id: sarahId,
      renewal_date: '2026-10-05',
      contract_start_date: '2025-10-05',
      status: 'Active',
      notes: 'Championship tennis balls and practice machines.',
      created_by: 'admin'
    },
    {
      academy_name: 'Pune Swimming Academy',
      equipment_categories: 'Swimming',
      contract_value: 350000,
      price_revision: 2.0,
      relationship_manager_id: marcusId,
      renewal_date: '2026-09-10',
      contract_start_date: '2025-09-10',
      status: 'Active',
      notes: 'Swimming goggles, caps, and kickboards.',
      created_by: 'admin'
    },
    {
      academy_name: 'Kolkata Hockey Academy',
      equipment_categories: 'Hockey',
      contract_value: 490000,
      price_revision: 3.5,
      relationship_manager_id: sarahId,
      renewal_date: '2026-08-15',
      contract_start_date: '2025-08-15',
      status: 'Active',
      notes: 'Composite hockey sticks and goalkeeper suits.',
      created_by: 'admin'
    }
  ];

  const insertSql = `
    INSERT INTO academy_annual_contract_renewal 
      (academy_name, equipment_categories, contract_value, price_revision, relationship_manager_id, renewal_date, contract_start_date, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const auditSql = `INSERT INTO audit_logs (contract_renewal_id, action, changed_by) VALUES (?, 'CREATE', 'admin')`;

  const seedAll = _wrapper.transaction(() => {
    for (const c of seedContracts) {
      const result = _wrapper.prepare(insertSql).run(
        c.academy_name, c.equipment_categories, c.contract_value, c.price_revision,
        c.relationship_manager_id, c.renewal_date, c.contract_start_date, c.status,
        c.notes, c.created_by
      );
      _wrapper.prepare(auditSql).run(result.lastInsertRowid);
    }
  });

  seedAll();
  console.log('  ✅ 15 seed contracts inserted under respective employees with audit logs');
  console.log('  ✅ Database schema successfully migrated and initialized');
  return _wrapper;
}

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
