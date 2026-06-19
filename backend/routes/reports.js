const express = require('express');
const router = express.Router();
const db = require('../database/init');
const auth = require('../middleware/auth');

// ─── GET /api/reports/summary - Charts data: status counts, monthly trends, category breakdown ─
router.get('/summary', auth, (req, res) => {
  try {
    // Status distribution
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(contract_value), 0) as total_value
      FROM academy_annual_contract_renewal
      GROUP BY status
    `).all();

    // Monthly renewal trends (next 12 months)
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', renewal_date) as month,
        COUNT(*) as count,
        COALESCE(SUM(contract_value), 0) as total_value
      FROM academy_annual_contract_renewal
      WHERE renewal_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', renewal_date)
      ORDER BY month ASC
    `).all();

    // Equipment category breakdown
    const allContracts = db.prepare('SELECT equipment_categories, contract_value FROM academy_annual_contract_renewal').all();
    const categoryMap = {};
    allContracts.forEach(c => {
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

    // Relationship manager performance
    const managerStats = db.prepare(`
      SELECT 
        relationship_manager,
        COUNT(*) as total_contracts,
        COALESCE(SUM(contract_value), 0) as total_value,
        SUM(CASE WHEN status = 'Renewed' THEN 1 ELSE 0 END) as renewed_count,
        SUM(CASE WHEN status = 'Expired' THEN 1 ELSE 0 END) as expired_count
      FROM academy_annual_contract_renewal
      GROUP BY relationship_manager
      ORDER BY total_value DESC
    `).all();

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
router.get('/expiring', auth, (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const getExpiring = (days) => {
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return db.prepare(`
        SELECT * FROM academy_annual_contract_renewal 
        WHERE renewal_date BETWEEN ? AND ? AND status NOT IN ('Renewed', 'Cancelled')
        ORDER BY renewal_date ASC
      `).all(todayStr, futureDate).map(c => {
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
router.get('/export', auth, (req, res) => {
  try {
    const { status } = req.query;

    let query = 'SELECT * FROM academy_annual_contract_renewal';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY renewal_date ASC';

    const contracts = db.prepare(query).all(...params);

    // Build CSV
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
