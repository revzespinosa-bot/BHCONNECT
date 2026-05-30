import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getAlerts('true'),
      api.getAppointments(new Date().toISOString().slice(0, 10)),
    ])
      .then(([s, a, appts]) => {
        setStats(s);
        setAlerts(a.slice(0, 5));
        setAppointments(appts.slice(0, 5));
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="alert alert-error">
        Could not load dashboard. Make sure the backend is running and the database is set up. ({error})
      </div>
    );
  }

  if (!stats) return <div className="loading">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Patients', value: stats.patientCount, color: 'blue', link: '/patients' },
    { label: "Today's Appointments", value: stats.todayAppointments, color: 'green', link: '/appointments' },
    { label: 'In Queue', value: stats.pendingQueue, color: 'orange', link: '/appointments' },
    { label: 'Low Stock Items', value: stats.lowStockItems, color: 'red', link: '/inventory' },
    { label: 'High-Risk Vitals', value: stats.highRiskVitals, color: 'red', link: '/vitals' },
    { label: 'Pending Home Visits', value: stats.pendingHomeVisits, color: 'purple', link: '/home-visits' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Barangay Health Center overview</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} className={`stat-card stat-${card.color}`}>
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Alerts</h3>
            <Link to="/alerts">View all</Link>
          </div>
          {alerts.length === 0 ? (
            <p className="empty">No unread alerts</p>
          ) : (
            <ul className="alert-list">
              {alerts.map((a) => (
                <li key={a.id} className={`alert-item alert-${a.alert_type}`}>
                  <strong>{a.title}</strong>
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Today&apos;s Queue</h3>
            <Link to="/appointments">View all</Link>
          </div>
          {appointments.length === 0 ? (
            <p className="empty">No appointments today</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.queue_number || '-'}</td>
                    <td>{a.first_name} {a.last_name}</td>
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
