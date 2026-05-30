export default function StepServices({ services, selected, onSelect, onBack }) {
  return (
    <div className="portal-step">
      <div className="portal-step-header">
        <span className="step-badge">Step 2</span>
        <h2>Choose a service</h2>
        <p>Select the type of care you need. Available dates will update based on your choice.</p>
      </div>

      <div className="service-panels">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            className={`service-panel${selected?.id === service.id ? ' selected' : ''}`}
            onClick={() => onSelect(service)}
          >
            <span className="service-icon">{service.icon}</span>
            <span className="service-name">{service.name}</span>
            <span className="service-desc">{service.description}</span>
            <span className="service-slots">Up to {service.max_slots_per_day} slots per day</span>
          </button>
        ))}
      </div>

      <div className="portal-actions">
        <button type="button" className="portal-btn portal-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="portal-btn portal-btn-primary"
          disabled={!selected}
          onClick={() => selected && onSelect(selected, true)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
