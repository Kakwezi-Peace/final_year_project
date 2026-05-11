import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, BadgeCheck,
  CheckCircle2, ClipboardList, BellRing,
  ShieldAlert, Trash2, AlertTriangle, RefreshCw,
  Calendar, UserCheck
} from 'lucide-react';
import api from '../services/api';

const fmt = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const fmtDate = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const cfg = {
    PENDING:     { label: 'Pending',     color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)' },
    CONFIRMED:   { label: 'Confirmed',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
    IN_PROGRESS: { label: 'In Progress', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
    COMPLETED:   { label: 'Completed',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)' },
    CANCELLED:   { label: 'Cancelled',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
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

const PayBadge = ({ status }) => {
  const cfg = {
    PAID:             { label: 'Paid',           color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)' },
    PENDING:          { label: 'Pending',         color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
    REFUND_REQUESTED: { label: 'Refund Pending',  color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
    REFUNDED:         { label: 'Refunded',        color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
    FAILED:           { label: 'Failed',          color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  }[status] || { label: status || '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' };

  return (
    <span style={{
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      padding: '2px 9px', borderRadius: '50px', fontSize: '0.68rem',
      fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'
    }}>
      {cfg.label}
    </span>
  );
};

const TH = ({ children }) => (
  <th style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [approvingRefund, setApprovingRefund] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [custRes, bookRes, meRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/bookings/customer/${id}`),
        api.get('/auth/me'),
      ]);
      setCustomer(custRes.data);
      const raw = bookRes.data?.content || bookRes.data || [];
      setBookings([...raw].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setUserRole(meRes.data?.role);
    } catch {
      setError('Could not load customer details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleApproveRefund = async (paymentId, bookingRef) => {
    if (!window.confirm(`Approve 90% refund for booking ${bookingRef}? (10% cancellation fee retained)`)) return;
    setApprovingRefund(paymentId);
    try {
      await api.patch(`/payments/${paymentId}/refund`);
      flash(`Refund approved for ${bookingRef}. Customer will receive 90% of the paid amount.`);
      load();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to approve refund.', true);
    } finally {
      setApprovingRefund(null);
    }
  };

  const handleApproveDelete = async () => {
    if (!window.confirm(`Permanently delete ${customer.fullName}? All their data will be removed. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${id}`);
      navigate('/customers', { replace: true });
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to delete customer.', true);
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border-white)', borderTopColor: 'var(--rubis-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading customer details...
      </div>
    </div>
  );

  if (error && !customer) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <AlertTriangle size={40} color="#f87171" style={{ marginBottom: '1rem' }} />
      <p style={{ color: '#f87171', fontWeight: '700' }}>{error}</p>
      <button onClick={() => navigate('/customers')} className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Customers</button>
    </div>
  );

  const cancellations = bookings.filter(b => b.status === 'CANCELLED');
  const completed     = bookings.filter(b => b.status === 'COMPLETED');
  const active        = bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status));
  const refundsPending = bookings.filter(b => b.status === 'CANCELLED' && b.payment?.status === 'REFUND_REQUESTED');
  const initials = customer?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  const canAct = ['ADMIN', 'MANAGER'].includes(userRole);

  return (
    <div style={{ width: '100%', paddingBottom: '3rem' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate('/customers')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', padding: 0 }}
        >
          <ArrowLeft size={18} /> Back to Customers
        </button>
        {canAct && customer?.deletionRequested && (
          <button
            onClick={handleApproveDelete}
            disabled={deleting}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trash2 size={15} /> {deleting ? 'Deleting…' : 'Approve & Delete Account'}
          </button>
        )}
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
      {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* ── Deletion request banner ─────────────────────────────────── */}
      {customer?.deletionRequested && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <ShieldAlert size={22} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: '800', color: '#f87171', fontSize: '0.95rem' }}>Account Deletion Requested by Customer</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <strong>{customer.fullName}</strong> submitted a deletion request on <strong>{fmt(customer.deletionRequestedAt)}</strong>.
              {canAct ? ' As admin/manager you can approve it using the button above.' : ' Only ADMIN or MANAGER can approve this.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Refund requests banner ──────────────────────────────────── */}
      {refundsPending.length > 0 && (
        <div style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <RefreshCw size={22} color="#f97316" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: '#f97316', fontSize: '0.95rem' }}>
              {refundsPending.length} Refund {refundsPending.length === 1 ? 'Request' : 'Requests'} Pending Approval
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Customer has requested a refund on cancelled bookings. Review the Cancelled Bookings section below to approve.
            </p>
          </div>
        </div>
      )}

      {/* ── Profile card ────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--rubis-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '900', color: '#fff', flexShrink: 0, boxShadow: '0 0 20px rgba(227,6,19,0.3)' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: '900' }}>{customer?.fullName}</h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {customer?.email    && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><Mail size={13} />{customer.email}</span>}
              {customer?.phone    && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><Phone size={13} />{customer.phone}</span>}
              {customer?.address  && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><MapPin size={13} />{customer.address}</span>}
              {customer?.nationalId && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><BadgeCheck size={13} />ID: {customer.nationalId}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><Calendar size={13} />Registered: {fmtDate(customer?.registeredAt)}</span>
            </div>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
            {[
              { label: 'Total', value: bookings.length,    color: '#60a5fa' },
              { label: 'Done',  value: completed.length,   color: '#4ade80' },
              { label: 'Active',value: active.length,      color: '#fbbf24' },
              { label: 'Cancel',value: cancellations.length, color: '#f87171' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', borderRadius: '10px', padding: '0.5rem 0.9rem', textAlign: 'center', minWidth: '72px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cancelled bookings with refund actions ──────────────────── */}
      {cancellations.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px' }}>
              <BellRing size={18} color="#f87171" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Cancelled Bookings</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bookings cancelled by this customer — approve refunds below</p>
            </div>
            <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800' }}>
              {cancellations.length} {cancellations.length === 1 ? 'cancellation' : 'cancellations'}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <TH>Reference</TH>
                  <TH>Vehicle</TH>
                  <TH>Service</TH>
                  <TH>Cancelled At</TH>
                  <TH>Cancellation Reason</TH>
                  <TH>Amount Paid</TH>
                  <TH>Refund Breakdown</TH>
                  {canAct && <TH>Refund Action</TH>}
                </tr>
              </thead>
              <tbody>
                {cancellations.map((b, i) => {
                  const pay = b.payment;
                  const paid = pay?.amount ? Number(pay.amount) : 0;
                  const fee = Math.round(paid * 0.10);
                  const refundAmt = paid - fee;
                  const canApprove = canAct && pay?.status === 'REFUND_REQUESTED';
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', fontSize: '0.82rem', color: 'var(--rubis-red)', whiteSpace: 'nowrap' }}>{b.bookingReference || `#${b.id}`}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{b.vehicleLicensePlate || b.guestVehiclePlate || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{b.serviceName || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#f87171', fontSize: '0.82rem', whiteSpace: 'nowrap', fontWeight: '600' }}>{fmt(b.updatedAt || b.createdAt)}</td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '200px' }}>{b.notes || 'No reason provided'}</td>
                      {/* Amount paid */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {pay ? (
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#4ade80' }}>{paid.toLocaleString()} RWF</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{pay.method?.replace(/_/g, ' ')}</div>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>No payment made</span>}
                      </td>
                      {/* Refund breakdown */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {pay && paid > 0 ? (
                          <div style={{ fontSize: '0.78rem', lineHeight: 1.7 }}>
                            <div><PayBadge status={pay.status} /></div>
                            <div style={{ marginTop: '5px', color: 'var(--text-muted)' }}>
                              Paid: <strong style={{ color: 'var(--text-primary)' }}>{paid.toLocaleString()} RWF</strong>
                            </div>
                            <div style={{ color: '#f87171' }}>
                              Fee (10%): <strong>− {fee.toLocaleString()} RWF</strong>
                            </div>
                            <div style={{ color: pay.status === 'REFUNDED' ? '#818cf8' : '#fbbf24', fontWeight: '800' }}>
                              {pay.status === 'REFUNDED' ? '✓ Refunded' : 'To refund'}: <strong>{refundAmt.toLocaleString()} RWF</strong>
                            </div>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                      </td>
                      {canAct && (
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {canApprove ? (
                            <button
                              onClick={() => handleApproveRefund(pay.paymentId, b.bookingReference)}
                              disabled={approvingRefund === pay.paymentId}
                              style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '7px', padding: '6px 14px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                            >
                              <RefreshCw size={13} />
                              {approvingRefund === pay.paymentId ? 'Processing…' : `Approve ${refundAmt.toLocaleString()} RWF Refund`}
                            </button>
                          ) : pay?.status === 'REFUNDED' ? (
                            <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '800' }}>✓ Refund approved</span>
                          ) : pay?.status === 'PAID' ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Customer has not requested refund yet</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── All bookings ────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(96,165,250,0.1)', padding: '8px', borderRadius: '8px' }}>
            <ClipboardList size={18} color="#60a5fa" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>All Bookings</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full booking history for this customer</p>
          </div>
          <span style={{ marginLeft: 'auto', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800' }}>
            {bookings.length} total
          </span>
        </div>

        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <ClipboardList size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>No bookings yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <TH>Reference</TH>
                  <TH>Vehicle</TH>
                  <TH>Service</TH>
                  <TH>Washed By (Staff)</TH>
                  <TH>Status</TH>
                  <TH>Scheduled</TH>
                  <TH>Amount</TH>
                  <TH>Payment</TH>
                  <TH>Notes</TH>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: b.status === 'CANCELLED'
                        ? 'rgba(239,68,68,0.03)'
                        : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', fontSize: '0.82rem', color: b.status === 'CANCELLED' ? '#f87171' : 'var(--rubis-red)', whiteSpace: 'nowrap' }}>
                      {b.bookingReference || `#${b.id}`}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {b.vehicleLicensePlate || b.guestVehiclePlate || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <div>{b.serviceName || '—'}</div>
                      {b.additionalServiceNames?.length > 0 && (
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>+{b.additionalServiceNames.join(', ')}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem' }}>
                      {b.assignedEmployeeName ? (
                        <div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            <UserCheck size={13} />{b.assignedEmployeeName}
                          </span>
                          {b.status === 'COMPLETED' && (
                            <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: '700' }}>✓ Completed wash</span>
                          )}
                          {b.status === 'CANCELLED' && (
                            <span style={{ fontSize: '0.68rem', color: '#f87171', fontStyle: 'italic' }}>assigned, not washed</span>
                          )}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {fmtDate(b.scheduledAt)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', fontSize: '0.85rem', color: '#4ade80', whiteSpace: 'nowrap' }}>
                      {b.totalAmount ? `${Number(b.totalAmount).toLocaleString()} RWF` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      {b.payment ? <PayBadge status={b.payment.status} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: b.status === 'CANCELLED' ? '#f87171' : 'var(--text-muted)', maxWidth: '200px' }}>
                      {b.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Account Deletion Management ─────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.25rem', border: `1px solid ${customer?.deletionRequested ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.06)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1rem' }}>
          <div style={{ background: customer?.deletionRequested ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)', padding: '8px', borderRadius: '8px' }}>
            <ShieldAlert size={18} color={customer?.deletionRequested ? '#f87171' : '#6b7280'} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: customer?.deletionRequested ? '#f87171' : 'var(--text-primary)' }}>
              Account Deletion Management
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Manage account deletion for <strong>{customer?.fullName}</strong>
            </p>
          </div>
        </div>

        {customer?.deletionRequested ? (
          <div>
            {/* Flow explanation */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { step: '1', label: 'Customer requested deletion', sub: `From their dashboard on ${fmt(customer.deletionRequestedAt)}`, done: true, color: '#4ade80' },
                { step: '2', label: 'Admin/Manager review', sub: 'You are here — review and approve or dismiss', done: false, color: '#fbbf24' },
                { step: '3', label: 'Account permanently deleted', sub: 'All data removed from the system', done: false, color: '#f87171' },
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.done ? `${s.color}22` : idx === 1 ? 'rgba(251,191,36,0.1)' : 'rgba(107,114,128,0.1)', border: `2px solid ${s.done ? s.color : idx === 1 ? '#fbbf24' : 'rgba(107,114,128,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900', color: s.done ? s.color : idx === 1 ? '#fbbf24' : '#6b7280' }}>
                      {s.done ? '✓' : s.step}
                    </div>
                  </div>
                  <div style={{ marginRight: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: s.done ? s.color : idx === 1 ? '#fbbf24' : 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.sub}</div>
                  </div>
                  {idx < 2 && <div style={{ width: 30, height: 2, background: 'var(--border-white)', margin: '0 0.25rem', flexShrink: 0 }} />}
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ⚠ <strong style={{ color: '#f87171' }}>Warning:</strong> Approving this will <strong>permanently delete</strong> all data for <strong>{customer?.fullName}</strong> including all bookings, vehicles, and payment records. This action <strong>cannot be undone</strong>.
              </p>
            </div>

            {canAct ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleApproveDelete}
                  disabled={deleting}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={16} /> {deleting ? 'Deleting account…' : `Approve & Delete ${customer?.fullName}'s Account`}
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Only ADMIN and MANAGER can perform this action
                </span>
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                You do not have permission to approve deletions. Only ADMIN or MANAGER can do this.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(107,114,128,0.05)', borderRadius: '10px', border: '1px solid rgba(107,114,128,0.15)' }}>
            <CheckCircle2 size={20} color="#4ade80" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '0.88rem', color: '#4ade80' }}>No deletion request from this customer</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                The customer must first submit a deletion request from their own dashboard. Once they do, it will appear here for your approval.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
