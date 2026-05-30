const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendSms } = require('../services/smsService');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, status } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    let sql = `
      SELECT a.*, p.first_name, p.last_name, p.patient_code, p.phone
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.appointment_date = ?`;
    const params = [targetDate];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.queue_number, a.created_at';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patientId, appointmentDate, reason, bookingSource } = req.body;
    const date = appointmentDate || new Date().toISOString().slice(0, 10);

    const [queueResult] = await pool.execute(
      'SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue FROM appointments WHERE appointment_date = ?',
      [date]
    );

    const [result] = await pool.execute(
      `INSERT INTO appointments (patient_id, appointment_date, queue_number, status, booking_source, reason)
       VALUES (?, ?, ?, 'confirmed', ?, ?)`,
      [patientId, date, queueResult[0].next_queue, bookingSource || 'web', reason || 'General check-up']
    );

    const [patients] = await pool.execute('SELECT phone, first_name FROM patients WHERE id = ?', [patientId]);
    if (patients[0]?.phone) {
      await sendSms(
        patients[0].phone,
        `Hi ${patients[0].first_name}, your appointment is confirmed for ${date}. Queue #${queueResult[0].next_queue}.`,
        patientId
      );
    }

    const [appointment] = await pool.execute(
      `SELECT a.*, p.first_name, p.last_name, p.patient_code FROM appointments a
       JOIN patients p ON p.id = a.patient_id WHERE a.id = ?`,
      [result.insertId]
    );
    res.status(201).json(appointment[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, followUpDate, followUpReason } = req.body;
    await pool.execute(
      'UPDATE appointments SET status = ?, follow_up_date = ?, follow_up_reason = ? WHERE id = ?',
      [status, followUpDate || null, followUpReason || null, req.params.id]
    );

    if (followUpDate && followUpReason) {
      const [appt] = await pool.execute('SELECT patient_id FROM appointments WHERE id = ?', [req.params.id]);
      await pool.execute(
        `INSERT INTO reminders (patient_id, appointment_id, reminder_date, message)
         VALUES (?, ?, ?, ?)`,
        [appt[0].patient_id, req.params.id, followUpDate, `Reminder: ${followUpReason} scheduled for ${followUpDate}`]
      );
    }

    const [updated] = await pool.execute('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
