const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, barangay } = req.query;
    let sql = 'SELECT * FROM patients WHERE 1=1';
    const params = [];

    if (search) {
      sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR patient_code LIKE ? OR phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (barangay) {
      sql += ' AND barangay = ?';
      params.push(barangay);
    }

    sql += ' ORDER BY last_name, first_name LIMIT 100';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [patients] = await pool.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (patients.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const [vitals] = await pool.execute(
      'SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 10',
      [req.params.id]
    );
    const [appointments] = await pool.execute(
      'SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC LIMIT 10',
      [req.params.id]
    );

    res.json({ ...patients[0], vitals, appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, middleName, birthDate, gender, phone, address, barangay, bloodType, allergies } = req.body;

    const [countResult] = await pool.execute('SELECT COUNT(*) AS cnt FROM patients');
    const code = `P-${new Date().getFullYear()}-${String(countResult[0].cnt + 1).padStart(3, '0')}`;

    const [result] = await pool.execute(
      `INSERT INTO patients (patient_code, first_name, last_name, middle_name, birth_date, gender, phone, address, barangay, blood_type, allergies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, firstName, lastName, middleName || null, birthDate || null, gender || null, phone || null, address || null, barangay || null, bloodType || null, allergies || null]
    );

    const [patient] = await pool.execute('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    res.status(201).json(patient[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, middleName, birthDate, gender, phone, address, barangay, bloodType, allergies } = req.body;
    await pool.execute(
      `UPDATE patients SET first_name=?, last_name=?, middle_name=?, birth_date=?, gender=?, phone=?, address=?, barangay=?, blood_type=?, allergies=? WHERE id=?`,
      [firstName, lastName, middleName, birthDate, gender, phone, address, barangay, bloodType, allergies, req.params.id]
    );
    const [patient] = await pool.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    res.json(patient[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
