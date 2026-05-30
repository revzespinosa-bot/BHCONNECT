import { useEffect, useState } from 'react';
import { api } from '../api';

const today = new Date().toISOString().slice(0, 10);

export default function HomeVisits() {
  const [visits, setVisits] = useState([]);
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getHomeVisits(date).then(setVisits).catch((err) => setError(err.message));
  }, [date]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>BHW Home Visits</h2>
          <p>Today&apos;s field visit list for barangay health workers</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="info-banner">
        BHWs download this list before leaving the health center, record vitals offline in the mobile app, and data syncs automatically when back online.
      </div>

      <div className="toolbar">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 ? (
              <tr><td colSpan="5" className="empty">No home visits scheduled</td></tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id}>
                  <td>{v.first_name} {v.last_name} <code>{v.patient_code}</code></td>
                  <td>{v.address || '-'}</td>
                  <td>{v.phone || '-'}</td>
                  <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                  <td>{v.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
