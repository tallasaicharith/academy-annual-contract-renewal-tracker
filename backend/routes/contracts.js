const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// Automatically parse 'id' route parameter to an integer to prevent SQLite foreign key type mismatch
router.param('id', (req, res, next, id) => {
  const parsed = parseInt(id, 10);
  if (!isNaN(parsed)) {
    req.params.id = parsed;
  }
  next();
});

// Helper: Calculate status based on renewal_date
function calculateStatus(renewalDate, currentStatus) {
  if (currentStatus === 'Renewed' || currentStatus === 'Cancelled') {
    return currentStatus;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(renewalDate);
  renewal.setHours(0, 0, 0, 0);
  const diffTime = renewal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Expired';
  if (diffDays <= 90) return 'Expiring Soon';
  return 'Active';
}

// Helper: Auto-update contract statuses
function autoUpdateStatuses() {
  const contracts = db.prepare(
    "SELECT id, renewal_date, status FROM academy_annual_contract_renewal WHERE status NOT IN ('Renewed', 'Cancelled')"
  ).all();

  const updateStmt = db.prepare(
    'UPDATE academy_annual_contract_renewal SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  const auditStmt = db.prepare(
    "INSERT INTO audit_logs (contract_renewal_id, action, field_changed, old_value, new_value, changed_by) VALUES (?, 'AUTO_STATUS_UPDATE', 'status', ?, ?, 'system')"
  );

  const updateAll = db.transaction(() => {
    for (const contract of contracts) {
      const newStatus = calculateStatus(contract.renewal_date, contract.status);
      if (newStatus !== contract.status) {
        updateStmt.run(newStatus, contract.id);
        auditStmt.run(contract.id, contract.status, newStatus);
      }
    }
  });

  updateAll();
}

// ─── GET /api/contracts - List contracts (scoped by role) ───────────────────
router.get('/', requireAuth, (req, res) => {
  try {
    autoUpdateStatuses();

    const { search, status, page = 1, limit = 100 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(500, parseInt(limit) || 100));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Role Scoping (RLS equivalent)
    if (req.user.role !== 'admin') {
      whereClause += ' AND c.relationship_manager_id = ?';
      params.push(req.user.id);
    }

    if (search) {
      whereClause += ' AND (c.academy_name LIKE ? OR c.equipment_categories LIKE ? OR u.name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = db.prepare(`
      SELECT COUNT(*) as total 
      FROM academy_annual_contract_renewal c
      JOIN users u ON c.relationship_manager_id = u.id
      ${whereClause}
    `).get(...params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limitNum);

    // Get paginated data with joined manager name
    const contracts = db.prepare(`
      SELECT c.*, u.name AS relationship_manager, u.email AS relationship_manager_email
      FROM academy_annual_contract_renewal c
      JOIN users u ON c.relationship_manager_id = u.id
      ${whereClause} 
      ORDER BY c.renewal_date ASC 
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);

    // Add days_until_renewal
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const contractsWithDays = contracts.map(c => {
      const renewal = new Date(c.renewal_date);
      renewal.setHours(0, 0, 0, 0);
      const diffTime = renewal.getTime() - today.getTime();
      const days_until_renewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...c, days_until_renewal };
    });

    res.json({
      data: contractsWithDays,
      total,
      page: pageNum,
      totalPages
    });
  } catch (err) {
    console.error('List contracts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contracts.' });
  }
});

// ─── POST /api/contracts - Create new contract ──────────────────────────────
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      academy_name, equipment_categories, contract_value, price_revision,
      relationship_manager_id, renewal_date, contract_start_date, status, notes
    } = req.body;

    if (!academy_name || !equipment_categories || !contract_value || !renewal_date || !contract_start_date) {
      return res.status(400).json({
        error: 'Required fields: academy_name, equipment_categories, contract_value, renewal_date, contract_start_date'
      });
    }

    let targetManagerId;

    if (req.user.role === 'admin') {
      // Validate provided relationship_manager_id
      if (!relationship_manager_id) {
        return res.status(400).json({ error: 'relationship_manager_id is required for administrators.' });
      }
      const targetUser = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(relationship_manager_id);
      if (!targetUser) {
        return res.status(400).json({ error: 'The specified relationship manager does not exist.' });
      }
      if (targetUser.is_active === 0) {
        return res.status(400).json({ error: 'Cannot assign a contract to a deactivated employee.' });
      }
      targetManagerId = relationship_manager_id;
    } else {
      // Force assign to themselves
      targetManagerId = req.user.id;
    }

    const computedStatus = status || calculateStatus(renewal_date, 'Active');

    const result = db.prepare(`
      INSERT INTO academy_annual_contract_renewal 
        (academy_name, equipment_categories, contract_value, price_revision, relationship_manager_id, renewal_date, contract_start_date, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      academy_name, 
      equipment_categories, 
      contract_value, 
      price_revision || 0,
      targetManagerId, 
      renewal_date, 
      contract_start_date, 
      computedStatus,
      notes || null, 
      req.user.username
    );

    // Create audit log
    db.prepare(`
      INSERT INTO audit_logs (contract_renewal_id, action, changed_by)
      VALUES (?, 'CREATE', ?)
    `).run(result.lastInsertRowid, req.user.username);

    const newContract = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Contract created successfully.',
      data: newContract
    });
  } catch (err) {
    console.error('Create contract error:', err.message);
    res.status(500).json({ error: 'Failed to create contract.' });
  }
});

// ─── GET /api/contracts/:id - Get one contract ──────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  try {
    const contract = db.prepare(`
      SELECT c.*, u.name AS relationship_manager, u.email AS relationship_manager_email,
             u.phone AS relationship_manager_phone, u.avatar_url AS relationship_manager_avatar_url,
             u.title AS relationship_manager_title
      FROM academy_annual_contract_renewal c
      JOIN users u ON c.relationship_manager_id = u.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    // Access Scoping (RLS equivalent)
    if (req.user.role !== 'admin' && contract.relationship_manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not manage this contract.' });
    }

    // Calculate days until renewal
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(contract.renewal_date);
    renewal.setHours(0, 0, 0, 0);
    const diffTime = renewal.getTime() - today.getTime();
    contract.days_until_renewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Get audit history
    const auditLogs = db.prepare(`
      SELECT *, field_changed AS field 
      FROM audit_logs 
      WHERE contract_renewal_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      data: contract,
      audit_history: auditLogs
    });
  } catch (err) {
    console.error('Get contract error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contract.' });
  }
});

// ─── GET /api/contracts/:id/history - Get audit history separately ──────────
router.get('/:id/history', requireAuth, (req, res) => {
  try {
    const contract = db.prepare('SELECT relationship_manager_id FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    // Access Scoping
    if (req.user.role !== 'admin' && contract.relationship_manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not manage this contract.' });
    }

    const auditLogs = db.prepare(`
      SELECT *, field_changed AS field 
      FROM audit_logs 
      WHERE contract_renewal_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      history: auditLogs
    });
  } catch (err) {
    console.error('Get contract history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contract history.' });
  }
});

// ─── PUT /api/contracts/:id - Update contract ──────────────────────────────
router.put('/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    // Access Scoping
    if (req.user.role !== 'admin' && existing.relationship_manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not manage this contract.' });
    }

    let {
      academy_name, equipment_categories, contract_value, price_revision,
      relationship_manager_id, renewal_date, contract_start_date, status, notes
    } = req.body;

    // Strip relationship_manager_id if not admin (security lock)
    if (req.user.role !== 'admin') {
      relationship_manager_id = existing.relationship_manager_id;
    } else if (relationship_manager_id !== undefined && relationship_manager_id !== existing.relationship_manager_id) {
      // Admin changed it - validate target user is active
      const targetUser = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(relationship_manager_id);
      if (!targetUser) {
        return res.status(400).json({ error: 'The specified relationship manager does not exist.' });
      }
      if (targetUser.is_active === 0) {
        return res.status(400).json({ error: 'Cannot assign a contract to a deactivated employee.' });
      }
    }

    const updatedFields = {
      academy_name: academy_name !== undefined ? academy_name : existing.academy_name,
      equipment_categories: equipment_categories !== undefined ? equipment_categories : existing.equipment_categories,
      contract_value: contract_value !== undefined ? contract_value : existing.contract_value,
      price_revision: price_revision !== undefined ? price_revision : existing.price_revision,
      relationship_manager_id: relationship_manager_id !== undefined ? relationship_manager_id : existing.relationship_manager_id,
      renewal_date: renewal_date !== undefined ? renewal_date : existing.renewal_date,
      contract_start_date: contract_start_date !== undefined ? contract_start_date : existing.contract_start_date,
      status: status !== undefined ? status : existing.status,
      notes: notes !== undefined ? notes : existing.notes
    };

    // Track changes and create audit logs
    const fieldsToCheck = [
      'academy_name', 'equipment_categories', 'contract_value', 'price_revision',
      'relationship_manager_id', 'renewal_date', 'contract_start_date', 'status', 'notes'
    ];

    const auditInsert = db.prepare(`
      INSERT INTO audit_logs (contract_renewal_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (?, 'UPDATE', ?, ?, ?, ?)
    `);

    const performUpdate = db.transaction(() => {
      for (const field of fieldsToCheck) {
        const oldVal = String(existing[field] ?? '');
        const newVal = String(updatedFields[field] ?? '');
        if (oldVal !== newVal) {
          auditInsert.run(req.params.id, field, oldVal, newVal, req.user.username);
        }
      }

      db.prepare(`
        UPDATE academy_annual_contract_renewal 
        SET academy_name = ?, equipment_categories = ?, contract_value = ?, price_revision = ?,
            relationship_manager_id = ?, renewal_date = ?, contract_start_date = ?, status = ?, 
            notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        updatedFields.academy_name, 
        updatedFields.equipment_categories, 
        updatedFields.contract_value,
        updatedFields.price_revision, 
        updatedFields.relationship_manager_id, 
        updatedFields.renewal_date,
        updatedFields.contract_start_date, 
        updatedFields.status, 
        updatedFields.notes, 
        req.params.id
      );
    });

    performUpdate();

    const updated = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    res.json({
      message: 'Contract updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Update contract error:', err.message);
    res.status(500).json({ error: 'Failed to update contract.' });
  }
});

// ─── PATCH /api/contracts/:id/status - Change status ────────────────────────
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const validStatuses = ['Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const existing = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    // Access Scoping
    if (req.user.role !== 'admin' && existing.relationship_manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not manage this contract.' });
    }

    const performStatusUpdate = db.transaction(() => {
      db.prepare(
        'UPDATE academy_annual_contract_renewal SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(status, req.params.id);

      db.prepare(`
        INSERT INTO audit_logs (contract_renewal_id, action, field_changed, old_value, new_value, changed_by)
        VALUES (?, 'STATUS_CHANGE', 'status', ?, ?, ?)
      `).run(req.params.id, existing.status, status, req.user.username);
    });

    performStatusUpdate();

    const updated = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    res.json({
      message: 'Status updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Status update error:', err.message);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ─── DELETE /api/contracts/:id - Delete contract ────────────────────────────
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    // Access Scoping
    if (req.user.role !== 'admin' && existing.relationship_manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not manage this contract.' });
    }

    const performDelete = db.transaction(() => {
      db.prepare(`
        INSERT INTO audit_logs (contract_renewal_id, action, field_changed, old_value, changed_by)
        VALUES (?, 'DELETE', 'full_record', ?, ?)
      `).run(req.params.id, JSON.stringify(existing), req.user.username);

      db.prepare('DELETE FROM academy_annual_contract_renewal WHERE id = ?').run(req.params.id);
    });

    performDelete();

    res.json({ message: 'Contract deleted successfully.' });
  } catch (err) {
    console.error('Delete contract error:', err.message);
    res.status(500).json({ error: 'Failed to delete contract.' });
  }
});

module.exports = router;
