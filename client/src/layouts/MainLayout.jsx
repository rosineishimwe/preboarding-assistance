import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CircleHelp, HandHelping, House, LogIn, LogOut, Menu, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Home', to: '/', icon: House },
  { label: 'About', to: '/about', icon: CircleHelp },
  { label: 'Services', to: '/services', icon: HandHelping },
  { label: 'Login', to: '/login', icon: LogIn },
  { label: 'Register', to: '/register', icon: UserPlus },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'passenger') return '/dashboard/passenger';
    if (user.role === 'staff') return '/dashboard/staff';
    return '/dashboard/admin';
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container nav-wrapper">
          <div className="brand-block">
            <div className="brand-mark">NCPD</div>
            <div>
              <div className="brand-title">Pre-Boarding Assistance</div>
              <div className="brand-subtitle">Kigali, Rwanda</div>
            </div>
          </div>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems
              .filter((item) => {
                if (user && item.to === '/login') return false;
                if (user && item.to === '/register') return false;
                return true;
              })
              .map(({ label, to, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            {user && (
              <NavLink to={getDashboardLink()} className="nav-link dashboard-link">
                Dashboard
              </NavLink>
            )}
          </nav>

          <div className="nav-actions">
            {user ? (
              <button type="button" className="btn btn-light" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <NavLink className="btn btn-primary" to="/login">
                <LogIn size={16} />
                Login
              </NavLink>
            )}
            <button type="button" className="mobile-menu" aria-label="Toggle menu">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
