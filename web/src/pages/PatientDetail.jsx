import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPatient(id).then(setPatient).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!patient) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/patients" className="back-link">&larr; Back to Patients</Link>
          <h2>{patient.first_name} {patient.last_name}</h2>
          <p><code>{patient.patient_code}</code></p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>Profile</h3>
          <dl className="detail-list">
            <dt>Phone</dt><dd>{patient.phone || '-'}</dd>
            <dt>Address</dt><dd>{patient.address || '-'}</dd>
            <dt>Barangay</dt><dd>{patient.barangay || '-'}</dd>
            <dt>Gender</dt><dd>{patient.gender || '-'}</dd>
            <dt>Birth Date</dt><dd>{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString() : '-'}</dd>
            <dt>Blood Type</dt><dd>{patient.blood_type || '-'}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>Recent Vitals</h3>
          {patient.vitals?.length === 0 ? (
            <p className="empty">No vitals recorded</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>BP</th><th>HR</th><th>Weight</th><th>Risk</th></tr>
              </thead>
              <tbody>
                {patient.vitals.map((v) => (
                  <tr key={v.id} className={v.is_high_risk ? 'row-danger' : ''}>
                    <td>{new Date(v.recorded_at).toLocaleDateString()}</td>
                    <td>{v.blood_pressure_systolic || '-'}/{v.blood_pressure_diastolic || '-'}</td>
                    <td>{v.heart_rate || '-'}</td>
                    <td>{v.weight_kg ? `${v.weight_kg} kg` : '-'}</td>
                    <td>{v.is_high_risk ? <span className="badge badge-danger">High Risk</span> : 'Normal'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Appointments</h3>
          {patient.appointments?.length === 0 ? (
            <p className="empty">No appointments</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Queue</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {patient.appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                    <td>{a.queue_number || '-'}</td>
                    <td>{a.reason}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
