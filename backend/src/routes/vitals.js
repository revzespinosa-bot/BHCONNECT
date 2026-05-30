const express = require('express');
const pool = require('../config/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { evaluateVitalRisk } = require('../services/syncService');
const { createAlert } = require('../services/alertService');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { patientId, highRisk } = req.query;
    let sql = `
      SELECT v.*, p.first_name, p.last_name, p.patient_code, u.full_name AS recorded_by_name
      FROM vitals v
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN users u ON u.id = v.recorded_by
      WHERE 1=1`;
    const params = [];

    if (patientId) {
      sql += ' AND v.patient_id = ?';
      params.push(patientId);
    }
    if (highRisk === 'true') {
      sql += ' AND v.is_high_risk = TRUE';
    }

    sql += ' ORDER BY v.recorded_at DESC LIMIT 50';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const risk = evaluateVitalRisk(data);

    const [result] = await pool.execute(
      `INSERT INTO vitals
       (patient_id, recorded_by, home_visit_id, appointment_id, weight_kg, height_cm,
        blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature_c,
        blood_sugar_mg_dl, is_high_risk, risk_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.patientId,
        req.user.id,
        data.homeVisitId || null,
        data.appointmentId || null,
        data.weightKg || null,
        data.heightCm || null,
        data.bloodPressureSystolic || null,
        data.bloodPressureDiastolic || null,
        data.heartRate || null,
        data.temperatureC || null,
        data.bloodSugarMgDl || null,
        risk.isHighRisk,
        risk.notes,
      ]
    );

    if (risk.isHighRisk) {
      const [patients] = await pool.execute('SELECT first_name, last_name FROM patients WHERE id = ?', [data.patientId]);
      const p = patients[0];
      await createAlert(
        'high_risk_vital',
        'High-Risk Vital Sign',
        `${p.first_name} ${p.last_name}: ${risk.notes}`,
        'vitals',
        result.insertId
      );
    }

    const [vital] = await pool.execute('SELECT * FROM vitals WHERE id = ?', [result.insertId]);
    res.status(201).json(vital[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/home-visits', authMiddleware, requireRole('bhw', 'admin', 'nurse'), async (req, res) => {
  try {
    const bhwId = req.user.role === 'bhw' ? req.user.id : req.query.bhwId;
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    let sql = `
      SELECT hv.*, p.first_name, p.last_name, p.patient_code, p.address, p.phone
      FROM home_visits hv
      JOIN patients p ON p.id = hv.patient_id
      WHERE hv.visit_date = ?`;
    const params = [date];

    if (bhwId) {
      sql += ' AND hv.bhw_id = ?';
      params.push(bhwId);
    }

    sql += ' ORDER BY hv.status, p.last_name';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/home-visits', authMiddleware, requireRole('admin', 'nurse'), async (req, res) => {
  try {
    const { patientId, bhwId, visitDate, notes } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO home_visits (patient_id, bhw_id, visit_date, notes) VALUES (?, ?, ?, ?)`,
      [patientId, bhwId, visitDate, notes || null]
    );
    const [visit] = await pool.execute('SELECT * FROM home_visits WHERE id = ?', [result.insertId]);
    res.status(201).json(visit[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
