import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const NavigationArrows = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      top: '80px', // Just below the navbar
      left: '2rem',
      display: 'flex',
      gap: '1.5rem',
      zIndex: 800,
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          transition: 'opacity 0.2s ease, color 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        title="Go Back"
      >
        <ArrowLeft size={28} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => navigate(1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          transition: 'opacity 0.2s ease, color 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        title="Go Forward"
      >
        <ArrowRight size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default NavigationArrows;
