const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// ─── GET /api/reports/summary - Charts data ───────────────────────────────────
router.get('/summary', requireAuth, (req, res) => {
  try {
    let whereClause = 'WHERE 1=1';
    let managerWhere = '';
    const params = [];
    const managerParams = [];

    if (req.user.role !== 'admin') {
      whereClause += ' AND relationship_manager_id = ?';
      managerWhere = ' AND u.id = ?';
      params.push(req.user.id);
      managerParams.push(req.user.id);
    }

    // Status distribution
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(contract_value), 0) as total_value
      FROM academy_annual_contract_renewal
      ${whereClause}
      GROUP BY status
    `).all(...params);

    // Monthly renewal trends (next 12 months)
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', renewal_date) as month,
        COUNT(*) as count,
        COALESCE(SUM(contract_value), 0) as total_value
      FROM academy_annual_contract_renewal
      ${whereClause} AND renewal_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', renewal_date)
      ORDER BY month ASC
    `).all(...params);

    // Equipment category breakdown
    const allContracts = db.prepare(`
      SELECT equipment_categories, contract_value 
      FROM academy_annual_contract_renewal
      ${whereClause}
    `).all(...params);

    const categoryMap = {};
    allContracts.forEach(c => {
      if (!c.equipment_categories) return;
      const categories = c.equipment_categories.split(',').map(cat => cat.trim());
      categories.forEach(cat => {
        if (!categoryMap[cat]) {
          categoryMap[cat] = { count: 0, total_value: 0 };
        }
        categoryMap[cat].count += 1;
        categoryMap[cat].total_value += c.contract_value;
      });
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      total_value: data.total_value
    })).sort((a, b) => b.total_value - a.total_value);

    // Relationship manager performance (fetch from users table)
    const managerStats = db.prepare(`
      SELECT 
        u.name AS relationship_manager,
        COUNT(c.id) as total_contracts,
        COALESCE(SUM(c.contract_value), 0) as total_value,
        SUM(CASE WHEN c.status = 'Renewed' THEN 1 ELSE 0 END) as renewed_count,
        SUM(CASE WHEN c.status = 'Expired' THEN 1 ELSE 0 END) as expired_count
      FROM users u
      LEFT JOIN academy_annual_contract_renewal c ON c.relationship_manager_id = u.id
      WHERE u.role = 'employee' ${managerWhere}
      GROUP BY u.id
      ORDER BY total_value DESC
    `).all(...managerParams);

    res.json({
      status_distribution: statusCounts,
      monthly_trends: monthlyTrends,
      category_breakdown: categoryBreakdown,
      manager_performance: managerStats
    });
  } catch (err) {
    console.error('Reports summary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch report summary.' });
  }
});

// ─── GET /api/reports/expiring - Contracts expiring in 30/60/90 days ────────
router.get('/expiring', requireAuth, (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const getExpiring = (days) => {
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      let query = `
        SELECT * FROM academy_annual_contract_renewal 
        WHERE renewal_date BETWEEN ? AND ? AND status NOT IN ('Renewed', 'Cancelled')
      `;
      const queryParams = [todayStr, futureDate];

      if (req.user.role !== 'admin') {
        query += ' AND relationship_manager_id = ?';
        queryParams.push(req.user.id);
      }

      query += ' ORDER BY renewal_date ASC';

      return db.prepare(query).all(...queryParams).map(c => {
        const renewal = new Date(c.renewal_date);
        renewal.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, days_until_renewal: diffDays };
      });
    };

    res.json({
      expiring_30_days: getExpiring(30),
      expiring_60_days: getExpiring(60),
      expiring_90_days: getExpiring(90)
    });
  } catch (err) {
    console.error('Reports expiring error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expiring contracts.' });
  }
});

// ─── GET /api/reports/export - CSV export ───────────────────────────────────
router.get('/export', requireAuth, (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT c.*, u.name AS relationship_manager 
      FROM academy_annual_contract_renewal c
      JOIN users u ON c.relationship_manager_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND c.relationship_manager_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.renewal_date ASC';

    const contracts = db.prepare(query).all(...params);

    const headers = [
      'ID', 'Academy Name', 'Equipment Categories', 'Contract Value',
      'Price Revision (%)', 'Relationship Manager', 'Renewal Date',
      'Contract Start Date', 'Status', 'Notes', 'Created By',
      'Created At', 'Updated At'
    ];

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csv = headers.join(',') + '\n';

    contracts.forEach(c => {
      const row = [
        c.id, c.academy_name, c.equipment_categories, c.contract_value,
        c.price_revision, c.relationship_manager, c.renewal_date,
        c.contract_start_date, c.status, c.notes, c.created_by,
        c.created_at, c.updated_at
      ].map(escapeCSV);
      csv += row.join(',') + '\n';
    });

    const filename = `contracts_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err.message);
    res.status(500).json({ error: 'Failed to export contracts.' });
  }
});

module.exports = router;
