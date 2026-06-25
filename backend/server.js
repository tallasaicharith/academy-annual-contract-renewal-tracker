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

// ─── Start Server ───────────────────────────────────────────────────────────
async function startServer() {
  try {
    console.log('Initializing database...');
    await db.initDatabase();
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
