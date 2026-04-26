import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const GuestRegister = () => {
  const [formData, setFormData] = useState({ fullName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/guest-register', formData);
      localStorage.setItem('token', data.accessToken);
      
      const profileResponse = await api.get('/auth/me');
      const user = profileResponse.data;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Guest immediately goes to dashboard with booking modal open
      navigate('/dashboard?book=true');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to register as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* LEFT SIDE: HERO IMAGE */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        overflow: 'hidden'
      }} className="hide-mobile">
        <img 
          src="/assets/rubis-logo.webp" 
          alt="Rubis Station" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 1,
            filter: 'none'
          }}
        />
        
        {/* Overlay content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(225deg, rgba(227,6,19,0.4) 0%, rgba(2,6,23,0.95) 70%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem'
        }}>
          <div style={{
            width: '80px', height: '80px', background: 'var(--rubis-red)', 
            borderRadius: '20px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', marginBottom: '2rem', boxShadow: 'var(--shadow-red)',
            color: 'white', fontWeight: '900', fontSize: '1.25rem'
          }}>
            RUBIS
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Book as a <br /> <span style={{ color: 'var(--rubis-red)' }}>Guest</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
            Quickly secure your spot without creating a full account. Your details will be safely removed 7 days after your booking.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: GUEST FORM */}
      <div style={{
        flex: '0 0 520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-secondary)',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '400px' }}>
          
          <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.5rem' }}>Guest Booking</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Enter your details to proceed to booking</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="fullName"
                  className="input-field"
                  style={{ height: '52px' }}
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  style={{ height: '52px' }}
                  placeholder="078..."
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', height: '52px', fontSize: '1.05rem' }}
              disabled={loading}
            >
              {loading
                ? 'PROCESSING...'
                : 'CONTINUE TO BOOKING'
              }
            </button>
          </form>

          <div style={{
            marginTop: '2.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-white)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--rubis-red)', fontWeight: '800', textDecoration: 'none' }}>
                Sign In →
              </Link>
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
              <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
                ← Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestRegister;
