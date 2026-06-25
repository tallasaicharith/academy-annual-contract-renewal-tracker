const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/init');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ─── GET /api/settings - Fetch user & system settings ───────────────────────
router.get('/', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT renewal_alert_threshold FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const configs = db.prepare('SELECT * FROM system_config').all();
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });

    const response = {
      renewalAlertThreshold: user.renewal_alert_threshold
    };

    if (req.user.role === 'admin') {
      response.defaultRenewalAlertThreshold = parseInt(configMap.default_renewal_alert_threshold || '30', 10);
      response.defaultPriceRevisionSuggestion = parseFloat(configMap.default_price_revision_suggestion || '5.0');
    }

    res.json(response);
  } catch (err) {
    console.error('Fetch settings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// ─── PUT /api/settings/profile - Update user profile ────────────────────────
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, phone, avatar_url, renewal_alert_threshold } = req.body;

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          avatar_url = COALESCE(?, avatar_url),
          renewal_alert_threshold = COALESCE(?, renewal_alert_threshold)
      WHERE id = ?
    `).run(
      name || null,
      phone || null,
      avatar_url || null,
      renewal_alert_threshold !== undefined ? parseInt(renewal_alert_threshold, 10) : null,
      req.user.id
    );

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    delete updatedUser.password;

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ─── PUT /api/settings/password - Update user password ──────────────────────
router.put('/password', requireAuth, (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isValid = bcrypt.compareSync(current_password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ─── PUT /api/settings/system - Update system config (Admin Only) ───────────
router.put('/system', requireAuth, requireAdmin, (req, res) => {
  try {
    const { default_renewal_alert_threshold, default_price_revision_suggestion } = req.body;

    if (default_renewal_alert_threshold !== undefined) {
      db.prepare('UPDATE system_config SET value = ? WHERE key = ?')
        .run(String(default_renewal_alert_threshold), 'default_renewal_alert_threshold');
    }

    if (default_price_revision_suggestion !== undefined) {
      db.prepare('UPDATE system_config SET value = ? WHERE key = ?')
        .run(String(default_price_revision_suggestion), 'default_price_revision_suggestion');
    }

    res.json({ message: 'System configuration updated successfully.' });
  } catch (err) {
    console.error('Update system config error:', err.message);
    res.status(500).json({ error: 'Failed to update system configuration.' });
  }
});

// ─── GET /api/settings/categories - Fetch categories ────────────────────────
router.get('/categories', requireAuth, (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM equipment_categories ORDER BY name ASC').all();
    res.json({ categories });
  } catch (err) {
    console.error('Fetch categories error:', err.message);
    res.status(500).json({ error: 'Failed to fetch equipment categories.' });
  }
});

// ─── POST /api/settings/categories - Add category (Admin Only) ──────────────
router.post('/categories', requireAuth, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmed = name.trim();
    const existing = db.prepare('SELECT id FROM equipment_categories WHERE name = ?').get(trimmed);
    if (existing) {
      return res.status(400).json({ error: 'Category already exists.' });
    }

    const result = db.prepare('INSERT INTO equipment_categories (name) VALUES (?)').run(trimmed);
    const newCategory = db.prepare('SELECT * FROM equipment_categories WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Category added successfully.',
      category: newCategory
    });
  } catch (err) {
    console.error('Add category error:', err.message);
    res.status(500).json({ error: 'Failed to add equipment category.' });
  }
});

// ─── PUT /api/settings/categories/:id - Update category (Admin Only) ─────────
router.put('/categories/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmed = name.trim();
    const existing = db.prepare('SELECT id FROM equipment_categories WHERE name = ? AND id != ?').get(trimmed, id);
    if (existing) {
      return res.status(400).json({ error: 'Another category with this name already exists.' });
    }

    db.prepare('UPDATE equipment_categories SET name = ? WHERE id = ?').run(trimmed, id);
    const updatedCategory = db.prepare('SELECT * FROM equipment_categories WHERE id = ?').get(id);

    res.json({
      message: 'Category updated successfully.',
      category: updatedCategory
    });
  } catch (err) {
    console.error('Update category error:', err.message);
    res.status(500).json({ error: 'Failed to update equipment category.' });
  }
});

// ─── DELETE /api/settings/categories/:id - Delete category (Admin Only) ──────
router.delete('/categories/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM equipment_categories WHERE id = ?').run(id);
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).json({ error: 'Failed to delete equipment category.' });
  }
});

module.exports = router;
