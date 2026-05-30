const pool = require('../config/db');
const { sendSms } = require('./smsService');

const OTP_EXPIRY_MINUTES = 10;

function normalizePhone(phone) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('63')) p = '0' + p.slice(2);
  if (p.length === 10 && !p.startsWith('0')) p = '0' + p;
  return p;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtp(phone) {
  const normalized = normalizePhone(phone);

  const [patients] = await pool.execute(
    'SELECT id, first_name, last_name FROM patients WHERE phone = ?',
    [normalized]
  );

  if (patients.length === 0) {
    const err = new Error('This mobile number is not registered. Please visit the barangay health center to register.');
    err.status = 404;
    throw err;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await pool.execute(
    'UPDATE patient_otp_codes SET used = TRUE WHERE phone = ? AND used = FALSE',
    [normalized]
  );

  await pool.execute(
    'INSERT INTO patient_otp_codes (phone, code, expires_at) VALUES (?, ?, ?)',
    [normalized, code, expiresAt]
  );

  const message = `BarangayHealth Connect verification code: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
  await sendSms(normalized, message, patients[0].id);

  const response = {
    message: 'Verification code sent to your mobile number.',
    phoneMasked: normalized.slice(0, 4) + '***' + normalized.slice(-4),
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.devCode = code;
  }

  return { patient: patients[0], ...response };
}

async function verifyOtp(phone, code) {
  const normalized = normalizePhone(phone);

  const [rows] = await pool.execute(
    `SELECT * FROM patient_otp_codes
     WHERE phone = ? AND code = ? AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [normalized, code]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid or expired verification code.');
    err.status = 401;
    throw err;
  }

  await pool.execute('UPDATE patient_otp_codes SET used = TRUE WHERE id = ?', [rows[0].id]);

  const [patients] = await pool.execute(
    'SELECT id, patient_code, first_name, last_name, phone, barangay FROM patients WHERE phone = ?',
    [normalized]
  );

  return patients[0];
}

module.exports = { normalizePhone, requestOtp, verifyOtp };
