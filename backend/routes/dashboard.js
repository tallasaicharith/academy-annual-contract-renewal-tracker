const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// Helper: Auto-update statuses
function autoUpdateStatuses() {
  const contracts = db.prepare(
    "SELECT id, renewal_date, status FROM academy_annual_contract_renewal WHERE status NOT IN ('Renewed', 'Cancelled')"
  ).all();

  const updateStmt = db.prepare(
    'UPDATE academy_annual_contract_renewal SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  const auditStmt = db.prepare(
    "INSERT INTO audit_logs (contract_renewal_id, action, field_changed, old_value, new_value, description, changed_by) VALUES (?, 'AUTO_STATUS_UPDATE', 'status', ?, ?, ?, 'system')"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updateAll = db.transaction(() => {
    for (const contract of contracts) {
      const renewal = new Date(contract.renewal_date);
      renewal.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let newStatus;
      if (diffDays <= 0) newStatus = 'Expired';
      else if (diffDays <= 90) newStatus = 'Expiring Soon';
      else newStatus = 'Active';

      if (newStatus !== contract.status) {
        updateStmt.run(newStatus, contract.id);
        const desc = `Contract status automatically shifted from ${contract.status} to ${newStatus}`;
        auditStmt.run(contract.id, contract.status, newStatus, desc);
      }
    }
  });

  updateAll();
}

// ─── GET /api/dashboard/summary ─────────────────────────────────────────────
router.get('/summary', requireAuth, (req, res) => {
  try {
    autoUpdateStatuses();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role !== 'admin') {
      whereClause += ' AND relationship_manager_id = ?';
      params.push(req.user.id);
    }

    // Counts by status
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM academy_annual_contract_renewal
      ${whereClause}
      GROUP BY status
    `).all(...params);

    // Total contracts
    const totalContracts = db.prepare(`
      SELECT COUNT(*) as total FROM academy_annual_contract_renewal ${whereClause}
    `).get(...params);

    // Total contract value
    const totalValue = db.prepare(`
      SELECT COALESCE(SUM(contract_value), 0) as total_value FROM academy_annual_contract_renewal ${whereClause}
    `).get(...params);

    // Average contract value
    const avgValue = db.prepare(`
      SELECT COALESCE(AVG(contract_value), 0) as avg_value FROM academy_annual_contract_renewal ${whereClause}
    `).get(...params);

    // Contracts expiring within 30 days (urgent alerts count)
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let urgentQuery = `
      SELECT COUNT(*) as count FROM academy_annual_contract_renewal 
      WHERE renewal_date BETWEEN ? AND ? AND status NOT IN ('Renewed', 'Cancelled', 'Expired')
    `;
    const urgentParams = [today, thirtyDaysLater];

    if (req.user.role !== 'admin') {
      urgentQuery += ' AND relationship_manager_id = ?';
      urgentParams.push(req.user.id);
    }
    const urgentCount = db.prepare(urgentQuery).get(...urgentParams);

    // Format status counts as an object
    const statusMap = {};
    statusCounts.forEach(row => { statusMap[row.status] = row.count; });

    res.json({
      total_contracts: totalContracts.total,
      total_value: totalValue.total_value,
      average_value: Math.round(avgValue.avg_value * 100) / 100,
      urgent_alerts: urgentCount.count,
      status_counts: statusMap,
      status_breakdown: statusCounts
    });
  } catch (err) {
    console.error('Dashboard summary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard summary.' });
  }
});

// ─── GET /api/dashboard/alerts ──────────────────────────────────────────────
router.get('/alerts', requireAuth, (req, res) => {
  try {
    autoUpdateStatuses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let expiringQuery = `
      SELECT * FROM academy_annual_contract_renewal 
      WHERE renewal_date BETWEEN ? AND ? AND status NOT IN ('Renewed', 'Cancelled')
    `;
    const expiringParams = [todayStr, thirtyDaysLater];

    if (req.user.role !== 'admin') {
      expiringQuery += ' AND relationship_manager_id = ?';
      expiringParams.push(req.user.id);
    }
    expiringQuery += ' ORDER BY renewal_date ASC';
    const expiringContracts = db.prepare(expiringQuery).all(...expiringParams);

    // Recently expired contracts (within last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let expiredQuery = `
      SELECT * FROM academy_annual_contract_renewal 
      WHERE renewal_date BETWEEN ? AND ? AND status = 'Expired'
    `;
    const expiredParams = [thirtyDaysAgo, todayStr];

    if (req.user.role !== 'admin') {
      expiredQuery += ' AND relationship_manager_id = ?';
      expiredParams.push(req.user.id);
    }
    expiredQuery += ' ORDER BY renewal_date DESC';
    const recentlyExpired = db.prepare(expiredQuery).all(...expiredParams);

    // Add days_until_renewal
    const addDays = (contracts) => contracts.map(c => {
      const renewal = new Date(c.renewal_date);
      renewal.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, days_until_renewal: diffDays };
    });

    res.json({
      expiring_soon: addDays(expiringContracts),
      recently_expired: addDays(recentlyExpired),
      total_alerts: expiringContracts.length + recentlyExpired.length
    });
  } catch (err) {
    console.error('Dashboard alerts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

// ─── GET /api/dashboard/activities ──────────────────────────────────────────
router.get('/activities', requireAuth, (req, res) => {
  try {
    let query = `
      SELECT l.*, c.academy_name
      FROM audit_logs l
      JOIN academy_annual_contract_renewal c ON l.contract_renewal_id = c.id
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' WHERE c.relationship_manager_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY l.created_at DESC LIMIT 10';
    const logs = db.prepare(query).all(...params);

    res.json({ activities: logs });
  } catch (err) {
    console.error('Dashboard activities error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recent activities.' });
  }
});

module.exports = router;
