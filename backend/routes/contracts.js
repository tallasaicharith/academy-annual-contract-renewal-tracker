const express = require('express');
const router = express.Router();
const db = require('../database/init');
const auth = require('../middleware/auth');

// Automatically parse 'id' route parameter to an integer to prevent SQLite foreign key type mismatch
router.param('id', (req, res, next, id) => {
  const parsed = parseInt(id, 10);
  if (!isNaN(parsed)) {
    req.params.id = parsed;
  }
  next();
});

// ─── Helper: Calculate status based on renewal_date ─────────────────────────
function calculateStatus(renewalDate, currentStatus) {
  // Don't auto-update Renewed or Cancelled contracts
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

// ─── Helper: Auto-update contract statuses ──────────────────────────────────
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

// ─── GET /api/contracts - List all with search, filter, pagination ──────────
router.get('/', auth, (req, res) => {
  try {
    // Auto-update statuses before returning data
    autoUpdateStatuses();

    const { search, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (academy_name LIKE ? OR equipment_categories LIKE ? OR relationship_manager LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = db.prepare(
      `SELECT COUNT(*) as total FROM academy_annual_contract_renewal ${whereClause}`
    ).get(...params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limitNum);

    // Get paginated data
    const contracts = db.prepare(
      `SELECT * FROM academy_annual_contract_renewal ${whereClause} ORDER BY renewal_date ASC LIMIT ? OFFSET ?`
    ).all(...params, limitNum, offset);

    // Add days_until_renewal to each contract
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
router.post('/', auth, (req, res) => {
  try {
    const {
      academy_name, equipment_categories, contract_value, price_revision,
      relationship_manager, renewal_date, contract_start_date, status, notes
    } = req.body;

    // Validation
    if (!academy_name || !equipment_categories || !contract_value || !relationship_manager || !renewal_date || !contract_start_date) {
      return res.status(400).json({
        error: 'Required fields: academy_name, equipment_categories, contract_value, relationship_manager, renewal_date, contract_start_date'
      });
    }

    const computedStatus = status || calculateStatus(renewal_date, 'Active');

    const result = db.prepare(`
      INSERT INTO academy_annual_contract_renewal 
        (academy_name, equipment_categories, contract_value, price_revision, relationship_manager, renewal_date, contract_start_date, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      academy_name, equipment_categories, contract_value, price_revision || 0,
      relationship_manager, renewal_date, contract_start_date, computedStatus,
      notes || null, req.user.username
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

// ─── GET /api/contracts/:id - Get one contract with audit history ───────────
router.get('/:id', auth, (req, res) => {
  try {
    const contract = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    // Calculate days until renewal
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(contract.renewal_date);
    renewal.setHours(0, 0, 0, 0);
    const diffTime = renewal.getTime() - today.getTime();
    contract.days_until_renewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Get audit history
    const auditLogs = db.prepare(
      'SELECT *, field_changed AS field FROM audit_logs WHERE contract_renewal_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);

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
router.get('/:id/history', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const auditLogs = db.prepare(
      'SELECT *, field_changed AS field FROM audit_logs WHERE contract_renewal_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);

    res.json({
      history: auditLogs
    });
  } catch (err) {
    console.error('Get contract history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contract history.' });
  }
});

// ─── PUT /api/contracts/:id - Update contract + audit logs for each change ──
router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const {
      academy_name, equipment_categories, contract_value, price_revision,
      relationship_manager, renewal_date, contract_start_date, status, notes
    } = req.body;

    const updatedFields = {
      academy_name: academy_name !== undefined ? academy_name : existing.academy_name,
      equipment_categories: equipment_categories !== undefined ? equipment_categories : existing.equipment_categories,
      contract_value: contract_value !== undefined ? contract_value : existing.contract_value,
      price_revision: price_revision !== undefined ? price_revision : existing.price_revision,
      relationship_manager: relationship_manager !== undefined ? relationship_manager : existing.relationship_manager,
      renewal_date: renewal_date !== undefined ? renewal_date : existing.renewal_date,
      contract_start_date: contract_start_date !== undefined ? contract_start_date : existing.contract_start_date,
      status: status !== undefined ? status : existing.status,
      notes: notes !== undefined ? notes : existing.notes
    };

    // Track changes and create audit logs
    const fieldsToCheck = [
      'academy_name', 'equipment_categories', 'contract_value', 'price_revision',
      'relationship_manager', 'renewal_date', 'contract_start_date', 'status', 'notes'
    ];

    const auditInsert = db.prepare(`
      INSERT INTO audit_logs (contract_renewal_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (?, 'UPDATE', ?, ?, ?, ?)
    `);

    const performUpdate = db.transaction(() => {
      // Log each changed field
      for (const field of fieldsToCheck) {
        const oldVal = String(existing[field] ?? '');
        const newVal = String(updatedFields[field] ?? '');
        if (oldVal !== newVal) {
          auditInsert.run(req.params.id, field, oldVal, newVal, req.user.username);
        }
      }

      // Update the contract
      db.prepare(`
        UPDATE academy_annual_contract_renewal 
        SET academy_name = ?, equipment_categories = ?, contract_value = ?, price_revision = ?,
            relationship_manager = ?, renewal_date = ?, contract_start_date = ?, status = ?, 
            notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        updatedFields.academy_name, updatedFields.equipment_categories, updatedFields.contract_value,
        updatedFields.price_revision, updatedFields.relationship_manager, updatedFields.renewal_date,
        updatedFields.contract_start_date, updatedFields.status, updatedFields.notes, req.params.id
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

// ─── PATCH /api/contracts/:id/status - Change status + audit log ────────────
router.patch('/:id/status', auth, (req, res) => {
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

// ─── DELETE /api/contracts/:id - Delete + audit log ─────────────────────────
router.delete('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM academy_annual_contract_renewal WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const performDelete = db.transaction(() => {
      // Create audit log before deletion
      db.prepare(`
        INSERT INTO audit_logs (contract_renewal_id, action, field_changed, old_value, changed_by)
        VALUES (?, 'DELETE', 'full_record', ?, ?)
      `).run(req.params.id, JSON.stringify(existing), req.user.username);

      // Delete the contract
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
