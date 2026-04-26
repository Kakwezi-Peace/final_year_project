import React, { useEffect, useState, useMemo } from 'react';
import {
  Car, Wallet, Users, Timer, AlertCircle,
  CheckCircle2, XCircle, Clock, Plus, Edit3,
  CalendarDays, CreditCard, RefreshCw, User,
  ClipboardList, TrendingUp, BarChart3, ArrowRight,
  Trash2, UserX, BellRing, ShieldAlert
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import api from '../services/api';
import BookingModal from '../components/BookingModal';
import WeatherWidget from '../components/WeatherWidget';

/* ─────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = {
    PENDING:     { label: 'Pending',     color: '#eab308', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.3)' },
    CONFIRMED:   { label: 'Confirmed',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)' },
    IN_PROGRESS: { label: 'In Progress', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)' },
    COMPLETED:   { label: 'Completed',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
    CANCELLED:   { label: 'Cancelled',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
  }[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };

  return (
    <span style={{
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      padding: '3px 11px', borderRadius: '50px', fontSize: '0.7rem',
      fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {cfg.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────
   CUSTOMER DASHBOARD
───────────────────────────────────────────────── */
const CustomerDashboard = ({ profile, myCustomer, bookings, payments, allBookings, allPayments, totalBookings, totalPayments, bPage, setBPage,
                              pPage, setPPage, handleEdit, handleCancel, showBookingModal,
                              setShowBookingModal, bookingToEdit, setBookingToEdit, fetchData,
                              onRequestDeletion, onCancelDeletion }) => {

  const firstName = profile?.fullName?.split(' ')[0] || 'there';

  /* Derive stats from all customer history for accurate metrics */
  const pending    = allBookings.filter(b => b.status === 'PENDING').length;
  const confirmed  = allBookings.filter(b => b.status === 'CONFIRMED').length;
  const inProgress = allBookings.filter(b => b.status === 'IN_PROGRESS').length;
  const completed  = allBookings.filter(b => b.status === 'COMPLETED').length;
  const cancelled  = allBookings.filter(b => b.status === 'CANCELLED').length;

  const totalSpent = allPayments.reduce((s, p) => s + (p.amount || 0), 0);

  const kpis = [
    { label: 'My Bookings',      value: totalBookings,                          icon: ClipboardList, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
    { label: 'Pending / Active', value: pending + confirmed + inProgress,       icon: Clock,         color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)' },
    { label: 'Completed Washes', value: completed,                              icon: CheckCircle2,  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)' },
    { label: 'Cancelled',        value: cancelled,                              icon: XCircle,       color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)' },
    { label: 'Total Spent',      value: `${totalSpent.toLocaleString()} RWF`,   icon: Wallet,        color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.25)' },
  ];

  const paymentStatus = (s) => ({
    PAID:             { color: '#4ade80', label: 'Paid' },
    PENDING:          { color: '#fbbf24', label: 'Pending' },
    REFUNDED:         { color: '#818cf8', label: 'Refunded' },
    REFUND_REQUESTED: { color: '#f97316', label: 'Refund Pending' },
    FAILED:           { color: '#f87171', label: 'Failed' },
  }[s] || { color: '#94a3b8', label: s });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>

      {/* Greeting */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.4rem' }}>
          Welcome back, {firstName}!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Here's a summary of all your car wash activity at <strong style={{ color: 'var(--rubis-red)' }}>Rubis</strong>.
        </p>
      </div>

      {/* Book Now CTA */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.05) 100%)',
        border: '1px solid rgba(220,38,38,0.25)', borderRadius: '16px',
        padding: '1.5rem 2rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ fontWeight: '800', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Ready for a wash?</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Book your next appointment in seconds.</div>
        </div>
        <button onClick={() => setShowBookingModal(true)} className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', borderRadius: '50px', fontWeight: '900', fontSize: '0.95rem' }}>
          + Book Now
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {kpis.map(k => (
          <div key={k.label} className="glass-panel" style={{ padding: '1.4rem 1.6rem', border: `1px solid ${k.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>{k.label}</span>
              <div style={{ padding: '7px', background: k.bg, borderRadius: '9px', display: 'flex' }}>
                <k.icon size={16} color={k.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: '900', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown pills */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {[
          { label: 'Pending',     count: pending,     color: '#fbbf24' },
          { label: 'Confirmed',   count: confirmed,   color: '#60a5fa' },
          { label: 'In Progress', count: inProgress,  color: '#8b5cf6' },
          { label: 'Completed',   count: completed,   color: '#4ade80' },
          { label: 'Cancelled',   count: cancelled,   color: '#f87171' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface)', border: '1px solid var(--border-white)',
            borderRadius: '50px', padding: '0.45rem 1rem', fontSize: '0.78rem',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{s.label}</span>
            <span style={{ fontWeight: '900', color: 'white' }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* My Bookings Table */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <CalendarDays size={20} color="var(--rubis-red)" /> My Booking History
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button disabled={bPage === 0} onClick={() => setBPage(p => p - 1)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', cursor: bPage === 0 ? 'default' : 'pointer', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', opacity: bPage === 0 ? 0.3 : 1 }}>
              ← Prev
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
              Page {bPage + 1} of {Math.ceil(totalBookings / 5) || 1}
            </span>
            <button disabled={bookings.length < 5} onClick={() => setBPage(p => p + 1)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', cursor: bookings.length < 5 ? 'default' : 'pointer', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', opacity: bookings.length < 5 ? 0.3 : 1 }}>
              Next →
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <CalendarDays size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: '700' }}>No bookings yet</p>
            <p style={{ fontSize: '0.85rem' }}>Click <strong>Book Now</strong> to schedule your first wash.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {['Vehicle', 'Service', 'Booked On', 'Scheduled For', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.9rem 1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1.15rem 1rem', fontWeight: '800' }}>{b.vehicleLicensePlate}</td>
                    <td style={{ padding: '1.15rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {b.serviceName}
                      {b.additionalServiceNames && b.additionalServiceNames.length > 0 && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block', marginTop: '2px' }}>
                          + {b.additionalServiceNames.join(', ')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1.15rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '1.15rem 1rem', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: '600' }}>
                      <div>{new Date(b.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div style={{ fontSize: '0.72rem' }}>{new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ padding: '1.15rem 1rem' }}><StatusBadge status={b.status} /></td>
                    <td style={{ padding: '1.15rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['PENDING', 'CONFIRMED'].includes(b.status) && (
                          <>
                            <button onClick={() => handleEdit(b)} title="Edit booking"
                              style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '7px', cursor: 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                              <Edit3 size={13} /> Edit
                            </button>
                            <button onClick={() => handleCancel(b.id)} title="Cancel booking"
                              style={{ color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '7px', cursor: 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '800' }}>
                              <XCircle size={13} /> Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'COMPLETED' && (
                          <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: '700' }}>✓ Done</span>
                        )}
                        {b.status === 'CANCELLED' && (
                          <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: '700' }}>✗ Cancelled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Payments */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <Wallet size={20} color="#4ade80" /> My Payments
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button disabled={pPage === 0} onClick={() => setPPage(p => p - 1)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', cursor: pPage === 0 ? 'default' : 'pointer', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', opacity: pPage === 0 ? 0.3 : 1 }}>
              ← Prev
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
               Page {pPage + 1} of {Math.ceil(totalPayments / 5) || 1}
            </span>
            <button disabled={payments.length < 5} onClick={() => setPPage(p => p + 1)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', cursor: payments.length < 5 ? 'default' : 'pointer', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', opacity: payments.length < 5 ? 0.3 : 1 }}>
              Next →
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Wallet size={40} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
            <p>No payment records yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {['Ref', 'Date', 'Method', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.9rem 1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const ps = paymentStatus(p.status);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1.1rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.transactionReference}</td>
                      <td style={{ padding: '1.1rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(p.createdAt || p.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '1.1rem 1rem', fontWeight: '700', fontSize: '0.85rem' }}>
                        {p.paymentMethod?.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '1.1rem 1rem', fontWeight: '900', color: '#4ade80' }}>
                        {(p.amount || 0).toLocaleString()} RWF
                      </td>
                      <td style={{ padding: '1.1rem 1rem' }}>
                        <span style={{
                          color: ps.color, background: `${ps.color}18`, border: `1px solid ${ps.color}40`,
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
                        }}>{ps.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <ShieldAlert size={18} color="#f87171" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#f87171' }}>Danger Zone</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Requesting deletion will notify the admin, who must approve it before your account is removed.
          {myCustomer?.deletionRequested && myCustomer?.deletionRequestedAt && (
            <span style={{ display: 'block', marginTop: '0.4rem', color: '#fbbf24', fontWeight: '700', fontSize: '0.82rem' }}>
              Request submitted on {new Date(myCustomer.deletionRequestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — pending admin review.
            </span>
          )}
        </p>
        {myCustomer?.deletionRequested ? (
          <button
            onClick={onCancelDeletion}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem',
              background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)',
              color: '#fbbf24', cursor: 'pointer',
            }}
          >
            <XCircle size={15} /> Cancel Deletion Request
          </button>
        ) : (
          <button
            onClick={onRequestDeletion}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', cursor: 'pointer',
            }}
          >
            <UserX size={15} /> Request Account Deletion
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   ADMIN / MANAGER / STAFF DASHBOARD
───────────────────────────────────────────────── */
const AdminDashboard = ({ profile, bookings, payments, stats, allBookings, allPayments, bPage, setBPage,
                          pPage, setPPage, handleEdit, handleCancel, handleDelete,
                          showBookingModal, setShowBookingModal, bookingToEdit,
                          setBookingToEdit, fetchData, navigate }) => {

  const userName = profile?.fullName?.split(' ')[0] || 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Compute 7-day metrics physically from the logs
  const { weeklyRevenueData, carsPerDayData } = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const past7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateString: d.toISOString().split('T')[0],
        day: days[d.getDay()],
        cars: 0,
        revenue: 0,
        services: {}
      };
    });

    if (allBookings) {
      allBookings.forEach(b => {
        const bDate = (b.createdAt || b.scheduledAt)?.split('T')[0];
        const target = past7Days.find(d => d.dateString === bDate);
        if (target) {
            target.cars++;
            const sName = b.serviceName || 'Wash';
            target.services[sName] = (target.services[sName] || 0) + 1;
        }
      });
    }

    if (allPayments) {
      allPayments.forEach(p => {
        if (p.status !== 'PAID') return;
        const pDate = (p.createdAt || p.paidAt)?.split('T')[0];
        const target = past7Days.find(d => d.dateString === pDate);
        if (target) target.revenue += (p.amount || 0);
      });
    }

    return { 
      weeklyRevenueData: past7Days.map(d => ({ day: d.day, revenue: d.revenue, desc: d.dateString })),
      carsPerDayData: past7Days.map(d => {
        const topSvcs = Object.entries(d.services)
          .sort((a,b) => b[1] - a[1])
          .map(e => `${e[0]} (${e[1]})`)
          .join(', ');
        return { 
          day: d.day, cars: d.cars, desc: d.dateString, 
          servicesStr: topSvcs || 'None' 
        };
      })
    };
  }, [allBookings, allPayments]);

  const guestBookingsCount = allBookings?.filter(b => b.isGuest || b.guest).length || 0;

  const kpis = [
    { label: "Today's Cars",    value: stats?.todayCars     ?? '—', icon: Car,    bg: '#ef4444' },
    { label: 'Revenue Today',   value: `${(stats?.todayRevenue || 0).toLocaleString()} RWF`, icon: Wallet, bg: '#10b981' },
    { label: 'Queue Length',    value: stats?.pendingBookings ?? '—', icon: Timer,  bg: '#3b82f6', path: '/queue' },
    { label: 'Total Customers', value: (stats?.totalCustomers || 0).toLocaleString(), icon: Users, bg: '#f59e0b', path: '/customers' },
    { label: 'Guest Bookings',  value: guestBookingsCount, icon: User, bg: '#8b5cf6', path: '/guest-bookings' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '0.15rem' }}>
            {greeting}, {userName}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Here's what's happening at RUBIS Car Wash today</p>
        </div>
        {/* Peak Alert — inline with header */}
        <div style={{
          display: 'flex', gap: '0.6rem', alignItems: 'center',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderLeft: '3px solid #f59e0b', borderRadius: '8px', padding: '0.55rem 1rem',
        }}>
          <AlertCircle size={15} color="#f59e0b" />
          <div>
            <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '0.78rem' }}>Peak Hours Alert</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>High demand 4:00 PM – 6:00 PM today.</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: k.bg, borderRadius: '12px', padding: '1rem 1.1rem',
            color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.5rem',
            cursor: k.path ? 'pointer' : 'default', transition: 'transform 0.2s',
          }}
          onClick={() => { if (k.path) navigate(k.path); }}
          className={k.path ? 'card-hover' : ''}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: '900' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>Weekly Revenue</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-white)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border-white)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }} itemStyle={{ color: '#10b981' }} />
                <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#1a1a2e' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>Cars Per Day</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carsPerDayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-white)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip cursor={{ fill: 'var(--surface)' }} contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border-white)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }} />
                <Bar dataKey="cars" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={28}>
                  {carsPerDayData.map((_, i) => <Cell key={i} fill={i === carsPerDayData.length - 1 ? '#3b82f6' : '#60a5fa'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Table for Charts */}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
        const totalCars = carsPerDayData.reduce((s, d) => s + d.cars, 0);
        const totalRevenue = weeklyRevenueData.reduce((s, d) => s + d.revenue, 0);
        const reversedData = [...carsPerDayData].reverse();
        return (
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0 }}>7-Day Performance Breakdown</h3>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Total: <strong style={{ color: '#60a5fa' }}>{totalCars} cars</strong></span>
                <span>Revenue: <strong style={{ color: '#10b981' }}>{totalRevenue.toLocaleString()} RWF</strong></span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {['Date', 'Day', 'Cars Processed', 'Total Revenue Generated', 'Service Categories'].map(h => (
                      <th key={h} style={{ padding: '0.9rem 1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reversedData.map((d, idx) => {
                    const originalIdx = carsPerDayData.length - 1 - idx;
                    const revenue = weeklyRevenueData[originalIdx].revenue;
                    const isToday = d.desc === todayStr;
                    const isYesterday = d.desc === yesterdayStr;
                    const isEven = idx % 2 === 0;
                    const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : null;
                    return (
                      <tr key={idx} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isToday
                          ? 'rgba(96,165,250,0.06)'
                          : isEven ? 'rgba(255,255,255,0.015)' : 'transparent',
                        transition: 'background 0.15s',
                      }}>
                        <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{d.desc}</span>
                          {dateLabel && (
                            <span style={{
                              marginLeft: '8px', fontSize: '0.65rem', fontWeight: '800',
                              color: isToday ? '#60a5fa' : 'var(--text-muted)',
                              background: isToday ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                              padding: '2px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>{dateLabel}</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '800', fontSize: '0.9rem' }}>{d.day}</td>
                        <td style={{ padding: '1rem' }}>
                          {d.cars === 0
                            ? <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>0 cars</span>
                            : <span style={{ color: '#60a5fa', fontWeight: '800' }}>{d.cars} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>cars</span></span>
                          }
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {revenue === 0
                            ? <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>0 <span style={{ fontSize: '0.75rem' }}>RWF</span></span>
                            : <span style={{ color: '#10b981', fontWeight: '800' }}>{revenue.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>RWF</span></span>
                          }
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {d.servicesStr === 'None'
                            ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No activity</span>
                            : d.servicesStr.split(', ').map(s => (
                              <span key={s} style={{
                                display: 'inline-block',
                                background: 'rgba(59,130,246,0.1)',
                                border: '1px solid rgba(59,130,246,0.2)',
                                color: '#60a5fa',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                marginRight: '6px',
                                marginBottom: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                              }}>{s}</span>
                            ))
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                    <td colSpan={2} style={{ padding: '0.9rem 1rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>7-Day Totals</td>
                    <td style={{ padding: '0.9rem 1rem', color: '#60a5fa', fontWeight: '900' }}>{totalCars} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>cars</span></td>
                    <td style={{ padding: '0.9rem 1rem', color: '#10b981', fontWeight: '900' }}>{totalRevenue.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>RWF</span></td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{carsPerDayData.filter(d => d.cars > 0).length} active days</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Recent Cancellations */}
      {(() => {
        const cancelled = (allBookings || [])
          .filter(b => b.status === 'CANCELLED')
          .sort((a, b) => new Date(b.createdAt || b.scheduledAt) - new Date(a.createdAt || a.scheduledAt))
          .slice(0, 8);
        return (
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px' }}>
                <BellRing size={18} color="#f87171" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Recent Cancellations</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bookings cancelled by customers</p>
              </div>
              {cancelled.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800' }}>
                  {cancelled.length} {cancelled.length === 1 ? 'cancellation' : 'cancellations'}
                </span>
              )}
            </div>
            {cancelled.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>No cancellations — great!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'left' }}>
                      {['Customer', 'Vehicle', 'Service', 'Cancelled On', 'Reason'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cancelled.map((b, i) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                        <td style={{ padding: '0.9rem 1rem', fontWeight: '700', fontSize: '0.88rem' }}>{b.customerName || b.guestName || '—'}</td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--rubis-red)', fontWeight: '800', fontSize: '0.85rem' }}>{b.vehicleLicensePlate || b.guestVehiclePlate || '—'}</td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{b.serviceName || '—'}</td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                          <span style={{ opacity: 0.8 }}>{b.notes || 'No reason provided'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* Queue Table */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Current Queue</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button disabled={bPage === 0} onClick={() => setBPage(p => p - 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', padding: '0.3rem 0.65rem', borderRadius: '6px', cursor: bPage === 0 ? 'default' : 'pointer', fontSize: '0.75rem', opacity: bPage === 0 ? 0.3 : 1 }}>Prev</button>
            <button disabled={bookings.length < 5} onClick={() => setBPage(p => p + 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', padding: '0.3rem 0.65rem', borderRadius: '6px', cursor: bookings.length < 5 ? 'default' : 'pointer', fontSize: '0.75rem', opacity: bookings.length < 5 ? 0.3 : 1 }}>Next</button>
            <Link to="/queue" style={{ fontSize: '0.82rem', color: 'var(--rubis-red)', fontWeight: '700', textDecoration: 'none' }}>View All →</Link>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {['Vehicle', 'Service', 'Time', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '0.9rem 1rem', fontWeight: '700', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? bookings.slice(0, 5).map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '1.15rem 1rem', fontWeight: '700' }}>{b.vehicleLicensePlate}</td>
                  <td style={{ padding: '1.15rem 1rem', color: 'var(--text-muted)' }}>{b.serviceName}</td>
                  <td style={{ padding: '1.15rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '1.15rem 1rem' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '1.15rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['PENDING', 'CONFIRMED'].includes(b.status) && (
                        <>
                          <button onClick={() => handleEdit(b)} style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', cursor: 'pointer', padding: '4px 7px', display: 'flex' }}><Edit3 size={14} /></button>
                          <button onClick={() => handleCancel(b.id)} style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', cursor: 'pointer', padding: '4px 7px', display: 'flex' }}><XCircle size={14} /></button>
                        </>
                      )}
                      {(profile.role === 'ADMIN' || profile.role === 'MANAGER') && (
                        <button onClick={() => handleDelete(b.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active bookings in the queue.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <Wallet size={20} color="#10b981" /> Recent Transactions
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button disabled={pPage === 0} onClick={() => setPPage(p => p - 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', padding: '0.3rem 0.65rem', borderRadius: '6px', cursor: pPage === 0 ? 'default' : 'pointer', fontSize: '0.75rem', opacity: pPage === 0 ? 0.3 : 1 }}>Prev</button>
            <button disabled={payments.length < 5} onClick={() => setPPage(p => p + 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', padding: '0.3rem 0.65rem', borderRadius: '6px', cursor: payments.length < 5 ? 'default' : 'pointer', fontSize: '0.75rem', opacity: payments.length < 5 ? 0.3 : 1 }}>Next</button>
            <Link to="/payments" style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>All Transactions →</Link>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {['Date', 'Method', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '0.9rem 1rem', fontWeight: '700', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(p.createdAt || p.paidAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontWeight: '600', fontSize: '0.85rem' }}>{p.paymentMethod?.replace('_', ' ')}</td>
                  <td style={{ padding: '1rem', color: '#10b981', fontWeight: '800' }}>{(p.amount || 0).toLocaleString()} RWF</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>
                      {p.status || 'PENDING'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────
   ROOT DASHBOARD (switches between the two)
───────────────────────────────────────────────── */
const Dashboard = () => {
  const [profile, setProfile]           = useState(null);
  const [myCustomer, setMyCustomer]     = useState(null);
  const [bookings, setBookings]         = useState([]);
  const [payments, setPayments]         = useState([]);
  const [allBookings, setAllBookings]   = useState([]);
  const [allPayments, setAllPayments]   = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [bPage, setBPage]               = useState(0);
  const [pPage, setPPage]               = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingToEdit, setBookingToEdit]       = useState(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    fetchDashboardData(bPage, pPage);
  }, [bPage, pPage]);

  // Handle URL "book" parameter independently so pagination doesn't re-trigger it
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('book') === 'true') {
      setShowBookingModal(true);
      // Clean the URL to prevent re-triggers if the component mounts again
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search]);

  const fetchDashboardData = async (bp = 0, pp = 0) => {
    try {
      const meRes = await api.get('/auth/me');
      const p     = meRes.data;
      setProfile(p);
      const isCust = p.role === 'CUSTOMER';

      const bEnd = isCust ? `/bookings/my-bookings?page=${bp}&size=5&sort=createdAt,desc` : `/bookings?page=${bp}&size=5&sort=createdAt,desc`;
      const pEnd = isCust ? `/payments/my-payments?page=${pp}&size=5&sort=createdAt,desc` : `/payments?page=${pp}&size=5&sort=createdAt,desc`;

      const [bRes, pRes, sRes, allBRes, allPRes, custRes] = await Promise.all([
        api.get(bEnd),
        api.get(pEnd),
        !isCust ? api.get('/reports/dashboard').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        isCust ? api.get(`/bookings/my-bookings?page=0&size=1000&sort=createdAt,desc`) : api.get(`/bookings?page=0&size=1000&sort=createdAt,desc`),
        isCust ? api.get(`/payments/my-payments?page=0&size=1000&sort=createdAt,desc`) : api.get(`/payments?page=0&size=1000&sort=createdAt,desc`),
        isCust ? api.get('/customers/me').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);

      const bData = (Array.isArray(bRes.data.content) ? bRes.data.content : (Array.isArray(bRes.data) ? bRes.data : []))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const pData = (Array.isArray(pRes.data.content) ? pRes.data.content : (Array.isArray(pRes.data) ? pRes.data : []))
        .sort((a, b) => new Date(b.createdAt || b.paidAt || 0) - new Date(a.createdAt || a.paidAt || 0));

      setBookings(bData);
      setTotalBookings(bRes.data.totalElements || bData.length);
      setPayments(pData);
      setTotalPayments(pRes.data.totalElements || pData.length);
      setStats(sRes.data);

      setAllBookings(Array.isArray(allBRes.data?.content) ? allBRes.data.content : []);
      setAllPayments(Array.isArray(allPRes.data?.content) ? allPRes.data.content : []);
      if (isCust) setMyCustomer(custRes.data);
    } catch (err) {
      console.error('Dashboard data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit   = (b) => { setBookingToEdit(b); setShowBookingModal(true); };
  const handleCancel = async (id) => {
    const reason = window.prompt("Why are you cancelling this booking?", "Changed my mind");
    if (reason === null) return; // User clicked "Cancel" on the prompt box
    try { 
      await api.patch(`/bookings/${id}/cancel`, null, { params: { reason: reason || "Cancelled by customer" } }); 
      fetchDashboardData(bPage, pPage); 
    } catch (err) { 
      alert('Cancel failed: ' + (err.response?.data?.message || err.message)); 
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this booking?')) return;
    try { await api.delete(`/bookings/${id}`); fetchDashboardData(bPage, pPage); }
    catch (err) { alert('Delete failed: ' + (err.response?.data?.message || err.message)); }
  };

  const handleRequestDeletion = async () => {
    if (!window.confirm('Are you sure you want to request account deletion? The admin will be notified and must approve before your account is removed.')) return;
    try {
      await api.post('/customers/me/request-deletion');
      setMyCustomer(prev => ({ ...prev, deletionRequested: true, deletionRequestedAt: new Date().toISOString() }));
    } catch (err) {
      alert('Request failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await api.delete('/customers/me/request-deletion');
      setMyCustomer(prev => ({ ...prev, deletionRequested: false, deletionRequestedAt: null }));
    } catch (err) {
      alert('Could not cancel request: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return null;
  const isCustomer = profile?.role === 'CUSTOMER';

  const sharedProps = {
    profile, bookings, payments, allBookings, allPayments, stats,
    totalBookings, totalPayments, bPage, setBPage, pPage, setPPage,
    handleEdit, handleCancel, showBookingModal, setShowBookingModal,
    bookingToEdit, setBookingToEdit, fetchData: fetchDashboardData,
    navigate,
  };

  return (
    <>
      {isCustomer
        ? <CustomerDashboard {...sharedProps} myCustomer={myCustomer} onRequestDeletion={handleRequestDeletion} onCancelDeletion={handleCancelDeletion} />
        : <AdminDashboard {...sharedProps} handleDelete={handleDelete} />
      }

      {showBookingModal && (
        <BookingModal
          editData={bookingToEdit}
          onClose={() => { setShowBookingModal(false); setBookingToEdit(null); }}
          onSuccess={() => fetchDashboardData(bPage, pPage)}
        />
      )}

      <WeatherWidget compact={true} floating={true} />
    </>
  );
};

export default Dashboard;
