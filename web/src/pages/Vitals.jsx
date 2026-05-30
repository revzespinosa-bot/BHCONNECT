import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Vitals() {
  const [vitals, setVitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    weightKg: '',
    temperatureC: '',
  });
  const [error, setError] = useState('');

  const load = () => {
    const params = highRiskOnly ? { highRisk: 'true' } : {};
    api.getVitals(params).then(setVitals).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    api.getPatients().then(setPatients).catch(() => {});
  }, [highRiskOnly]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.recordVitals({
        patientId: Number(form.patientId),
        bloodPressureSystolic: form.bloodPressureSystolic ? Number(form.bloodPressureSystolic) : null,
        bloodPressureDiastolic: form.bloodPressureDiastolic ? Number(form.bloodPressureDiastolic) : null,
        heartRate: form.heartRate ? Number(form.heartRate) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        temperatureC: form.temperatureC ? Number(form.temperatureC) : null,
      });
      setShowForm(false);
      setForm({
        patientId: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        weightKg: '',
        temperatureC: '',
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Vitals Monitoring</h2>
          <p>Record and review patient vital signs</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Record Vitals'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Patient</label>
              <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>BP Systolic</label>
              <input type="number" value={form.bloodPressureSystolic} onChange={(e) => setForm({ ...form, bloodPressureSystolic: e.target.value })} />
            </div>
            <div className="form-group">
              <label>BP Diastolic</label>
              <input type="number" value={form.bloodPressureDiastolic} onChange={(e) => setForm({ ...form, bloodPressureDiastolic: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Heart Rate</label>
              <input type="number" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Temp (°C)</label>
              <input type="number" step="0.1" value={form.temperatureC} onChange={(e) => setForm({ ...form, temperatureC: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Save Vitals</button>
        </form>
      )}

      <div className="toolbar">
        <label className="checkbox-label">
          <input type="checkbox" checked={highRiskOnly} onChange={(e) => setHighRiskOnly(e.target.checked)} />
          Show high-risk only
        </label>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>BP</th>
              <th>HR</th>
              <th>Weight</th>
              <th>Temp</th>
              <th>Recorded By</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {vitals.map((v) => (
              <tr key={v.id} className={v.is_high_risk ? 'row-danger' : ''}>
                <td>{new Date(v.recorded_at).toLocaleString()}</td>
                <td>{v.first_name} {v.last_name}</td>
                <td>{v.blood_pressure_systolic || '-'}/{v.blood_pressure_diastolic || '-'}</td>
                <td>{v.heart_rate || '-'}</td>
                <td>{v.weight_kg ? `${v.weight_kg} kg` : '-'}</td>
                <td>{v.temperature_c ? `${v.temperature_c}°C` : '-'}</td>
                <td>{v.recorded_by_name || '-'}</td>
                <td>{v.is_high_risk ? <span className="badge badge-danger">High Risk</span> : 'Normal'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
