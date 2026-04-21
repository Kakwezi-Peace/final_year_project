import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, LayoutDashboard, Home, Activity, 
  CreditCard, BarChart3, ListOrdered,
  Search, Sun, Moon, Bell, Settings, User
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import ProfileModal from './ProfileModal';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { theme, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ['hero', 'about', 'services', 'media', 'contact'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const handleNavClick = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const isPrivileged = ['ADMIN', 'MANAGER', 'STAFF'].includes(user.role);
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user.role);

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner" style={{ flexWrap: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo Section */}
            <Link to="/" className="nav-brand">
               <img 
                src="/assets/rubis-logo.webp" 
                alt="Rubis" 
                style={{ height: '80px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(227,6,19,0.3))' }} 
              />
              <div className="nav-brand-text hide-mobile" style={{ marginLeft: '0.8rem' }}>
                <span className="nav-brand-name" style={{ fontSize: '1.6rem' }}>RUBIS</span>
                <span className="nav-brand-sub" style={{ fontSize: '0.9rem' }}>Wash Standard</span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          {token && isPrivileged && (
            <div style={{ position: 'relative', width: '320px', margin: '0 1.5rem' }} className="hide-mobile">
              <input 
                type="text" 
                placeholder="SEARCH..." 
                className="input-field"
                style={{ 
                  borderRadius: '50px', 
                  paddingLeft: '1.5rem', 
                  background: 'var(--surface)',
                  height: '42px',
                  fontSize: '0.85rem'
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Links & Controls */}
          <div className="nav-links">
            {location.pathname === '/' && (
              <div style={{ display: 'flex', gap: '0.5rem' }} className="hide-mobile">
                {[
                  { id: 'about', label: 'About' },
                  { id: 'services', label: 'Services' },
                  { id: 'media', label: 'Media' },
                  { id: 'contact', label: 'Contact' }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                    style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <span style={{ 
                        position: 'absolute', 
                        bottom: '-5px', 
                        left: '0', 
                        width: '100%', 
                        height: '2px', 
                        background: 'var(--rubis-red)',
                        boxShadow: '0 0 8px var(--rubis-red)'
                      }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {!token ? (
              <>
                {location.pathname !== '/' && <Link to="/" className="nav-link">Home</Link>}
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', marginLeft: '0.5rem', borderRadius: '50px' }}
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                  <span className="hide-mobile">DASHBOARD</span>
                </Link>

                {isPrivileged && (
                  <div style={{ display: 'flex', gap: '0.5rem' }} className="hide-mobile">
                    <Link to="/queue" className={`nav-link ${isActive('/queue')}`}>
                      <span>QUEUE</span>
                    </Link>
                    <Link to="/operations" className={`nav-link ${isActive('/operations')}`}>
                      <span>OPERATIONS</span>
                    </Link>
                    <Link to="/payments" className={`nav-link ${isActive('/payments')}`}>
                      <span>PAYMENTS</span>
                    </Link>
                  </div>
                )}

                <button 
                  onClick={() => setShowProfile(true)}
                  style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    overflow: 'hidden', border: '2px solid var(--rubis-red)', 
                    cursor: 'pointer', padding: 0, marginLeft: '0.5rem'
                  }}
                >
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName || user.username}`} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              </>
            )}

            {/* Global Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ 
                borderRadius: '50%', 
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border-white)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {showProfile && token && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
};

export default Navbar;
