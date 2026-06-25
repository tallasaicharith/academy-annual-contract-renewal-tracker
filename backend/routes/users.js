const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/init');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Helper: Sanitize user object
function sanitizeUser(user) {
  if (!user) return user;
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
}

// Automatically parse 'id' route parameter to an integer to prevent SQLite foreign key type mismatch
router.param('id', (req, res, next, id) => {
  const parsed = parseInt(id, 10);
  if (!isNaN(parsed)) {
    req.params.id = parsed;
  }
  next();
});

// ─── GET /api/users - List users with assigned contract counts (Admin only) ────
router.get('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.name, u.email, u.role, u.title, u.phone, u.avatar_url, u.is_active, u.created_at,
             COUNT(c.id) as assigned_academies_count
      FROM users u
      LEFT JOIN academy_annual_contract_renewal c ON c.relationship_manager_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    const sanitizedUsers = users.map(sanitizeUser);
    res.json({ users: sanitizedUsers });
  } catch (err) {
    console.error('List users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

// ─── POST /api/users - Create new employee (Admin only) ──────────────────────
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const { username, name, email, password, role, title, phone, avatar_url } = req.body;

    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ error: 'Required fields: username, name, email, password, role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (role !== 'admin' && role !== 'employee') {
      return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'employee'." });
    }

    // Check unique username or email
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
      role,
      title || 'Relationship Manager',
      phone || null,
      avatar_url || null
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      message: 'Employee created successfully.',
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ error: 'Failed to create employee.' });
  }
});

// ─── PUT /api/users/:id - Edit employee / toggle active status (Admin only) ──
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const targetId = req.params.id;
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);

    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const { name, email, role, title, phone, avatar_url, is_active, password } = req.body;

    // Self-Lockout Prevention & Last Admin Lockout check
    const isTargetingSelf = req.user.id === targetId;
    const isDemotingOrDeactivating = 
      (role !== undefined && role !== 'admin' && existing.role === 'admin') || 
      (is_active !== undefined && parseInt(is_active) === 0 && existing.is_active === 1);

    if (isDemotingOrDeactivating) {
      if (isTargetingSelf) {
        return res.status(400).json({ error: 'Self-lockout prevention: You cannot demote yourself or deactivate your own account.' });
      }

      // Check if this is the last remaining active admin
      const activeAdminsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1").get().count;
      if (activeAdminsCount <= 1 && existing.role === 'admin' && existing.is_active === 1) {
        return res.status(400).json({ error: 'Lockout prevention: At least one active Administrator must exist in the system.' });
      }
    }

    // Build update parameters dynamically
    const updatedFields = {
      name: name !== undefined ? name : existing.name,
      email: email !== undefined ? email : existing.email,
      role: role !== undefined ? role : existing.role,
      title: title !== undefined ? title : existing.title,
      phone: phone !== undefined ? phone : existing.phone,
      avatar_url: avatar_url !== undefined ? avatar_url : existing.avatar_url,
      is_active: is_active !== undefined ? parseInt(is_active) : existing.is_active
    };

    let updateQuery = `
      UPDATE users 
      SET name = ?, email = ?, role = ?, title = ?, phone = ?, avatar_url = ?, is_active = ?
    `;
    const queryParams = [
      updatedFields.name,
      updatedFields.email,
      updatedFields.role,
      updatedFields.title,
      updatedFields.phone,
      updatedFields.avatar_url,
      updatedFields.is_active
    ];

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      const hashedPassword = bcrypt.hashSync(password, 10);
      updateQuery += ', password = ?';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(targetId);

    db.prepare(updateQuery).run(...queryParams);

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    res.json({
      message: 'Employee updated successfully.',
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ error: 'Failed to update employee.' });
  }
});

module.exports = router;
