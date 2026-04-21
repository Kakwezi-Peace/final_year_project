import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Users, CheckCircle2, XCircle, TrendingUp,
  Search, RefreshCw, ToggleLeft, ToggleRight, Shield, CalendarClock, X
} from 'lucide-react';

/* ── tiny helper ─────────────────────────────────────── */
const fmt = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtReturn = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return `Overdue (${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ManagerDashboard = () => {
  const [allStaff, setAllStaff]         = useState([]);
  const [activeStaff, setActiveStaff]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toggling, setToggling]         = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeTab, setActiveTab]       = useState('all');
  const [notification, setNotification] = useState(null);
  const [stats, setStats]               = useState({ total: 0, active: 0, inactive: 0 });

  /* ── Return-date picker state ── */
  const [returnPickerFor, setReturnPickerFor] = useState(null); // employee being deactivated
  const [returnDate, setReturnDate]           = useState('');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, activeRes] = await Promise.all([
        api.get('/employees?page=0&size=200'),
        api.get('/employees/active'),
      ]);
      const all    = allRes.data.content || allRes.data || [];
      const active = activeRes.data || [];
      setAllStaff(all);
      setActiveStaff(active);
      setStats({ total: all.length, active: active.length, inactive: all.length - active.length });
    } catch {
      showNotification('error', 'Failed to load staff data. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── When admin clicks "Set Inactive" → open picker ── */
  const requestDeactivate = (emp) => {
    setReturnPickerFor(emp);
    setReturnDate('');   // clear previous value
  };

  const confirmToggle = async () => {
    const emp = returnPickerFor;
    setReturnPickerFor(null);
    setToggling(emp.id);
    try {
      let url = `/employees/${emp.id}/status?active=false`;
      if (returnDate) {
        // Convert local datetime-local value → ISO LocalDateTime format: YYYY-MM-DDTHH:mm:ss
        const isoVal = new Date(returnDate).toISOString().slice(0, 19);
        url += `&returnDate=${encodeURIComponent(isoVal)}`;
      }
      await api.patch(url);
      showNotification(
        'success',
        `${emp.fullName} set to INACTIVE${returnDate ? ` — Expected back: ${fmtReturn(returnDate)}` : ''}`
      );
      fetchData();
    } catch (e) {
      showNotification('error', `Failed to update status: ${e.response?.data?.message || e.message}`);
    } finally {
      setToggling(null);
    }
  };

  /* ── When setting ACTIVE → no picker needed ── */
  const activateEmployee = async (emp) => {
    setToggling(emp.id);
    try {
      await api.patch(`/employees/${emp.id}/status?active=true`);
      showNotification('success', `${emp.fullName} is now ACTIVE`);
      fetchData();
    } catch (e) {
      showNotification('error', `Failed to activate: ${e.response?.data?.message || e.message}`);
    } finally {
      setToggling(null);
    }
  };

  const handleToggle = (emp) => {
    if (emp.active) {
      requestDeactivate(emp);
    } else {
      activateEmployee(emp);
    }
  };

  const displayList = activeTab === 'active' ? activeStaff : allStaff;
  const filtered    = displayList.filter(e =>
    e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { label: 'Total Staff',    value: stats.total,    icon: Users,        color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)' },
    { label: 'Active Members', value: stats.active,   icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)' },
    { label: 'Inactive',       value: stats.inactive, icon: XCircle,      color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
    { label: 'Active Rate',    value: stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%', icon: TrendingUp, color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)' },
  ];

  /* ── min datetime for picker = now ── */
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>

      {/* ── Return Date Picker Modal ── */}
      {returnPickerFor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-white)',
            borderRadius: '20px', padding: '2rem', width: '380px', maxWidth: '92vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '7px', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', display: 'flex' }}>
                  <CalendarClock size={18} color="#f87171" />
                </div>
                <h3 style={{ fontWeight: '900', fontSize: '1.05rem', margin: 0 }}>Set Inactive</h3>
              </div>
              <button onClick={() => setReturnPickerFor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              You are marking <strong style={{ color: 'white' }}>{returnPickerFor.fullName}</strong> as <span style={{ color: '#f87171', fontWeight: '700' }}>Inactive</span>.
              <br />When is this staff member expected back on duty?
            </p>

            <label style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Expected Return Date &amp; Time
            </label>
            <input
              type="datetime-local"
              min={minDateTime}
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
              className="input-field"
              style={{
                width: '100%', boxSizing: 'border-box',
                colorScheme: 'dark', fontSize: '0.9rem', marginBottom: '0.5rem',
              }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Leave blank if the return date is uncertain.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setReturnPickerFor(null)}
                style={{
                  flex: 1, padding: '0.75rem', background: 'var(--surface)',
                  border: '1px solid var(--border-white)', borderRadius: '10px',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '800',
                  fontSize: '0.8rem', textTransform: 'uppercase',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                style={{
                  flex: 2, padding: '0.75rem', background: 'rgba(239,68,68,0.15)',
                  border: '2px solid rgba(239,68,68,0.4)', borderRadius: '10px',
                  color: '#f87171', cursor: 'pointer', fontWeight: '800',
                  fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >
                Confirm — Set Inactive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <div style={{ padding: '6px', background: 'rgba(220,38,38,0.15)', borderRadius: '10px', display: 'flex' }}>
              <Shield size={22} color="var(--rubis-red)" />
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0 }}>Manager Hub</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Manage team status — toggle staff active / inactive and track return dates.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0.7rem 1.2rem', background: 'var(--surface)',
            border: '1px solid var(--border-white)', borderRadius: '10px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Notification ── */}
      {notification && (
        <div className="animate-slide-up" style={{
          padding: '0.9rem 1.2rem', borderRadius: '12px', marginBottom: '1.5rem',
          background: notification.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color:       notification.type === 'success' ? '#4ade80'             : '#f87171',
          border:      `1px solid ${notification.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          fontWeight: '700', fontSize: '0.85rem',
        }}>
          {notification.message}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '1.25rem 1.5rem', border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{s.label}</span>
              <div style={{ padding: '6px', background: s.bg, borderRadius: '8px', display: 'flex' }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: s.color }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Staff Table ── */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
            {[{ id: 'all', label: 'All Staff' }, { id: 'active', label: '✓ Active Only' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '0.45rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase',
                background: activeTab === t.id ? 'var(--rubis-red)' : 'transparent',
                color:      activeTab === t.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="SEARCH STAFF..." className="input-field"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <span style={{ fontWeight: '900', color: 'var(--rubis-red)', textTransform: 'uppercase' }}>Loading staff data...</span>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem' }}>
                  {['Employee', 'Position', 'Contact', 'Status Since', 'Expected Back', 'Status', 'Toggle'].map(h => (
                    <th key={h} style={{ padding: '0.9rem 0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => {
                  const returnOverdue = emp.expectedReturnDate && new Date(emp.expectedReturnDate) < new Date() && !emp.active;
                  return (
                    <tr key={emp.id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>

                      {/* Employee */}
                      <td style={{ padding: '1.1rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: emp.active ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '900', fontSize: '0.8rem',
                            color: emp.active ? '#4ade80' : 'var(--text-muted)',
                            border: `1px solid ${emp.active ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`,
                          }}>
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{emp.fullName}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{emp.nationalId || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td style={{ padding: '1.1rem 0.85rem' }}>
                        <span style={{
                          padding: '3px 9px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '800',
                          background: 'rgba(96,165,250,0.1)', color: '#93c5fd',
                          border: '1px solid rgba(96,165,250,0.2)', textTransform: 'uppercase',
                        }}>{emp.position || 'Staff'}</span>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '1.1rem 0.85rem', fontSize: '0.8rem' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>{emp.email}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{emp.phone}</div>
                      </td>

                      {/* Status Since */}
                      <td style={{ padding: '1.1rem 0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {fmt(emp.statusChangedAt || emp.hireDate) || '—'}
                      </td>

                      {/* Expected Back */}
                      <td style={{ padding: '1.1rem 0.85rem' }}>
                        {emp.active ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        ) : emp.expectedReturnDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CalendarClock size={13} color={returnOverdue ? '#f87171' : '#fbbf24'} />
                            <span style={{
                              fontSize: '0.75rem', fontWeight: '700',
                              color: returnOverdue ? '#f87171' : '#fbbf24',
                            }}>
                              {fmtReturn(emp.expectedReturnDate)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Not set</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '1.1rem 0.85rem' }}>
                        <span style={{
                          padding: '4px 11px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '800',
                          background: emp.active ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.1)',
                          color:      emp.active ? '#4ade80'               : '#f87171',
                          border:     `1px solid ${emp.active ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        }}>
                          {emp.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Toggle */}
                      <td style={{ padding: '1.1rem 0.85rem' }}>
                        <button
                          onClick={() => handleToggle(emp)}
                          disabled={toggling === emp.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '0.4rem 0.8rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                            fontWeight: '800', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                            background: emp.active ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                            color:      emp.active ? '#f87171'               : '#4ade80',
                            border:     `1px solid ${emp.active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                            transition: 'all 0.2s',
                            opacity: toggling === emp.id ? 0.5 : 1,
                          }}
                        >
                          {toggling === emp.id
                            ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : emp.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />
                          }
                          {toggling === emp.id ? 'Saving…' : emp.active ? 'Set Inactive' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: '700', color: 'white' }}>No staff members found</h3>
            <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or switching tabs.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Showing {filtered.length} of {displayList.length} staff member{displayList.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ManagerDashboard;
