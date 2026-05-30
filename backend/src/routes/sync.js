const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { queueOfflineData, syncPendingItems } = require('../services/syncService');
const { processInboundSms } = require('../services/smsService');
const pool = require('../config/db');

const router = express.Router();

router.post('/push', authMiddleware, requireRole('bhw'), async (req, res) => {
  try {
    const { deviceId, items } = req.body;
    if (!deviceId || !items?.length) {
      return res.status(400).json({ error: 'deviceId and items are required' });
    }

    const queued = await queueOfflineData(req.user.id, deviceId, items);
    const synced = await syncPendingItems(req.user.id, deviceId);

    res.json({ queued, synced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pull', authMiddleware, requireRole('bhw'), async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);

    const [homeVisits] = await pool.execute(
      `SELECT hv.*, p.first_name, p.last_name, p.patient_code, p.address, p.phone, p.birth_date, p.gender
       FROM home_visits hv
       JOIN patients p ON p.id = hv.patient_id
       WHERE hv.bhw_id = ? AND hv.visit_date = ?`,
      [req.user.id, date]
    );

    const patientIds = homeVisits.map((v) => v.patient_id);
    let recentVitals = [];
    if (patientIds.length > 0) {
      const placeholders = patientIds.map(() => '?').join(',');
      const [vitals] = await pool.execute(
        `SELECT * FROM vitals WHERE patient_id IN (${placeholders}) ORDER BY recorded_at DESC`,
        patientIds
      );
      recentVitals = vitals;
    }

    res.json({ homeVisits, recentVitals, syncedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sms/inbound', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }
    const result = await processInboundSms(phone, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
