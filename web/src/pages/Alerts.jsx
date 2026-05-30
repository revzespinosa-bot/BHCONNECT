import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    api.getAlerts().then(setAlerts).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.markAlertRead(id);
    load();
  };

  const markAllRead = async () => {
    await api.markAllAlertsRead();
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>System Alerts</h2>
          <p>Low stock, high-risk vitals, and follow-up notifications</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={markAllRead}>Mark all read</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {alerts.length === 0 ? (
          <p className="empty">No alerts</p>
        ) : (
          <ul className="alert-list full">
            {alerts.map((a) => (
              <li key={a.id} className={`alert-item alert-${a.alert_type}${a.is_read ? ' read' : ''}`}>
                <div>
                  <strong>{a.title}</strong>
                  <span>{a.message}</span>
                  <small>{new Date(a.created_at).toLocaleString()}</small>
                </div>
                {!a.is_read && (
                  <button type="button" className="btn btn-sm" onClick={() => markRead(a.id)}>Mark read</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
