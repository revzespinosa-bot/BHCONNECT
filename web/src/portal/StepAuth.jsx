import { useState } from 'react';
import { portalApi } from './portalApi';

export default function StepAuth({ onVerified }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState('phone');
  const [masked, setMasked] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await portalApi.requestCode(phone);
      setMasked(result.phoneMasked);
      if (result.devCode) setDevCode(result.devCode);
      setPhase('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, patient } = await portalApi.verifyCode(phone, code);
      portalApi.saveSession(token, patient);
      onVerified(patient);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-step">
      <div className="portal-step-header">
        <span className="step-badge">Step 1</span>
        <h2>Sign in with your mobile number</h2>
        <p>Use the phone number registered at your barangay health center.</p>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {phase === 'phone' ? (
        <form className="portal-form" onSubmit={handleRequestCode}>
          <label htmlFor="phone">Mobile number</label>
          <input
            id="phone"
            type="tel"
            placeholder="09XX XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit" className="portal-btn portal-btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send verification code'}
          </button>
        </form>
      ) : (
        <form className="portal-form" onSubmit={handleVerify}>
          <p className="portal-hint">Code sent to {masked}</p>
          {devCode && (
            <p className="portal-dev-code">Dev code: <strong>{devCode}</strong></p>
          )}
          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
          <button type="submit" className="portal-btn portal-btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & continue'}
          </button>
          <button type="button" className="portal-btn portal-btn-link" onClick={() => setPhase('phone')}>
            Use a different number
          </button>
        </form>
      )}

      <p className="portal-demo-hint">Demo: use 09171111111 (Pedro Garcia)</p>
    </div>
  );
}
