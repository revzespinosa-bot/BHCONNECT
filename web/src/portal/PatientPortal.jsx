import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { portalApi } from './portalApi';
import StepAuth from './StepAuth';
import StepServices from './StepServices';
import StepCalendar from './StepCalendar';
import StepConfirm from './StepConfirm';
import StepTicket from './StepTicket';
import './portal.css';

const STEPS = ['auth', 'services', 'calendar', 'confirm', 'ticket'];

export default function PatientPortal() {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState(() => portalApi.getStoredPatient());
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = portalApi.getStoredPatient();
    const token = localStorage.getItem('bhc_patient_token');
    if (stored && token) {
      setPatient(stored);
      setStep(1);
      portalApi.getServices().then(setServices).catch(() => portalApi.clearSession());
    }
  }, []);

  const loadServices = async () => {
    try {
      const data = await portalApi.getServices();
      setServices(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerified = async (p) => {
    setPatient(p);
    setStep(1);
    await loadServices();
  };

  const handleServiceSelect = (service, advance) => {
    setSelectedService(service);
    setSelectedDate(null);
    if (advance) setStep(2);
  };

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await portalApi.confirmBooking(selectedService.id, selectedDate);
      setTicket(result);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAnother = () => {
    setSelectedService(null);
    setSelectedDate(null);
    setTicket(null);
    setError('');
    setStep(1);
    loadServices();
  };

  const handleLogout = () => {
    portalApi.clearSession();
    setPatient(null);
    setStep(0);
    setSelectedService(null);
    setSelectedDate(null);
    setTicket(null);
  };

  const stepIndex = step < 4 ? step : 3;

  return (
    <div className="portal-layout">
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-logo">+</span>
          <div>
            <strong>BarangayHealth Connect</strong>
            <span>Patient Booking Portal</span>
          </div>
        </div>
        {patient && step > 0 && step < 4 && (
          <div className="portal-user">
            <span>Hi, {patient.firstName}</span>
            <button type="button" className="portal-btn portal-btn-link" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </header>

      {step < 4 && (
        <div className="portal-progress">
          {STEPS.slice(0, 4).map((label, i) => (
            <div key={label} className={`progress-step${i <= stepIndex ? ' active' : ''}${i === stepIndex ? ' current' : ''}`}>
              <span className="progress-dot">{i + 1}</span>
              <span className="progress-label">
                {['Login', 'Service', 'Date', 'Confirm'][i]}
              </span>
            </div>
          ))}
        </div>
      )}

      <main className="portal-main">
        {step === 0 && <StepAuth onVerified={handleVerified} />}
        {step === 1 && (
          <StepServices
            services={services}
            selected={selectedService}
            onSelect={handleServiceSelect}
            onBack={handleLogout}
          />
        )}
        {step === 2 && (
          <StepCalendar
            service={selectedService}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            patient={patient}
            service={selectedService}
            selectedDate={selectedDate}
            onBack={() => setStep(2)}
            onConfirm={handleConfirm}
            loading={loading}
            error={error}
          />
        )}
        {step === 4 && ticket && (
          <StepTicket ticket={ticket} onBookAnother={handleBookAnother} />
        )}
      </main>

      <footer className="portal-footer">
        <Link to="/login">Staff login</Link>
      </footer>
    </div>
  );
}
