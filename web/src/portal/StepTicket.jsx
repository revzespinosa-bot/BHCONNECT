export default function StepTicket({ ticket, onBookAnother }) {
  const formattedDate = new Date(ticket.appointmentDate + 'T12:00:00').toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="portal-step portal-ticket-step">
      <div className="ticket-card">
        <div className="ticket-header">
          <span className="ticket-check">✓</span>
          <h2>Booking confirmed</h2>
          <p>Your slot has been locked and linked to your registry profile.</p>
        </div>

        <div className="ticket-code">{ticket.ticketCode}</div>

        <div className="ticket-details">
          <div className="ticket-row">
            <span>Queue number</span>
            <strong className="queue-num">#{ticket.queueNumber}</strong>
          </div>
          <div className="ticket-row">
            <span>Service</span>
            <strong>{ticket.service.name}</strong>
          </div>
          <div className="ticket-row">
            <span>Date</span>
            <strong>{formattedDate}</strong>
          </div>
          <div className="ticket-row">
            <span>Patient</span>
            <strong>{ticket.patient.firstName} ({ticket.patient.patientCode})</strong>
          </div>
          <div className="ticket-row">
            <span>Status</span>
            <strong className="ticket-status">{ticket.status}</strong>
          </div>
        </div>

        <p className="ticket-footer">
          Please arrive at the barangay health center on your scheduled date. Show this ticket or your queue number at the desk.
        </p>
      </div>

      <button type="button" className="portal-btn portal-btn-primary" onClick={onBookAnother}>
        Book another appointment
      </button>
    </div>
  );
}
