const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Case Translation Helpers & Middleware ──────────────────────────────────
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function mapKeys(obj, fn) {
  if (Array.isArray(obj)) {
    return obj.map(item => mapKeys(item, fn));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const val = obj[key];
      const newKey = fn(key);
      acc[newKey] = (val !== null && typeof val === 'object' && !(val instanceof Date)) ? mapKeys(val, fn) : val;
      return acc;
    }, {});
  }
  return obj;
}

// Convert all incoming request body and query parameters from camelCase to snake_case
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = mapKeys(req.body, camelToSnake);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = mapKeys(req.query, camelToSnake);
  }
  next();
});

// Intercept res.json to automatically convert outgoing keys from snake_case to camelCase
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object') {
      body = mapKeys(body, snakeToCamel);
    }
    return originalJson.call(this, body);
  };
  next();
});

// Automatically parse any route parameter named 'id' to an integer to prevent SQLite foreign key type mismatch
app.param('id', (req, res, next, id) => {
  const parsed = parseInt(id, 10);
  if (!isNaN(parsed)) {
    req.params.id = parsed;
  }
  next();
});

// ─── Request Logger ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ─── Initialize Database ───────────────────────────────────────────────────
const db = require('./database/init');

// ─── Routes ─────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Academy Annual Contract Renewal Tracker API is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ─── Root Route ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Academy Annual Contract Renewal Tracker API',
    version: '1.0.0',
    organization: 'Oxygen Sports',
    endpoints: {
      auth: '/api/auth',
      contracts: '/api/contracts',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      health: '/api/health'
    }
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found.` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Automated Scheduled Job for Alert Tracking ───────────────────────────
function runScheduledAlertChecks() {
  try {
    const database = require('./database/init');
    
    // Fetch all contracts and their managers
    const contracts = database.prepare(`
      SELECT c.*, u.name AS manager_name, u.email AS manager_email, u.renewal_alert_threshold AS manager_threshold
      FROM academy_annual_contract_renewal c
      JOIN users u ON c.relationship_manager_id = u.id
      WHERE c.status NOT IN ('Renewed', 'Cancelled')
    `).all();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const auditInsert = database.prepare(`
      INSERT INTO audit_logs (contract_renewal_id, action, description, changed_by)
      VALUES (?, 'NOTIFICATION_SENT', ?, 'system')
    `);

    const checkLogExists = database.prepare(`
      SELECT id FROM audit_logs 
      WHERE contract_renewal_id = ? AND action = 'NOTIFICATION_SENT' AND created_at > date('now', '-30 days')
    `);

    const runChecks = database.transaction(() => {
      for (const contract of contracts) {
        const renewal = new Date(contract.renewal_date);
        renewal.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert threshold: manager's override or system default
        const alertThreshold = contract.manager_threshold || 30;

        if (diffDays > 0 && diffDays <= alertThreshold) {
          // If within threshold, check if alert was already sent in last 30 days
          const alreadySent = checkLogExists.get(contract.id);
          if (!alreadySent) {
            const desc = `Automated renewal alert email notification sent to ${contract.manager_name} (${contract.manager_email})`;
            auditInsert.run(contract.id, desc);
            console.log(`[SCHEDULED JOB] Dispatched automated renewal alert for contract ID ${contract.id} (${contract.academy_name})`);
          }
        }
      }
    });

    runChecks();
  } catch (err) {
    console.error('[SCHEDULED JOB ERROR]', err.message);
  }
}

// ─── Start Server ───────────────────────────────────────────────────────────
async function startServer() {
  try {
    console.log('Initializing database...');
    await db.initDatabase();
    
    // Run alert checks immediately on startup and then every 60 seconds
    runScheduledAlertChecks();
    setInterval(runScheduledAlertChecks, 60000);

    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  Academy Annual Contract Renewal Tracker API');
      console.log('  Oxygen Sports');
      console.log(`  Server running on http://localhost:${PORT}`);
      console.log('═══════════════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
