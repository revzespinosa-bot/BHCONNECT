const pool = require('../config/db');
const { createAlert } = require('./alertService');

const HIGH_BP_SYSTOLIC = 140;
const HIGH_BP_DIASTOLIC = 90;

function evaluateVitalRisk(vitals) {
  const sys = vitals.blood_pressure_systolic;
  const dia = vitals.blood_pressure_diastolic;
  if (sys >= HIGH_BP_SYSTOLIC || dia >= HIGH_BP_DIASTOLIC) {
    return { isHighRisk: true, notes: `Elevated BP: ${sys}/${dia} mmHg` };
  }
  if (vitals.blood_sugar_mg_dl && vitals.blood_sugar_mg_dl > 200) {
    return { isHighRisk: true, notes: `High blood sugar: ${vitals.blood_sugar_mg_dl} mg/dL` };
  }
  return { isHighRisk: false, notes: null };
}

async function processSyncItem(item) {
  const payload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;

  if (item.entity_type === 'vitals') {
    const risk = evaluateVitalRisk(payload);
    const [result] = await pool.execute(
      `INSERT INTO vitals
       (patient_id, recorded_by, home_visit_id, weight_kg, height_cm,
        blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
        temperature_c, blood_sugar_mg_dl, is_high_risk, risk_notes,
        sync_status, local_id, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, NOW())`,
      [
        payload.patient_id,
        item.user_id,
        payload.home_visit_id || null,
        payload.weight_kg || null,
        payload.height_cm || null,
        payload.blood_pressure_systolic || null,
        payload.blood_pressure_diastolic || null,
        payload.heart_rate || null,
        payload.temperature_c || null,
        payload.blood_sugar_mg_dl || null,
        risk.isHighRisk,
        risk.notes,
        item.local_id,
      ]
    );

    if (risk.isHighRisk) {
      const [patients] = await pool.execute('SELECT first_name, last_name FROM patients WHERE id = ?', [payload.patient_id]);
      const p = patients[0];
      await createAlert(
        'high_risk_vital',
        'High-Risk Vital Sign Detected',
        `${p.first_name} ${p.last_name}: ${risk.notes}`,
        'vitals',
        result.insertId
      );
    }

    return { entityId: result.insertId, type: 'vitals' };
  }

  if (item.entity_type === 'home_visit') {
    await pool.execute(
      `UPDATE home_visits SET status = ?, notes = ? WHERE id = ?`,
      [payload.status || 'completed', payload.notes || null, payload.home_visit_id]
    );
    return { entityId: payload.home_visit_id, type: 'home_visit' };
  }

  throw new Error(`Unknown entity type: ${item.entity_type}`);
}

async function syncPendingItems(userId, deviceId) {
  const [items] = await pool.execute(
    `SELECT * FROM sync_queue
     WHERE user_id = ? AND device_id = ? AND status = 'pending'
     ORDER BY created_at`,
    [userId, deviceId]
  );

  const results = [];
  for (const item of items) {
    try {
      await pool.execute(`UPDATE sync_queue SET status = 'processing' WHERE id = ?`, [item.id]);
      const result = await processSyncItem(item);
      await pool.execute(
        `UPDATE sync_queue SET status = 'completed', synced_at = NOW() WHERE id = ?`,
        [item.id]
      );
      results.push({ localId: item.local_id, status: 'completed', ...result });
    } catch (err) {
      await pool.execute(
        `UPDATE sync_queue SET status = 'failed', error_message = ? WHERE id = ?`,
        [err.message, item.id]
      );
      results.push({ localId: item.local_id, status: 'failed', error: err.message });
    }
  }

  return results;
}

async function queueOfflineData(userId, deviceId, items) {
  const queued = [];
  for (const item of items) {
    const [result] = await pool.execute(
      `INSERT INTO sync_queue (device_id, user_id, entity_type, local_id, payload, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, deviceId, item.entity_type, item.local_id, JSON.stringify(item.payload)]
    );
    queued.push({ id: result.insertId, localId: item.local_id });
  }
  return queued;
}

module.exports = { evaluateVitalRisk, processSyncItem, syncPendingItems, queueOfflineData };
