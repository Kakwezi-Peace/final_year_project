import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfileModal from './ProfileModal';

const MainLayout = ({ children }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/queue?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!token) return <>{children}</>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar user={user} />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        <header style={{ 
          height: '70px', 
          background: 'rgba(13, 0, 0, 0.5)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 900
        }}>
           <div style={{ position: 'relative', width: '350px' }}>
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                style={{ 
                  width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: 'white', fontSize: '0.85rem'
                }} 
              />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
           </div>
           
           <div 
             onClick={() => setShowProfile(!showProfile)}
             style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', position: 'relative' }}
           >
              <div style={{ textAlign: 'right' }}>
                 <div style={{ color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>{user.fullName}</div>
                 <div style={{ color: 'var(--rubis-red)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>{user.role}</div>
              </div>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '10px', background: 'var(--rubis-red)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', 
                fontWeight: '900', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(227,6,19,0.3)',
                border: showProfile ? '2px solid white' : '2px solid transparent',
                transition: 'all 0.2s'
              }}>
                 {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
              </div>
           </div>
        </header>

        {showProfile && (
          <ProfileModal user={user} onClose={() => setShowProfile(false)} />
        )}

        <main style={{ padding: '2rem', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
