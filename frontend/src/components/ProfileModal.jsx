import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ user, onClose }) => {
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    onClose();
  };

  const roleColor = {
    ADMIN: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
    MANAGER: { bg: 'rgba(168,85,247,0.1)', color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
    STAFF: { bg: 'rgba(234,179,8,0.1)', color: '#facc15', border: 'rgba(234,179,8,0.25)' },
    CUSTOMER: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  };
  const rc = roleColor[user.role] || roleColor.CUSTOMER;
  const initial = (user.fullName || user.username || 'U')[0].toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '80px', right: '1rem', zIndex: 1201,
        width: '320px',
      }}>
        <div
          className="glass-panel animate-fade-in-up"
          style={{
            border: '1px solid var(--border)',
            overflow: 'hidden',
            background: 'var(--surface-solid)'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top bar */}
          <div style={{
            background: 'linear-gradient(135deg, var(--rubis-red) 0%, #b5050f 100%)',
            padding: '1.5rem 1.5rem 3rem',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-30px', right: '-20px',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
            }} />
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '6px', padding: '0.4rem 0.8rem',
                cursor: 'pointer', color: 'white',
                fontSize: '0.65rem', fontWeight: '900'
              }}
            >
              CLOSE
            </button>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              My Profile
            </p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
              Rubis Station Account
            </p>
          </div>

          {/* Avatar overlapping */}
          <div style={{ position: 'relative', marginTop: '-2.25rem', padding: '0 1.5rem' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '12px',
              background: 'var(--rubis-red)',
              border: '3px solid var(--surface-solid)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: '900', color: 'white',
              boxShadow: 'var(--shadow-red)',
            }}>
              {initial}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: '0.75rem 1.5rem 1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                {user.fullName || user.username}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                padding: '0.2rem 0.65rem', borderRadius: '50px',
                fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {user.role}
              </span>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
              padding: '0.5rem 0',
              marginBottom: '1.25rem',
            }}>
              {[
                { key: 'User', val: `@${user.username}` },
                user.email && { key: 'Email', val: user.email },
                user.phone && { key: 'Phone', val: user.phone }
              ].filter(Boolean).map(item => (
                <div key={item.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 0' }}>
                  <div style={{ textTransform: 'uppercase', fontSize: '0.65rem', color: 'var(--text-muted)', width: '60px', fontWeight: '800' }}>{item.key}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => { navigate('/dashboard'); onClose(); }}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'flex-start', border: '1px solid var(--border-white)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>DASH:</span> My Dashboard
              </button>
              
              <button
                onClick={() => { /* Potential future route */ onClose(); }}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'flex-start', border: '1px solid var(--border-white)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>ACCT:</span> Account Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="btn"
                style={{
                  marginTop: '0.5rem',
                  width: '100%', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'flex-start',
                  background: 'rgba(239,68,68,0.07)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#ef4444' }}>EXIT:</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
