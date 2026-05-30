const pool = require('../config/db');

async function createAlert(alertType, title, message, referenceType = null, referenceId = null) {
  await pool.execute(
    `INSERT INTO alerts (alert_type, title, message, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?)`,
    [alertType, title, message, referenceType, referenceId]
  );
}

module.exports = { createAlert };
