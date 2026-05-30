const pool = require('../config/db');
const { sendSms } = require('./smsService');

function parseAllowedDays(allowedDays) {
  return allowedDays.split(',').map((d) => parseInt(d.trim(), 10));
}

function isDayAllowed(dateStr, allowedDays) {
  const date = new Date(dateStr + 'T12:00:00');
  const dow = date.getDay();
  const mysqlDow = dow === 0 ? 7 : dow;
  return parseAllowedDays(allowedDays).includes(mysqlDow);
}

async function getServiceById(serviceId) {
  const [rows] = await pool.execute(
    'SELECT * FROM service_categories WHERE id = ? AND is_active = TRUE',
    [serviceId]
  );
  if (rows.length === 0) {
    const err = new Error('Service not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function getSlotCount(serviceId, dateStr) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS booked FROM appointments
     WHERE appointment_date = ? AND service_category_id = ?
     AND status NOT IN ('cancelled', 'no_show')`,
    [dateStr, serviceId]
  );
  return rows[0].booked;
}

async function getAvailability(serviceId, year, month) {
  const service = await getServiceById(serviceId);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(dateStr + 'T12:00:00');

    let available = true;
    let reason = null;

    if (dateObj < today) {
      available = false;
      reason = 'past';
    } else if (!isDayAllowed(dateStr, service.allowed_days)) {
      available = false;
      reason = 'service_unavailable';
    } else {
      const booked = await getSlotCount(serviceId, dateStr);
      if (booked >= service.max_slots_per_day) {
        available = false;
        reason = 'full';
      }
      days.push({
        date: dateStr,
        available,
        reason,
        booked,
        maxSlots: service.max_slots_per_day,
        remaining: Math.max(0, service.max_slots_per_day - booked),
      });
      continue;
    }

    days.push({
      date: dateStr,
      available: false,
      reason,
      booked: 0,
      maxSlots: service.max_slots_per_day,
      remaining: 0,
    });
  }

  return { service, days };
}

async function confirmBooking(patientId, serviceId, appointmentDate) {
  const service = await getServiceById(serviceId);

  if (!isDayAllowed(appointmentDate, service.allowed_days)) {
    const err = new Error('This service is not available on the selected day.');
    err.status = 400;
    throw err;
  }

  const booked = await getSlotCount(serviceId, appointmentDate);
  if (booked >= service.max_slots_per_day) {
    const err = new Error('No slots remaining for this date. Please choose another day.');
    err.status = 409;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [queueResult] = await conn.execute(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue
       FROM appointments WHERE appointment_date = ? FOR UPDATE`,
      [appointmentDate]
    );
    const queueNumber = queueResult[0].next_queue;

    const [result] = await conn.execute(
      `INSERT INTO appointments
       (patient_id, service_category_id, appointment_date, queue_number, status, booking_source, reason)
       VALUES (?, ?, ?, ?, 'confirmed', 'web', ?)`,
      [patientId, serviceId, appointmentDate, queueNumber, service.name]
    );

    const ticketCode = `BHC-${appointmentDate.replace(/-/g, '')}-${String(queueNumber).padStart(3, '0')}`;

    const [patientRows] = await conn.execute(
      'SELECT phone, first_name, patient_code FROM patients WHERE id = ?',
      [patientId]
    );
    const patient = patientRows[0];

    await conn.commit();

    if (patient.phone) {
      await sendSms(
        patient.phone,
        `Booking confirmed! ${service.name} on ${appointmentDate}. Queue #${queueNumber}. Ticket: ${ticketCode}`,
        patientId
      );
    }

    return {
      appointmentId: result.insertId,
      ticketCode,
      queueNumber,
      appointmentDate,
      service: { id: service.id, name: service.name, slug: service.slug },
      patient: {
        id: patientId,
        patientCode: patient.patient_code,
        firstName: patient.first_name,
      },
      status: 'confirmed',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getAvailability, confirmBooking, getServiceById };
