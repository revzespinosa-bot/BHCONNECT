export default function StepConfirm({ patient, service, selectedDate, onBack, onConfirm, loading, error }) {
  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="portal-step">
      <div className="portal-step-header">
        <span className="step-badge">Step 4</span>
        <h2>Confirm your booking</h2>
        <p>Review your details before we generate your queue ticket.</p>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <div className="confirm-card">
        <div className="confirm-row">
          <span>Patient</span>
          <strong>{patient?.firstName} {patient?.lastName}</strong>
        </div>
        <div className="confirm-row">
          <span>Registry ID</span>
          <strong><code>{patient?.patientCode}</code></strong>
        </div>
        <div className="confirm-row">
          <span>Service</span>
          <strong>{service?.icon} {service?.name}</strong>
        </div>
        <div className="confirm-row">
          <span>Date</span>
          <strong>{formattedDate}</strong>
        </div>
      </div>

      <div className="portal-actions">
        <button type="button" className="portal-btn portal-btn-secondary" onClick={onBack} disabled={loading}>
          Back
        </button>
        <button type="button" className="portal-btn portal-btn-primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Confirming...' : 'Confirm booking'}
        </button>
      </div>
    </div>
  );
}
