const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getPatientToken() {
  return localStorage.getItem('bhc_patient_token');
}

async function portalRequest(path, options = {}, auth = true) {
  const token = getPatientToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}/portal${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const portalApi = {
  requestCode: (phone) =>
    portalRequest('/auth/request-code', { method: 'POST', body: JSON.stringify({ phone }) }, false),

  verifyCode: (phone, code) =>
    portalRequest('/auth/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }, false),

  getServices: () => portalRequest('/services'),

  getAvailability: (serviceId, year, month) =>
    portalRequest(`/availability?serviceId=${serviceId}&year=${year}&month=${month}`),

  confirmBooking: (serviceId, appointmentDate) =>
    portalRequest('/bookings/confirm', {
      method: 'POST',
      body: JSON.stringify({ serviceId, appointmentDate }),
    }),

  getMyBookings: () => portalRequest('/bookings/me'),

  saveSession: (token, patient) => {
    localStorage.setItem('bhc_patient_token', token);
    localStorage.setItem('bhc_patient', JSON.stringify(patient));
  },

  clearSession: () => {
    localStorage.removeItem('bhc_patient_token');
    localStorage.removeItem('bhc_patient');
  },

  getStoredPatient: () => {
    const raw = localStorage.getItem('bhc_patient');
    return raw ? JSON.parse(raw) : null;
  },
};
