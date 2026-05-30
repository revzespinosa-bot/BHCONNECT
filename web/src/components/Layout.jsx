import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◉' },
  { to: '/patients', label: 'Patients', icon: '👤' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
  { to: '/vitals', label: 'Vitals', icon: '♥' },
  { to: '/home-visits', label: 'Home Visits', icon: '🏠' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/alerts', label: 'Alerts', icon: '🔔' },
  { to: '/referrals', label: 'Referrals', icon: '🏥' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">+</span>
          <div>
            <strong>BarangayHealth</strong>
            <small>Connect</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user?.fullName}</strong>
            <span>{user?.role}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
