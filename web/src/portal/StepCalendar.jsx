import { useEffect, useState } from 'react';
import { portalApi } from './portalApi';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StepCalendar({ service, selectedDate, onSelectDate, onBack, onContinue }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!service) return;
    setLoading(true);
    setError('');
    portalApi
      .getAvailability(service.id, viewYear, viewMonth)
      .then((data) => setDays(data.days))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [service, viewYear, viewMonth]);

  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
  const blanks = Array(firstDow).fill(null);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthLabel = new Date(viewYear, viewMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const selectedDayInfo = days.find((d) => d.date === selectedDate);

  return (
    <div className="portal-step">
      <div className="portal-step-header">
        <span className="step-badge">Step 3</span>
        <h2>Select your appointment date</h2>
        <p>
          Booking for <strong>{service?.icon} {service?.name}</strong>. Full days are grayed out automatically.
        </p>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <div className="calendar-card">
        <div className="calendar-nav">
          <button type="button" className="portal-btn portal-btn-icon" onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <h3>{monthLabel}</h3>
          <button type="button" className="portal-btn portal-btn-icon" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
        </div>

        {loading ? (
          <p className="portal-loading">Loading available dates...</p>
        ) : (
          <>
            <div className="calendar-weekdays">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {blanks.map((_, i) => (
                <span key={`b-${i}`} className="calendar-cell empty" />
              ))}
              {days.map((day) => {
                const dayNum = parseInt(day.date.slice(-2), 10);
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={!day.available}
                    className={`calendar-cell day${!day.available ? ' disabled' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => onSelectDate(day.date)}
                    title={
                      !day.available
                        ? day.reason === 'full'
                          ? 'Fully booked'
                          : day.reason === 'service_unavailable'
                            ? 'Service not available this day'
                            : 'Unavailable'
                        : `${day.remaining} slots left`
                    }
                  >
                    <span className="day-num">{dayNum}</span>
                    {day.available && day.remaining <= 5 && (
                      <span className="day-slots">{day.remaining} left</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="calendar-legend">
          <span><i className="dot available" /> Available</span>
          <span><i className="dot full" /> Full / unavailable</span>
        </div>
      </div>

      {selectedDate && selectedDayInfo && (
        <div className="portal-selection-summary">
          Selected: <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
          {' '}— {selectedDayInfo.remaining} slot{selectedDayInfo.remaining !== 1 ? 's' : ''} remaining
        </div>
      )}

      <div className="portal-actions">
        <button type="button" className="portal-btn portal-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="portal-btn portal-btn-primary"
          disabled={!selectedDate}
          onClick={onContinue}
        >
          Review booking
        </button>
      </div>
    </div>
  );
}
