import { useEffect, useState } from 'react';
import { api } from '../api';

const today = new Date().toISOString().slice(0, 10);

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [date, setDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', reason: 'General check-up' });
  const [error, setError] = useState('');

  const load = () => {
    api.getAppointments(date).then(setAppointments).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    api.getPatients().then(setPatients).catch(() => {});
  }, [date]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createAppointment({
        patientId: Number(form.patientId),
        appointmentDate: date,
        reason: form.reason,
        bookingSource: 'web',
      });
      setShowForm(false);
      setForm({ patientId: '', reason: 'General check-up' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const completeWithFollowUp = async (id) => {
    const followUpDate = prompt('Follow-up date (YYYY-MM-DD):');
    const followUpReason = prompt('Follow-up reason:', 'Vaccine Dose 2');
    if (!followUpDate || !followUpReason) return;
    try {
      await api.updateAppointmentStatus(id, {
        status: 'completed',
        followUpDate,
        followUpReason,
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
          <h2>Appointments & Queue</h2>
          <p>Manage daily patient queue and bookings</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Book Appointment'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Patient</label>
              <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Book</button>
        </form>
      )}

      <div className="toolbar">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Queue #</th>
              <th>Patient</th>
              <th>Phone</th>
              <th>Reason</th>
              <th>Source</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.queue_number || '-'}</strong></td>
                <td>{a.first_name} {a.last_name}</td>
                <td>{a.phone || '-'}</td>
                <td>{a.reason}</td>
                <td>{a.booking_source}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td className="actions">
                  {a.status !== 'in_queue' && a.status !== 'completed' && (
                    <button type="button" className="btn btn-sm" onClick={() => updateStatus(a.id, 'in_queue')}>Queue</button>
                  )}
                  {a.status !== 'completed' && (
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => completeWithFollowUp(a.id)}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
