import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CircleHelp, HandHelping, House, LogIn, LogOut, Menu, MessageSquareText, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: t.home, to: '/', icon: House },
    { label: t.about, to: '/about', icon: CircleHelp },
    { label: t.services, to: '/services', icon: HandHelping },
    { label: t.contact, to: '/contact', icon: MessageSquareText },
    { label: t.login, to: '/login', icon: LogIn },
    { label: t.register, to: '/register', icon: UserPlus },
  ];

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'passenger') return '/dashboard/passenger';
    if (user.role === 'staff') return '/dashboard/staff';
    return '/dashboard/admin';
  };

  const closeMenu = () => setMenuOpen(false);

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

          <nav className={`main-nav${menuOpen ? ' mobile-open' : ''}`} aria-label="Main navigation" aria-expanded={menuOpen} id="main-navigation">
            {navItems
              .filter((item) => {
                if (user && item.to === '/login') return false;
                if (user && item.to === '/register') return false;
                return true;
              })
              .map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            {user && (
              <NavLink to={getDashboardLink()} className="nav-link dashboard-link" onClick={closeMenu}>
                {t.dashboard}
              </NavLink>
            )}
          </nav>

          <div className="nav-actions">
            <div className="lang-switcher" aria-label={t.language}>
              <button
                type="button"
                className={language === 'en' ? 'lang-button active' : 'lang-button'}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                className={language === 'rw' ? 'lang-button active' : 'lang-button'}
                onClick={() => setLanguage('rw')}
                aria-pressed={language === 'rw'}
              >
                RW
              </button>
            </div>
            {user ? (
              <button type="button" className="btn btn-light" onClick={handleLogout}>
                <LogOut size={16} />
                <span>{t.logout}</span>
              </button>
            ) : (
              <NavLink className="btn btn-primary" to="/login" onClick={closeMenu}>
                <LogIn size={16} />
                <span>{t.login}</span>
              </NavLink>
            )}
            <button
              type="button"
              className="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Toggle menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
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
