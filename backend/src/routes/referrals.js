const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, p.first_name, p.last_name, p.patient_code, u.full_name AS referred_by_name
       FROM referrals r
       JOIN patients p ON p.id = r.patient_id
       JOIN users u ON u.id = r.referred_by
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patientId, hospitalName, reason, diagnosisSummary } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO referrals (patient_id, referred_by, hospital_name, reason, diagnosis_summary, status, sent_at)
       VALUES (?, ?, ?, ?, ?, 'sent', NOW())`,
      [patientId, req.user.id, hospitalName, reason, diagnosisSummary || null]
    );

    const [referral] = await pool.execute(
      `SELECT r.*, p.first_name, p.last_name FROM referrals r
       JOIN patients p ON p.id = r.patient_id WHERE r.id = ?`,
      [result.insertId]
    );
    res.status(201).json(referral[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
