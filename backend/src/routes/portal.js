const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requestOtp, verifyOtp } = require('../services/otpService');
const { getAvailability, confirmBooking } = require('../services/portalBookingService');
const { patientAuthMiddleware } = require('../middleware/patientAuth');

const router = express.Router();

router.post('/auth/request-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Mobile number is required' });

    const result = await requestOtp(phone);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/auth/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Mobile number and verification code are required' });
    }

    const patient = await verifyOtp(phone, code);
    const token = jwt.sign(
      {
        id: patient.id,
        patientCode: patient.patient_code,
        role: 'patient',
        fullName: `${patient.first_name} ${patient.last_name}`,
        phone: patient.phone,
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '2h' }
    );

    res.json({
      token,
      patient: {
        id: patient.id,
        patientCode: patient.patient_code,
        firstName: patient.first_name,
        lastName: patient.last_name,
        phone: patient.phone,
        barangay: patient.barangay,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/services', patientAuthMiddleware, async (_req, res) => {
  try {
    const [services] = await pool.execute(
      'SELECT id, slug, name, description, icon, max_slots_per_day FROM service_categories WHERE is_active = TRUE ORDER BY sort_order'
    );
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/availability', patientAuthMiddleware, async (req, res) => {
  try {
    const { serviceId, year, month } = req.query;
    if (!serviceId || !year || !month) {
      return res.status(400).json({ error: 'serviceId, year, and month are required' });
    }

    const availability = await getAvailability(
      Number(serviceId),
      Number(year),
      Number(month)
    );
    res.json(availability);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/bookings/confirm', patientAuthMiddleware, async (req, res) => {
  try {
    const { serviceId, appointmentDate } = req.body;
    if (!serviceId || !appointmentDate) {
      return res.status(400).json({ error: 'serviceId and appointmentDate are required' });
    }

    const ticket = await confirmBooking(req.patient.id, Number(serviceId), appointmentDate);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/bookings/me', patientAuthMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.appointment_date, a.queue_number, a.status, a.reason,
              sc.name AS service_name, sc.icon AS service_icon
       FROM appointments a
       LEFT JOIN service_categories sc ON sc.id = a.service_category_id
       WHERE a.patient_id = ? AND a.appointment_date >= CURDATE()
       AND a.status NOT IN ('cancelled', 'completed')
       ORDER BY a.appointment_date`,
      [req.patient.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
