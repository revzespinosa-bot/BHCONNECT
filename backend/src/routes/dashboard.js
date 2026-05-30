const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[{ patientCount }]] = await pool.execute('SELECT COUNT(*) AS patientCount FROM patients');
    const [[{ todayAppointments }]] = await pool.execute(
      'SELECT COUNT(*) AS todayAppointments FROM appointments WHERE appointment_date = ?',
      [today]
    );
    const [[{ pendingQueue }]] = await pool.execute(
      `SELECT COUNT(*) AS pendingQueue FROM appointments
       WHERE appointment_date = ? AND status IN ('confirmed', 'in_queue', 'pending')`,
      [today]
    );
    const [[{ lowStockItems }]] = await pool.execute(
      'SELECT COUNT(*) AS lowStockItems FROM inventory_items WHERE quantity <= low_stock_threshold'
    );
    const [[{ unreadAlerts }]] = await pool.execute(
      'SELECT COUNT(*) AS unreadAlerts FROM alerts WHERE is_read = FALSE'
    );
    const [[{ highRiskVitals }]] = await pool.execute(
      'SELECT COUNT(*) AS highRiskVitals FROM vitals WHERE is_high_risk = TRUE AND DATE(recorded_at) = ?',
      [today]
    );
    const [[{ pendingHomeVisits }]] = await pool.execute(
      `SELECT COUNT(*) AS pendingHomeVisits FROM home_visits
       WHERE visit_date = ? AND status = 'scheduled'`,
      [today]
    );

    res.json({
      patientCount,
      todayAppointments,
      pendingQueue,
      lowStockItems,
      unreadAlerts,
      highRiskVitals,
      pendingHomeVisits,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
