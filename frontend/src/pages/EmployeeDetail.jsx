import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, CheckCircle2, XCircle,
  Wallet, ClipboardList, Users, Car, CalendarDays, TrendingUp,
  AlertCircle, BarChart3, User, Shield, Activity
} from 'lucide-react';
import api from '../services/api';

/* ── helpers ─────────────────────────────────────────────────────── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} RWF`;

const StatusBadge = ({ status }) => {
  const cfg = {
    PENDING:     { label: 'Pending',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.3)' },
    CONFIRMED:   { label: 'Confirmed',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.3)' },
    IN_PROGRESS: { label: 'In Progress', color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.3)' },
    COMPLETED:   { label: 'Completed',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.3)' },
    CANCELLED:   { label: 'Cancelled',   color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)' },
  }[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' };
  return (
    <span style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '3px 10px', borderRadius: '50px', fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
};

const KpiCard = ({ label, value, sub, icon: Icon, color, bg, border, onClick }) => (
  <div
    className={onClick ? 'glass-panel card-hover' : 'glass-panel'}
    onClick={onClick}
    style={{ padding: '1.25rem 1.4rem', border: `1px solid ${border || 'rgba(255,255,255,0.08)'}`, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ padding: '7px', background: bg || 'rgba(255,255,255,0.05)', borderRadius: '9px', display: 'flex' }}>
        <Icon size={15} color={color} />
      </div>
    </div>
    <div style={{ fontSize: '1.6rem', fontWeight: '900', color, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ marginTop: '5px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>{sub}</div>}
  </div>
);

const ROLE_COLOR = { STAFF: '#60a5fa', MANAGER: '#c084fc', ADMIN: '#f87171' };
const DEFAULT_PASSWORD = 'Annet@25437';

/* ── Grant Login Modal ───────────────────────────────────────────── */
const GrantLoginModal = ({ employee, onClose, onGranted }) => {
  const [role, setRole]       = useState('STAFF');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [creds, setCreds]     = useState(null);
  const [copied, setCopied]   = useState(false);

  const roles = [
    { value: 'STAFF',   label: 'Staff',   desc: 'Standard access' },
    { value: 'MANAGER', label: 'Manager', desc: 'High-level access' },
    { value: 'ADMIN',   label: 'Admin',   desc: 'Full access' },
  ];

  const handleGrant = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post(`/employees/${employee.id}/grant-login?role=${role}`);
      setCreds(res.data);
      onGranted(); // refresh employee data in background
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to grant access.');
    } finally { setLoading(false); }
  };

  const copyCredentials = () => {
    const text = `Rubis Station — Login Credentials\nName: ${employee.fullName}\nUsername: ${creds.username}\nPassword: ${creds.password}\nRole: ${creds.role}\n\nPlease change your password after first login.`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={creds ? () => onClose() : onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      <div className="glass-panel animate-scale-in" style={{
        position: 'relative', width: '100%', maxWidth: '440px', padding: '2rem',
        border: creds ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(96,165,250,0.25)',
      }}>
        {!creds ? (
          <>
            <h3 style={{ fontWeight: '900', fontSize: '1.15rem', marginBottom: '0.4rem' }}>Grant Login Access</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              This will create a login account for <strong style={{ color: 'white' }}>{employee.fullName}</strong>.
            </p>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Access Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
                    padding: '0.65rem 0.5rem', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    background: role === r.value ? `${ROLE_COLOR[r.value]}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${role === r.value ? `${ROLE_COLOR[r.value]}40` : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: role === r.value ? ROLE_COLOR[r.value] : 'var(--text-secondary)' }}>{r.label}</div>
                    <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>USERNAME</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{employee.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>DEFAULT PASSWORD</span>
                <span style={{ fontFamily: 'monospace', color: '#fbbf24', fontWeight: '700' }}>{DEFAULT_PASSWORD}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', background: 'var(--surface)', border: '1px solid var(--border-white)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '800', fontSize: '0.78rem' }}>Cancel</button>
              <button onClick={handleGrant} disabled={loading} className="btn-primary" style={{ flex: 2, padding: '0.8rem', fontWeight: '900', fontSize: '0.82rem' }}>
                {loading ? 'Creating…' : 'Grant Access'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 0.75rem' }}>✓</div>
              <h3 style={{ fontWeight: '900', fontSize: '1.15rem', marginBottom: '0.25rem' }}>Account Created!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Share these credentials with <strong style={{ color: 'white' }}>{employee.fullName}</strong></p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                { label: 'LOGIN URL', value: window.location.origin + '/login' },
                { label: 'USERNAME', value: creds.username, mono: true },
                { label: 'PASSWORD', value: creds.password, mono: true, highlight: true },
                { label: 'ROLE',     value: creds.role },
              ].map(({ label, value, mono, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: '700', color: highlight ? '#fbbf24' : 'var(--text-primary)', background: highlight ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${highlight ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`, padding: '3px 10px', borderRadius: '6px' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#fbbf24', lineHeight: 1.5 }}>
              ⚠ Ask {employee.fullName.split(' ')[0]} to change their password after first login. These credentials are only shown once.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={copyCredentials} style={{ flex: 1, padding: '0.8rem', background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: copied ? '#4ade80' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '800', fontSize: '0.78rem', transition: 'all 0.2s' }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
              <button onClick={onClose} className="btn-primary" style={{ flex: 2, padding: '0.8rem', fontWeight: '900', fontSize: '0.82rem' }}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── main component ──────────────────────────────────────────────── */
const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'completed' | 'pending' | 'cancelled'
  const [showGrantModal, setShowGrantModal] = useState(false);

  // Access guard: STAFF can only view their own profile page
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  useEffect(() => {
    if (
      currentUser.role === 'STAFF' &&
      currentUser.employeeId &&
      Number(currentUser.employeeId) !== Number(id)
    ) {
      navigate(`/employees/${currentUser.employeeId}`, { replace: true });
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEmployee = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [empRes, bookRes] = await Promise.all([
        api.get(`/employees/${id}`),
        api.get(`/bookings/employee/${id}`),
      ]);
      setEmployee(empRes.data);
      const bList = Array.isArray(bookRes.data) ? bookRes.data : (bookRes.data?.content || []);
      setBookings(bList.sort((a, b) => new Date(b.createdAt || b.scheduledAt || 0) - new Date(a.createdAt || a.scheduledAt || 0)));
    } catch (err) {
      setError('Failed to load employee details: ' + (err.response?.data?.message || err.message));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadEmployee(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── metrics ───────────────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const completed = bookings.filter(b => b.status === 'COMPLETED');
    const revOf = (list) => list.reduce((s, b) => s + Number(b.payment?.amount || b.totalAmount || 0), 0);

    const datOf = (b) => new Date(b.completedAt || b.scheduledAt || b.createdAt || 0);

    const todayDone   = completed.filter(b => (b.completedAt || b.scheduledAt || b.createdAt || '').split('T')[0] === todayStr);
    const weekDone    = completed.filter(b => datOf(b) >= weekAgo);
    const monthDone   = completed.filter(b => datOf(b) >= monthStart);
    const yearDone    = completed.filter(b => datOf(b) >= yearStart);

    // Unique customers served by this employee
    const custMap = new Map();
    bookings.forEach(b => {
      if (!b.customerId || b.isGuest) return;
      const key = b.customerId;
      if (!custMap.has(key)) {
        custMap.set(key, { id: b.customerId, name: (b.customerName || '').replace(' (Guest)', ''), count: 0, revenue: 0 });
      }
      const c = custMap.get(key);
      c.count++;
      if (b.status === 'COMPLETED') c.revenue += Number(b.payment?.amount || b.totalAmount || 0);
    });
    const customers = [...custMap.values()].sort((a, b) => b.revenue - a.revenue);

    // Monthly revenue breakdown for last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), count: 0, revenue: 0 };
    });
    completed.forEach(b => {
      const d = datOf(b);
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
      if (m) { m.count++; m.revenue += Number(b.payment?.amount || b.totalAmount || 0); }
    });

    return {
      totalBookings: bookings.length,
      totalCompleted: completed.length,
      totalCancelled: bookings.filter(b => b.status === 'CANCELLED').length,
      totalPending: bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
      todayJobs: todayDone.length,
      todayRevenue: revOf(todayDone),
      weeklyJobs: weekDone.length,
      weeklyRevenue: revOf(weekDone),
      monthlyJobs: monthDone.length,
      monthlyRevenue: revOf(monthDone),
      yearlyJobs: yearDone.length,
      yearlyRevenue: revOf(yearDone),
      allTimeRevenue: revOf(completed),
      customers,
    };
  }, [bookings]);

  /* ── filtered bookings for table ────────────────────────────────── */
  const displayedBookings = useMemo(() => {
    if (activeTab === 'completed') return bookings.filter(b => b.status === 'COMPLETED');
    if (activeTab === 'pending')   return bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));
    if (activeTab === 'cancelled') return bookings.filter(b => b.status === 'CANCELLED');
    return bookings;
  }, [bookings, activeTab]);

  /* ── loading / error states ─────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--rubis-red)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Loading employee profile…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <AlertCircle size={40} color="#f87171" style={{ marginBottom: '1rem' }} />
      <p style={{ color: '#f87171', fontWeight: '700', marginBottom: '1rem' }}>{error}</p>
      <button onClick={() => navigate(-1)} className="btn" style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-primary)', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>← Go Back</button>
    </div>
  );

  if (!employee) return null;

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
  const isInactive = !employee.active;
  const returnOverdue = isInactive && employee.expectedReturnDate && new Date(employee.expectedReturnDate) < new Date();

  const TH = { padding: '0.85rem 1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontSize: '0.72rem' };

  const canManage = ['ADMIN', 'MANAGER'].includes(currentUser.role);

  return (
    <div style={{ paddingBottom: '4rem' }}>

      {/* ── Grant Login Modal ────────────────────────────────────────── */}
      {showGrantModal && (
        <GrantLoginModal
          employee={employee}
          onClose={() => setShowGrantModal(false)}
          onGranted={() => loadEmployee(true)}
        />
      )}

      {/* ── Back + Header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem', padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem', border: isInactive ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(74,222,128,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '18px', flexShrink: 0,
              background: isInactive ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
              border: `2px solid ${isInactive ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '1.4rem',
              color: isInactive ? '#f87171' : '#4ade80',
            }}>
              {initials}
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0 }}>{employee.fullName}</h1>
                <span style={{
                  padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800',
                  background: 'rgba(96,165,250,0.1)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.2)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{employee.position || 'Staff'}</span>
                <span style={{
                  padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800',
                  background: isInactive ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                  color: isInactive ? '#f87171' : '#4ade80',
                  border: `1px solid ${isInactive ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
                  textTransform: 'uppercase',
                }}>
                  {isInactive ? '● Inactive' : '● Active'}
                </span>

                {/* Login account badge / grant button */}
                {employee.hasLoginAccount ? (
                  <span style={{
                    padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800',
                    background: 'rgba(96,165,250,0.1)', color: '#60a5fa',
                    border: '1px solid rgba(96,165,250,0.25)', textTransform: 'uppercase',
                  }}>
                    ✓ Has Login
                  </span>
                ) : canManage && (
                  <button
                    onClick={() => setShowGrantModal(true)}
                    style={{
                      padding: '4px 14px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800',
                      background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                      border: '1px solid rgba(251,191,36,0.3)', cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}
                  >
                    + Grant Login Access
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {employee.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={13} /> {employee.email}
                  </span>
                )}
                {employee.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={13} /> {employee.phone}
                  </span>
                )}
                {employee.nationalId && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Shield size={13} /> {employee.nationalId}
                  </span>
                )}
                {employee.hireDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} /> Hired {fmtDate(employee.hireDate)}
                  </span>
                )}
                {employee.statusChangedAt && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} /> Status changed {fmtDate(employee.statusChangedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Inactive warning */}
          {isInactive && (
            <div style={{
              marginTop: '1.25rem', padding: '0.9rem 1.1rem',
              background: returnOverdue ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.07)',
              border: `1px solid ${returnOverdue ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.2)'}`,
              borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <AlertCircle size={16} color={returnOverdue ? '#f87171' : '#fbbf24'} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '800', color: returnOverdue ? '#f87171' : '#fbbf24', fontSize: '0.85rem' }}>
                  {returnOverdue ? 'Expected return date has passed' : 'Currently inactive'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {employee.expectedReturnDate
                    ? `Expected back: ${fmtDateTime(employee.expectedReturnDate)}`
                    : 'No return date set'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <KpiCard label="Today's Jobs"    value={metrics.todayJobs}    sub={`Revenue: ${fmtMoney(metrics.todayRevenue)}`}    icon={Activity}      color="#60a5fa" bg="rgba(96,165,250,0.1)"   border="rgba(96,165,250,0.2)" />
        <KpiCard label="This Week"       value={metrics.weeklyJobs}   sub={`Revenue: ${fmtMoney(metrics.weeklyRevenue)}`}   icon={CalendarDays}  color="#fbbf24" bg="rgba(251,191,36,0.1)"  border="rgba(251,191,36,0.2)" />
        <KpiCard label="This Month"      value={metrics.monthlyJobs}  sub={`Revenue: ${fmtMoney(metrics.monthlyRevenue)}`}  icon={BarChart3}     color="#34d399" bg="rgba(52,211,153,0.1)"  border="rgba(52,211,153,0.2)" />
        <KpiCard label="This Year"       value={metrics.yearlyJobs}   sub={`Revenue: ${fmtMoney(metrics.yearlyRevenue)}`}   icon={TrendingUp}    color="#c084fc" bg="rgba(192,132,252,0.1)" border="rgba(192,132,252,0.2)" />
        <KpiCard label="All-Time Revenue" value={fmtMoney(metrics.allTimeRevenue)} sub={`${metrics.totalCompleted} completed washes`} icon={Wallet}  color="#10b981" bg="rgba(16,185,129,0.1)" border="rgba(16,185,129,0.2)" />
        <KpiCard label="Customers Served" value={metrics.customers.length} sub={`From ${metrics.totalBookings} total bookings`} icon={Users}   color="#f97316" bg="rgba(249,115,22,0.1)"  border="rgba(249,115,22,0.2)" />
      </div>

      {/* ── Booking Status Summary Pills ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        {[
          { key: 'all',       label: `All (${metrics.totalBookings})`,           color: '#94a3b8' },
          { key: 'pending',   label: `Active / Pending (${metrics.totalPending})`, color: '#fbbf24' },
          { key: 'completed', label: `Completed (${metrics.totalCompleted})`,    color: '#4ade80' },
          { key: 'cancelled', label: `Cancelled (${metrics.totalCancelled})`,    color: '#f87171' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '0.45rem 1.1rem',
              borderRadius: '50px', border: `1px solid ${activeTab === t.key ? t.color : 'rgba(255,255,255,0.08)'}`,
              background: activeTab === t.key ? `${t.color}18` : 'var(--surface)',
              color: activeTab === t.key ? t.color : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: '800', fontSize: '0.75rem', transition: 'all 0.15s',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.color, display: 'inline-block' }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Two-column: Customers + Bookings ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Customers Served Panel ──────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '7px', background: 'rgba(249,115,22,0.1)', borderRadius: '8px', display: 'flex' }}>
              <Users size={16} color="#f97316" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900' }}>Customers Served</h3>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)' }}>{metrics.customers.length} unique customers</p>
            </div>
          </div>

          {metrics.customers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: '700', fontSize: '0.85rem' }}>No customers yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '460px', overflowY: 'auto' }}>
              {metrics.customers.map((c, i) => (
                <Link key={c.id} to={`/customers/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card-hover" style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: `hsl(${(c.id * 47) % 360}, 60%, 25%)`,
                      border: `1px solid hsl(${(c.id * 47) % 360}, 60%, 40%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '900', fontSize: '0.75rem',
                      color: `hsl(${(c.id * 47) % 360}, 80%, 75%)`,
                    }}>
                      {c.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.84rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name?.replace(' (Guest)', '') || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {c.count} booking{c.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: '900', fontSize: '0.8rem', color: '#10b981' }}>
                        {c.revenue > 0 ? `${c.revenue.toLocaleString()} RWF` : '—'}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>earned</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Bookings Table ──────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ padding: '7px', background: 'rgba(96,165,250,0.1)', borderRadius: '8px', display: 'flex' }}>
              <ClipboardList size={16} color="#60a5fa" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900' }}>Booking History</h3>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {displayedBookings.length} {activeTab === 'all' ? 'total' : activeTab} booking{displayedBookings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {displayedBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <ClipboardList size={40} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: '700' }}>No bookings in this category</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                    <th style={TH}>Ref</th>
                    <th style={TH}>Customer</th>
                    <th style={TH}>Vehicle</th>
                    <th style={TH}>Service</th>
                    <th style={TH}>Booked On</th>
                    <th style={TH}>Scheduled For</th>
                    <th style={TH}>Status</th>
                    <th style={TH}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBookings.map((b, i) => {
                    const isGuest = b.isGuest || b.guest;
                    const amt = Number(b.payment?.amount || b.totalAmount || 0);
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>

                        {/* Reference */}
                        <td style={{ padding: '0.9rem 1rem', fontWeight: '800', fontSize: '0.78rem', color: 'var(--rubis-red)', whiteSpace: 'nowrap' }}>
                          {b.bookingReference}
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          {isGuest ? (
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                {b.guestName || b.customerName || 'Guest'}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>Guest booking</div>
                            </div>
                          ) : b.customerId ? (
                            <Link to={`/customers/${b.customerId}`} style={{ textDecoration: 'none' }}>
                              <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--rubis-red)' }}>
                                {(b.customerName || '—').replace(' (Guest)', '')}
                              </div>
                              {b.vehicleLicensePlate && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>View profile →</div>
                              )}
                            </Link>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                          )}
                        </td>

                        {/* Vehicle */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.82rem', color: isGuest ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                            {b.vehicleLicensePlate || b.guestVehiclePlate || '—'}
                          </div>
                          {b.vehicleMakeModel && b.vehicleMakeModel !== 'Guest Vehicle' && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>{b.vehicleMakeModel}</div>
                          )}
                        </td>

                        {/* Service */}
                        <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '140px' }}>
                          <div style={{ fontWeight: '600' }}>{b.serviceName || '—'}</div>
                          {b.additionalServiceNames?.length > 0 && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              +{b.additionalServiceNames.join(', ')}
                            </div>
                          )}
                        </td>

                        {/* Booked On */}
                        <td style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <div>{fmtDate(b.createdAt)}</div>
                          <div style={{ fontSize: '0.68rem', marginTop: '1px' }}>
                            {b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </td>

                        {/* Scheduled For */}
                        <td style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', fontWeight: '600' }}>
                          <div>{fmtDate(b.scheduledAt)}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <StatusBadge status={b.status} />
                          {b.status === 'COMPLETED' && b.completedAt && (
                            <div style={{ fontSize: '0.62rem', color: '#4ade80', marginTop: '3px', fontWeight: '600' }}>
                              Done {fmtDate(b.completedAt)}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '0.9rem 1rem', fontWeight: '900', whiteSpace: 'nowrap' }}>
                          {amt > 0 ? (
                            <span style={{ color: b.status === 'COMPLETED' ? '#10b981' : 'var(--text-muted)' }}>
                              {amt.toLocaleString()} RWF
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                          )}
                          {b.payment?.status && b.payment.status !== 'PENDING' && (
                            <div style={{
                              fontSize: '0.6rem', fontWeight: '800', marginTop: '2px',
                              color: b.payment.status === 'PAID' ? '#10b981' : b.payment.status === 'REFUNDED' ? '#818cf8' : '#f97316',
                            }}>
                              {b.payment.status.replace('_', ' ')}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totals footer */}
                {activeTab === 'completed' && displayedBookings.length > 0 && (() => {
                  const totalEarned = displayedBookings.reduce((s, b) => s + Number(b.payment?.amount || b.totalAmount || 0), 0);
                  return (
                    <tfoot>
                      <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)', background: 'rgba(16,185,129,0.04)' }}>
                        <td colSpan={7} style={{ padding: '0.9rem 1rem', fontWeight: '800', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Total Revenue Generated
                        </td>
                        <td style={{ padding: '0.9rem 1rem', fontWeight: '900', color: '#10b981', fontSize: '1rem' }}>
                          {totalEarned.toLocaleString()} RWF
                        </td>
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;
