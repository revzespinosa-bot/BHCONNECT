const pool = require('../config/db');
const { createAlert } = require('./alertService');

const SMS_KEYWORDS = {
  REG: 'register',
  HELP: 'help',
  BOOK: 'book',
  STATUS: 'status',
  CANCEL: 'cancel',
};

async function logSms(phone, direction, message, keyword = null, patientId = null, status = 'received') {
  const [result] = await pool.execute(
    `INSERT INTO sms_log (phone, direction, message, keyword, patient_id, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [phone, direction, message, keyword, patientId, status]
  );
  return result.insertId;
}

async function sendSms(phone, message, patientId = null) {
  const logId = await logSms(phone, 'outbound', message, null, patientId, 'sent');

  if (process.env.SMS_ENABLED === 'true') {
    // Twilio integration placeholder
    console.log(`[SMS] To ${phone}: ${message}`);
  } else {
    console.log(`[SMS Mock] To ${phone}: ${message}`);
  }

  return logId;
}

async function processInboundSms(phone, message) {
  const normalized = message.trim().toUpperCase();
  const parts = normalized.split(/\s+/);
  const keyword = parts[0];

  await logSms(phone, 'inbound', message, keyword);

  const [patients] = await pool.execute('SELECT * FROM patients WHERE phone = ?', [phone]);
  let patient = patients[0];

  if (keyword === 'REG' || normalized.startsWith('REG ')) {
    if (patient) {
      const reply = `You are already registered as ${patient.first_name} ${patient.last_name} (${patient.patient_code}).`;
      await sendSms(phone, reply, patient.id);
      return { action: 'already_registered', patient };
    }
    const reply = 'Welcome to BarangayHealth Connect! Please visit the health center or web portal to complete registration.';
    await sendSms(phone, reply);
    return { action: 'registration_prompt' };
  }

  if (keyword === 'BOOK' || normalized.startsWith('BOOK ')) {
    if (!patient) {
      const reply = 'Please register first by sending REG to this number, or visit our web portal.';
      await sendSms(phone, reply);
      return { action: 'not_registered' };
    }

    const reason = parts.slice(1).join(' ') || 'General check-up';
    const [queueResult] = await pool.execute(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue
       FROM appointments WHERE appointment_date = CURDATE()`
    );
    const queueNumber = queueResult[0].next_queue;

    const [apptResult] = await pool.execute(
      `INSERT INTO appointments (patient_id, appointment_date, queue_number, status, booking_source, reason)
       VALUES (?, CURDATE(), ?, 'confirmed', 'sms', ?)`,
      [patient.id, queueNumber, reason]
    );

    const reply = `Appointment confirmed! Queue #${queueNumber} for today. Reason: ${reason}. Please arrive at the barangay health center.`;
    await sendSms(phone, reply, patient.id);
    await logSms(phone, 'outbound', reply, 'BOOK', patient.id, 'processed');

    return { action: 'booked', appointmentId: apptResult.insertId, queueNumber };
  }

  if (keyword === 'STATUS') {
    if (!patient) {
      await sendSms(phone, 'No record found. Send REG to register.');
      return { action: 'not_registered' };
    }

    const [appointments] = await pool.execute(
      `SELECT * FROM appointments
       WHERE patient_id = ? AND appointment_date >= CURDATE() AND status NOT IN ('cancelled', 'completed')
       ORDER BY appointment_date LIMIT 1`,
      [patient.id]
    );

    if (appointments.length === 0) {
      await sendSms(phone, 'No upcoming appointments. Send BOOK to schedule one.', patient.id);
      return { action: 'no_appointment' };
    }

    const appt = appointments[0];
    const reply = `Your appointment: ${appt.appointment_date.toISOString().slice(0, 10)}, Queue #${appt.queue_number || 'TBD'}, Status: ${appt.status}.`;
    await sendSms(phone, reply, patient.id);
    return { action: 'status_sent', appointment: appt };
  }

  if (keyword === 'HELP') {
    const reply = 'BarangayHealth Connect SMS Commands:\nREG - Register\nBOOK [reason] - Book appointment\nSTATUS - Check appointment\nCANCEL - Cancel appointment\nHELP - Show this message';
    await sendSms(phone, reply, patient?.id);
    return { action: 'help_sent' };
  }

  const reply = 'Unknown command. Send HELP for available commands.';
  await sendSms(phone, reply, patient?.id);
  return { action: 'unknown_command' };
}

module.exports = { sendSms, processInboundSms, logSms, SMS_KEYWORDS };
