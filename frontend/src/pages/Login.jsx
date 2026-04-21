import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Ensure a clean start – clear any existing sessions before logging in
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
      const { data } = await api.post('/auth/login', formData);
      localStorage.setItem('token', data.accessToken);
      
      const profileResponse = await api.get('/auth/me');
      const user = profileResponse.data;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Role-Based Direct Navigation
      if (user.role === 'STAFF') {
        navigate('/queue'); // Staff goes straight to work
      } else if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        navigate('/dashboard'); // Management goes to reports
      } else {
        navigate('/dashboard'); // Customers see their status
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid username or password. Please try again.');
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
        {/* The Branded Image */}
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
            The Rubis <br /> <span style={{ color: 'var(--rubis-red)' }}>Standard</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
            Rwanda's leading professional car wash and detailing service. Expert care for your vehicle, backed by excellence. We ensure your car looks its very best on every single visit!
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
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
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.5rem' }}>Welcome Home</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to manage your bookings</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="username"
                  className="input-field"
                  style={{ height: '52px' }}
                  placeholder="USERNAME"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
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
                  style={{ height: '52px' }}
                  placeholder="PASSWORD"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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
                ? 'AUTHENTICATING...'
                : 'LOGIN TO DASHBOARD'
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
              New to Rubis?{' '}
              <Link to="/register" style={{ color: 'var(--rubis-red)', fontWeight: '800', textDecoration: 'none' }}>
                Create account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
