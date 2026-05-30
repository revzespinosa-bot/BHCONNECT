const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('bhc_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getMe: () => request('/auth/me'),

  getDashboardStats: () => request('/dashboard/stats'),

  getPatients: (search) => request(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),

  getAppointments: (date) => request(`/appointments${date ? `?date=${date}` : ''}`),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id, data) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  getVitals: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/vitals${qs ? `?${qs}` : ''}`);
  },
  recordVitals: (data) => request('/vitals', { method: 'POST', body: JSON.stringify(data) }),
  getHomeVisits: (date) => request(`/vitals/home-visits${date ? `?date=${date}` : ''}`),

  getInventory: (lowStock) => request(`/inventory${lowStock ? '?lowStock=true' : ''}`),
  deductInventory: (id, data) => request(`/inventory/${id}/deduct`, { method: 'POST', body: JSON.stringify(data) }),
  restockInventory: (id, data) => request(`/inventory/${id}/restock`, { method: 'POST', body: JSON.stringify(data) }),

  getAlerts: (unread) => request(`/alerts${unread ? '?unread=true' : ''}`),
  markAlertRead: (id) => request(`/alerts/${id}/read`, { method: 'PATCH' }),
  markAllAlertsRead: () => request('/alerts/read-all', { method: 'PATCH' }),

  getReferrals: () => request('/referrals'),
  createReferral: (data) => request('/referrals', { method: 'POST', body: JSON.stringify(data) }),
};
