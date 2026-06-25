const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// Helper: Sanitize user object (delete password)
function sanitizeUser(user) {
  if (!user) return user;
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
}

// ─── POST /api/auth/signup (Admin only/Self registration if allowed) ─────────
router.post('/signup', (req, res) => {
  try {
    const { username, name, email, password, role, title, phone, avatar_url } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'Username, name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, name, email, password, role, title, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      username,
      name,
      email,
      hashedPassword,
      role || 'employee',
      title || 'Relationship Manager',
      phone || null,
      avatar_url || null
    );

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginKey = email || username;

    if (!loginKey || !password) {
      return res.status(400).json({ error: 'Credentials and password are required.' });
    }

    // Search by username or email
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(loginKey, loginKey);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_active === 0) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact an administrator.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Failed to login.' });
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.is_active === 0) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: 'Failed to get user info.' });
  }
});

module.exports = router;
