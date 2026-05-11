import { useState } from 'react';
import api from '../services/api';

const DEFAULT_PASSWORD = 'Annet@25437';

const EmployeeModal = ({ onClose, onSuccess, editData = null }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [credentials, setCredentials] = useState(null); // shown after account creation
  const [copied, setCopied]         = useState(false);

  const [form, setForm] = useState({
    firstName:           editData?.firstName  || '',
    lastName:            editData?.lastName   || '',
    email:               editData?.email      || '',
    phone:               editData?.phone      || '',
    position:            editData?.position   || 'Washing Specialist',
    nationalId:          editData?.nationalId || '',
    hireDate:            editData?.hireDate
                           ? editData.hireDate.substring(0, 16)
                           : new Date().toISOString().substring(0, 16),
    active:              editData ? editData.active : true,
    createLoginAccount:  false,
    role:                'STAFF',
  });

  const positions = [
    'Washing Specialist',
    'Senior Detailer',
    'Supervisor',
    'Operations Manager',
    'Receptionist',
    'Maintenance',
  ];

  const roles = [
    { value: 'STAFF',   label: 'Staff',   desc: 'Standard access' },
    { value: 'MANAGER', label: 'Manager', desc: 'High-level access' },
    { value: 'ADMIN',   label: 'Admin',   desc: 'Full access' },
  ];

  const roleColor = { STAFF: '#60a5fa', MANAGER: '#c084fc', ADMIN: '#f87171' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // datetime-local gives "YYYY-MM-DDTHH:mm" (no seconds) — append :00 so Jackson parses correctly
      const payload = {
        ...form,
        hireDate: form.hireDate
          ? (form.hireDate.length === 16 ? form.hireDate + ':00' : form.hireDate)
          : null,
      };

      if (editData) {
        await api.put(`/employees/${editData.id}`, payload);
        onSuccess();
      } else {
        await api.post('/employees', payload);
        if (form.createLoginAccount) {
          // Show credentials panel instead of closing immediately
          setCredentials({
            name:     `${form.firstName} ${form.lastName}`,
            position: form.position,
            username: form.email,
            password: DEFAULT_PASSWORD,
            role:     form.role,
          });
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || data?.error || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    const text =
      `Staff Login Credentials — Rubis Station\n` +
      `Name:     ${credentials.name}\n` +
      `Position: ${credentials.position}\n` +
      `Username: ${credentials.username}\n` +
      `Password: ${credentials.password}\n` +
      `Role:     ${credentials.role}\n\n` +
      `Please change your password after first login.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  /* ── Credentials display after creation ─────────────────────────── */
  if (credentials) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div onClick={() => { onSuccess(); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
        <div className="glass-panel animate-scale-in" style={{
          position: 'relative', width: '100%', maxWidth: '480px',
          padding: '2.5rem', border: '1px solid rgba(74,222,128,0.25)',
        }}>
          {/* Success header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', margin: '0 auto 1rem',
            }}>✓</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.3rem' }}>Account Created!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Share these credentials with <strong style={{ color: 'white' }}>{credentials.name}</strong>
            </p>
          </div>

          {/* Credentials card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem',
          }}>
            {/* Name + position */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: `${roleColor[credentials.role]}20`,
                border: `1px solid ${roleColor[credentials.role]}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '1rem', color: roleColor[credentials.role],
              }}>
                {credentials.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{credentials.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{credentials.position}</div>
              </div>
              <span style={{
                marginLeft: 'auto', padding: '4px 10px', borderRadius: '50px',
                fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase',
                background: `${roleColor[credentials.role]}18`,
                color: roleColor[credentials.role],
                border: `1px solid ${roleColor[credentials.role]}35`,
              }}>
                {credentials.role}
              </span>
            </div>

            {/* Credential rows */}
            {[
              { label: 'LOGIN URL',  value: window.location.origin + '/login' },
              { label: 'USERNAME',   value: credentials.username, mono: true },
              { label: 'PASSWORD',   value: credentials.password, mono: true, highlight: true },
            ].map(({ label, value, mono, highlight }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                  {label}
                </span>
                <span style={{
                  fontSize: mono ? '0.82rem' : '0.8rem',
                  fontFamily: mono ? 'monospace' : 'inherit',
                  fontWeight: '700',
                  color: highlight ? '#fbbf24' : 'var(--text-primary)',
                  background: highlight ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${highlight ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  padding: '4px 10px', borderRadius: '6px', maxWidth: '260px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'flex-start',
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠</span>
            <span style={{ fontSize: '0.78rem', color: '#fbbf24', lineHeight: 1.5 }}>
              Ask <strong>{credentials.name.split(' ')[0]}</strong> to change their password after the first login.
              These credentials are only shown once.
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={copyCredentials}
              style={{
                flex: 1, padding: '0.85rem',
                background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${copied ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px', color: copied ? '#4ade80' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy Credentials'}
            </button>
            <button
              onClick={() => onSuccess()}
              className="btn-primary"
              style={{ flex: 2, padding: '0.85rem', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main form ───────────────────────────────────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />

      <div className="glass-panel animate-scale-in" style={{
        position: 'relative', width: '100%', maxWidth: '580px',
        maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              {editData ? 'Update Profile' : 'Onboard Staff'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {editData ? `Editing record for ${editData.fullName}` : 'Register a new team member into the system.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--rubis-red)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}>
            CLOSE
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: '#f87171',
            padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">First Name</label>
              <input type="text" required className="input-field" placeholder="John"
                value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Last Name</label>
              <input type="text" required className="input-field" placeholder="Doe"
                value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>

          {/* Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input type="email" required className="input-field" placeholder="john@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input type="tel" required className="input-field" placeholder="+250 123..."
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          {/* Role + National ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Position</label>
              <select className="input-field" value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}>
                {positions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">National ID</label>
              <input type="text" required className="input-field" placeholder="ID Number"
                value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} />
            </div>
          </div>

          {/* Hire date + status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Hire Date</label>
              <input type="datetime-local" className="input-field"
                value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" checked={form.active} onChange={() => setForm({ ...form, active: true })} /> Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" checked={!form.active} onChange={() => setForm({ ...form, active: false })} /> Inactive
                </label>
              </div>
            </div>
          </div>

          {/* Login account section — new employees only */}
          {!editData && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${form.createLoginAccount ? 'rgba(227,6,19,0.2)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '16px', padding: '1.5rem',
              transition: 'border-color 0.2s',
            }}>
              {/* Toggle row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: form.createLoginAccount ? '1.25rem' : 0 }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Create System Login Account</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Allows this staff member to log into the system
                  </div>
                </div>
                <div
                  onClick={() => setForm({ ...form, createLoginAccount: !form.createLoginAccount })}
                  style={{
                    width: '44px', height: '22px', borderRadius: '100px', flexShrink: 0,
                    background: form.createLoginAccount ? 'var(--rubis-red)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px',
                    left: form.createLoginAccount ? '25px' : '3px',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>

              {form.createLoginAccount && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Role selector */}
                  <div>
                    <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Access Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {roles.map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setForm({ ...form, role: r.value })}
                          style={{
                            padding: '0.65rem 0.5rem', borderRadius: '10px',
                            textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                            background: form.role === r.value ? `${roleColor[r.value]}15` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${form.role === r.value ? `${roleColor[r.value]}40` : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: form.role === r.value ? roleColor[r.value] : 'var(--text-secondary)' }}>
                            {r.label}
                          </div>
                          <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credential preview */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
                    padding: '0.85rem 1rem', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>USERNAME</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{form.email || 'their email address'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>DEFAULT PASSWORD</span>
                      <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: '700' }}>{DEFAULT_PASSWORD}</span>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.73rem', margin: 0, lineHeight: 1.5 }}>
                    You will see the full credentials after saving, ready to copy and share.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 2, padding: '1rem' }}>
              {submitting ? 'Working…' : editData ? 'Update Profile' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
