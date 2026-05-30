import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', hospitalName: '', reason: '', diagnosisSummary: '' });
  const [error, setError] = useState('');

  const load = () => {
    api.getReferrals().then(setReferrals).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    api.getPatients().then(setPatients).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createReferral({
        patientId: Number(form.patientId),
        hospitalName: form.hospitalName,
        reason: form.reason,
        diagnosisSummary: form.diagnosisSummary,
      });
      setShowForm(false);
      setForm({ patientId: '', hospitalName: '', reason: '', diagnosisSummary: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Hospital Referrals</h2>
          <p>Send digital records to higher-level hospitals</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Referral'}
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
              <label>Hospital</label>
              <input required value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Reason</label>
              <input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Diagnosis Summary</label>
              <input value={form.diagnosisSummary} onChange={(e) => setForm({ ...form, diagnosisSummary: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Send Referral</button>
        </form>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Hospital</th>
              <th>Reason</th>
              <th>Referred By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>{r.first_name} {r.last_name}</td>
                <td>{r.hospital_name}</td>
                <td>{r.reason}</td>
                <td>{r.referred_by_name}</td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
