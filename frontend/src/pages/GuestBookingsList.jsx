import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, CheckCircle2, User, Trash2,
  UserCheck, UserPlus2, ChevronDown, Loader2, AlertCircle, X, UserX,
} from 'lucide-react';
import api from '../services/api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const GuestBookingsList = () => {
  const [bookings, setBookings]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [userRole, setUserRole]               = useState(null);
  const [assignDropdownId, setAssignDropdownId] = useState(null);
  const [assignDropdownPos, setAssignDropdownPos] = useState({ top: 0, left: 0 });
  const [assigningId, setAssigningId]         = useState(null);
  const [success, setSuccess]                 = useState('');
  const [error, setError]                     = useState('');
  const [currentPage, setCurrentPage]         = useState(0);

  useEffect(() => { fetchGuestBookings(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [empRes, meRes] = await Promise.all([
          api.get('/employees/active'),
          api.get('/auth/me'),
        ]);
        setActiveEmployees(empRes.data || []);
        setUserRole(meRes.data?.role);
      } catch {}
    })();
  }, []);

  useEffect(() => { setCurrentPage(0); }, [searchTerm]);

  const fetchGuestBookings = async () => {
    try {
      const res = await api.get('/bookings?page=0&size=1000&sort=createdAt,desc');
      const all = Array.isArray(res.data.content) ? res.data.content : (Array.isArray(res.data) ? res.data : []);
      setBookings(all.filter(b => b.isGuest || b.guest));
    } catch (err) {
      console.error('Failed to fetch guest bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this guest booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchGuestBookings();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const unassignEmployee = async (bookingId) => {
    setAssigningId(bookingId);
    try {
      await api.delete(`/bookings/${bookingId}/assign-employee`);
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, assignedEmployeeId: null, assignedEmployeeName: null } : b
      ));
      setAssignDropdownId(null);
      setSuccess('Staff member unassigned successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to unassign: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigningId(null);
    }
  };

  const assignEmployee = async (bookingId, employeeId) => {
    setAssigningId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/assign-employee/${employeeId}`);
      const emp = activeEmployees.find(e => e.id === employeeId);
      const empName = emp?.fullName || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim();
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, assignedEmployeeId: employeeId, assignedEmployeeName: empName } : b
      ));
      setAssignDropdownId(null);
      setSuccess(`${empName} assigned successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigningId(null);
    }
  };

  const canAssign = userRole === 'ADMIN' || userRole === 'MANAGER';

  const filteredBookings = bookings
    .filter(b =>
      (b.guestName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.guestVehiclePlate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.bookingReference || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const pagedBookings = filteredBookings.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString() : null;
  const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  const StatusBadge = ({ status }) => {
    const cfg = {
      PENDING:     { label: 'Pending',     color: '#eab308', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.3)' },
      CONFIRMED:   { label: 'Confirmed',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)' },
      IN_PROGRESS: { label: 'In Progress', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)' },
      COMPLETED:   { label: 'Completed',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
      CANCELLED:   { label: 'Cancelled',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
    }[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
    return (
      <span style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '3px 11px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {cfg.label}
      </span>
    );
  };

  const TH = { padding: '0.9rem 1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontSize: '0.78rem' };


  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '0.5rem' }}>Guest Bookings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Track and manage temporary guest bookings. These are automatically deleted after 7 days.
        </p>
      </div>

      {success && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, plate, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.75rem', background: 'var(--surface)', border: '1px solid var(--border-white)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            Total Guests: <span style={{ color: 'var(--text-primary)', fontWeight: '900' }}>{filteredBookings.length}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <User size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: '700' }}>No guest bookings found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={TH}>Reference</th>
                    <th style={TH}>Guest Info</th>
                    <th style={TH}>Vehicle Plate</th>
                    <th style={TH}>Service</th>
                    <th style={TH}>Booked / Scheduled</th>
                    <th style={TH}>Completed</th>
                    <th style={TH}>Status</th>
                    {canAssign && (
                      <th style={TH}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UserCheck size={13} /> Staff
                        </div>
                      </th>
                    )}
                    <th style={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBookings.map((b) => {
                    const isAssigning  = assigningId === b.id;
                    const dropdownOpen = assignDropdownId === b.id;
                    const assignedName = b.assignedEmployeeName;
                    const isActive     = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status);

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="card-hover">

                        {/* Reference */}
                        <td style={{ padding: '1.15rem 1rem', fontWeight: '800', fontSize: '0.85rem', color: 'var(--rubis-red)' }}>{b.bookingReference}</td>

                        {/* Guest info */}
                        <td style={{ padding: '1.15rem 1rem' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{b.guestName || 'Unknown'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{b.guestPhone || 'No phone'}</div>
                        </td>

                        {/* Plate */}
                        <td style={{ padding: '1.15rem 1rem', fontWeight: '800', fontSize: '0.9rem', color: 'var(--rubis-red)' }}>{b.guestVehiclePlate || '—'}</td>

                        {/* Service */}
                        <td style={{ padding: '1.15rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.serviceName}</td>

                        {/* Booked / Scheduled */}
                        <td style={{ padding: '1.15rem 1rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                            {fmtDate(b.scheduledAt) || fmtDate(b.createdAt) || '—'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {fmtTime(b.scheduledAt) || fmtTime(b.createdAt) || ''}
                          </div>
                        </td>

                        {/* Completed */}
                        <td style={{ padding: '1.15rem 1rem' }}>
                          {b.completedAt ? (
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#4ade80' }}>{fmtDate(b.completedAt)}</div>
                              <div style={{ fontSize: '0.72rem', color: '#4ade80', opacity: 0.7, marginTop: '2px' }}>{fmtTime(b.completedAt)}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              {b.status === 'CANCELLED' ? 'Cancelled' : 'Ongoing'}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '1.15rem 1rem' }}><StatusBadge status={b.status} /></td>

                        {/* Staff assignment */}
                        {canAssign && (
                          <td style={{ padding: '1rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {assignedName ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900', flexShrink: 0 }}>
                                    {assignedName[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{assignedName}</div>
                                    <span style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: isActive ? '#818cf8' : 'var(--text-muted)', background: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '6px' }}>
                                      {b.status?.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '700' }}>Unassigned</span>
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  if (dropdownOpen) { setAssignDropdownId(null); return; }
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setAssignDropdownPos({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - 260) });
                                  setAssignDropdownId(b.id);
                                }}
                                disabled={isAssigning}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '4px 10px', borderRadius: '7px', fontSize: '0.68rem', fontWeight: '800',
                                  cursor: isAssigning ? 'default' : 'pointer',
                                  background: assignedName ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.12)',
                                  border: `1px solid ${assignedName ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.35)'}`,
                                  color: assignedName ? '#818cf8' : '#fbbf24',
                                }}
                              >
                                {isAssigning ? <Loader2 size={11} className="animate-spin" /> : <UserPlus2 size={11} />}
                                {isAssigning ? 'Assigning…' : assignedName ? '↺ Reassign' : '+ Assign'}
                                {!isAssigning && <ChevronDown size={10} />}
                              </button>
                            </div>
                          </td>
                        )}

                        {/* Delete */}
                        <td style={{ padding: '1.15rem 1rem' }}>
                          <button onClick={() => handleDelete(b.id)} title="Delete Guest Booking"
                            style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', cursor: 'pointer', padding: '5px', display: 'flex' }}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalElements={filteredBookings.length}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </div>

      {/* Portal: employee assignment dropdown */}
      {assignDropdownId && (() => {
        const pb = bookings.find(b => b.id === assignDropdownId);
        if (!pb) return null;
        const pbActive = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(pb.status);
        return createPortal(
          <>
            <div onClick={() => setAssignDropdownId(null)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
            <div style={{
              position: 'fixed', top: assignDropdownPos.top, left: assignDropdownPos.left,
              zIndex: 9999, minWidth: '240px', maxWidth: '300px',
              background: '#14142a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.65)', overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(148,163,184,0.7)' }}>Active Staff</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '1px 7px', borderRadius: '8px' }}>
                  {activeEmployees.length} available
                </span>
              </div>
              <div style={{ padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.68rem', color: 'rgba(148,163,184,0.6)' }}>
                Booking: <strong style={{ color: '#e2e8f0' }}>{pb.serviceName || '—'}</strong>
                {' · '}
                <span style={{ color: pbActive ? '#818cf8' : 'rgba(148,163,184,0.6)' }}>{pb.status?.replace('_', ' ')}</span>
              </div>
              {pb.assignedEmployeeId && (
                <button
                  onClick={() => unassignEmployee(pb.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 14px', background: 'rgba(239,68,68,0.08)',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', textAlign: 'left', color: '#f87171',
                    fontSize: '0.76rem', fontWeight: '800', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                >
                  <UserX size={13} /> Unassign current staff
                </button>
              )}
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {activeEmployees.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: '0.82rem', color: 'rgba(148,163,184,0.6)', textAlign: 'center' }}>No active staff available.</div>
                ) : activeEmployees.map(emp => {
                  const name = emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '?';
                  const isCurrent = pb.assignedEmployeeId === emp.id;
                  return (
                    <button key={emp.id} onClick={() => assignEmployee(pb.id, emp.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                        background: isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer', textAlign: 'left', color: '#e2e8f0', transition: 'background 0.12s' }}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent'; }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        background: isCurrent ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.12)',
                        color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: '900' }}>
                        {name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {name}
                          {isCurrent && <span style={{ fontSize: '0.58rem', color: '#818cf8', background: 'rgba(99,102,241,0.2)', padding: '1px 6px', borderRadius: '8px', fontWeight: '800' }}>assigned</span>}
                        </div>
                        {emp.position && <div style={{ fontSize: '0.68rem', color: 'rgba(148,163,184,0.6)', marginTop: '2px' }}>{emp.position}</div>}
                      </div>
                      {isCurrent && <CheckCircle2 size={14} color="#818cf8" style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        );
      })()}
    </div>
  );
};

export default GuestBookingsList;
