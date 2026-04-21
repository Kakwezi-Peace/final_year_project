import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    nationalId: '',
    role: 'CUSTOMER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. This username or email may already be in use.');
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
      {/* LEFT SIDE: HERO */}
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
            Join the  <br /> <span style={{ color: 'var(--rubis-red)' }}>Standard</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
            Register today to experience Rwanda's premium car wash service. Track your bookings, earn loyalty, and keep your vehicle at its best. Get VIP service starting from day one!
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: REGISTER FORM */}
      <div style={{
        flex: '0 0 600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-secondary)',
        position: 'relative',
        zIndex: 10,
        overflowY: 'auto'
      }}>
        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '480px' }}>
          
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.4rem' }}>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Experience excellence at Rubis Station</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
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
                  style={{ height: '48px' }}
                  placeholder="JEAN PAUL HABIMANA"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="username"
                    className="input-field"
                    style={{ height: '48px' }}
                    placeholder="USERNAME"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    name="phone"
                    className="input-field"
                    style={{ height: '48px' }}
                    placeholder="0788..."
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  style={{ height: '48px' }}
                  placeholder="EMAIL ADDRESS"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="address"
                  className="input-field"
                  style={{ height: '48px' }}
                  placeholder="ADDRESS"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  style={{ height: '48px' }}
                  placeholder="PASSWORD"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', height: '52px', fontSize: '1.05rem', fontWeight: '900' }}
              disabled={loading}
            >
              {loading
                ? 'SETTING UP ACCOUNT...'
                : 'CREATE YOUR ACCOUNT'
              }
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-white)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: 'var(--rubis-red)', fontWeight: '800', textDecoration: 'none' }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
