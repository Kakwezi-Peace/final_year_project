import React, { useState, useEffect } from 'react';
import api from '../services/api';

const EmployeeModal = ({ onClose, onSuccess, editData = null }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    firstName: editData?.firstName || '',
    lastName: editData?.lastName || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    position: editData?.position || 'Washing Specialist',
    nationalId: editData?.nationalId || '',
    hireDate: editData?.hireDate ? editData.hireDate.substring(0, 16) : new Date().toISOString().substring(0, 16),
    active: editData ? editData.active : true,
    createLoginAccount: false,
    role: 'STAFF'
  });

  const positions = [
    'Washing Specialist',
    'Senior Detailer',
    'Supervisor',
    'Operations Manager',
    'Receptionist',
    'Maintenance'
  ];

  const roles = [
    { value: 'STAFF', label: 'Staff (Standard Access)' },
    { value: 'MANAGER', label: 'Manager (High Level Access)' },
    { value: 'ADMIN', label: 'Admin (Full Access)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editData) {
        await api.put(`/employees/${editData.id}`, form);
      } else {
        await api.post('/employees', form);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} 
      />
      
      <div className="glass-panel animate-scale-in" style={{ 
        position: 'relative', width: '100%', maxWidth: '580px', 
        maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              {editData ? 'Update Profile' : 'Onboard Staff'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {editData ? `Editing recorded for ${editData.fullName}` : 'Register a new team member into the system.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--rubis-red)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}>CLOSE</button>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239,68,68,0.1)', color: '#f87171', 
            padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
            border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: '10px', alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Identity Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">First Name</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" required className="input-field" placeholder="John"
                  value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Last Name</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" required className="input-field" placeholder="Doe"
                  value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" required className="input-field" placeholder="john@example.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="tel" required className="input-field" placeholder="+250 123..."
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Professional Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Position</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className="input-field" 
                  value={form.position} onChange={e => setForm({...form, position: e.target.value})}
                >
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">National ID</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" required className="input-field" placeholder="ID Number"
                  value={form.nationalId} onChange={e => setForm({...form, nationalId: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Hire Date</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="datetime-local" className="input-field"
                  value={form.hireDate} onChange={e => setForm({...form, hireDate: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" checked={form.active} onChange={() => setForm({...form, active: true})} /> Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" checked={!form.active} onChange={() => setForm({...form, active: false})} /> Inactive
                </label>
              </div>
            </div>
          </div>

          {/* User Account Section (Unified Onboarding) */}
          {!editData && (
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '16px', 
              padding: '1.5rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: '700' }}>Create System Login Account</span>
                </div>
                <div 
                  onClick={() => setForm({...form, createLoginAccount: !form.createLoginAccount})}
                  style={{ 
                    width: '44px', height: '22px', borderRadius: '100px', 
                    background: form.createLoginAccount ? 'var(--rubis-red)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px', left: form.createLoginAccount ? '25px' : '3px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>

              {form.createLoginAccount ? (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="label">Access Privilege Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {roles.map(r => (
                        <button 
                          key={r.value}
                          type="button"
                          onClick={() => setForm({...form, role: r.value})}
                          style={{
                            padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                            background: form.role === r.value ? 'rgba(227,6,19,0.1)' : 'rgba(255,255,255,0.02)',
                            color: form.role === r.value ? 'var(--rubis-red)' : 'var(--text-muted)',
                            border: `1px solid ${form.role === r.value ? 'rgba(227,6,19,0.2)' : 'rgba(255,255,255,0.05)'}`,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {r.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', alignItems: 'flex-start' }}>
                    <span>A default temporary password <b>Carwash@2024</b> will be assigned. They can change it after their first login.</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Employee will have a profile but no access to log into the management system.
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 2, padding: '1rem', position: 'relative' }}>
              {submitting ? (
                <span style={{ fontWeight: '900', textTransform: 'uppercase' }}>Working...</span>
              ) : (
                <>{editData ? 'Update Profile' : 'Confirm Registration'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
