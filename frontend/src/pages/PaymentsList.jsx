import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BookingModal from '../components/BookingModal';
import Pagination from '../components/Pagination';
import { useSearch } from '../context/SearchContext';
import { AlertTriangle, CheckCircle2, X, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PaymentsList = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stats, setStats]             = useState({ todayRevenue: 0, totalTransactions: 0, momoPercentage: 0 });
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [refundModal, setRefundModal] = useState(null); // { payment }
  const [refunding, setRefunding]     = useState(false);

  /* ── Delete confirmation modal state ── */
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed]   = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const user           = JSON.parse(localStorage.getItem('user') || '{}');
  const isCustomer     = user.role === 'CUSTOMER';
  const isAdminOrMgr   = ['ADMIN', 'MANAGER'].includes(user.role);

  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => { fetchPayments(currentPage); }, [currentPage]);

  const fetchPayments = async (pageIdx = 0, query = searchQuery) => {
    setLoading(true);
    try {
      const qParam   = query ? `&q=${encodeURIComponent(query)}` : '';
      const endpoint = isCustomer
        ? `/payments/my-payments?page=${pageIdx}&size=10&sort=createdAt,desc${qParam}`
        : `/payments?page=${pageIdx}&size=10&sort=createdAt,desc${qParam}`;

      const res  = await api.get(endpoint);
      const data = res.data.content || res.data || [];
      setPayments(data);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);

      const sRes = await api.get('/reports/dashboard');
      setStats({
        dailyRevenue:      sRes.data.todayRevenue || 0,
        weeklyRevenue:     sRes.data.weeklyRevenue || 0,
        mtnShare:          sRes.data.mtnRevenue || 0,
        airtelShare:       sRes.data.airtelRevenue || 0,
      });
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setCurrentPage(0); fetchPayments(0, searchQuery); }, [searchQuery]);

  /* ── Open the approval confirmation modal ── */
  const openRefundModal = (payment) => setRefundModal({ payment });

  /* ── Admin confirms refund ── */
  const confirmRefund = async () => {
    if (!refundModal) return;
    setRefunding(true);
    try {
      await api.patch(`/payments/${refundModal.payment.id}/refund`);
      setRefundModal(null);
      fetchPayments(currentPage);
    } catch (err) {
      alert('Refund failed: ' + (err.response?.data?.message || err.response?.data?.error || err.message));
    } finally {
      setRefunding(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteModalId(id);
    setDeleteConfirmed(false);
  };

  const confirmDelete = async () => {
    if (!deleteModalId || !deleteConfirmed) return;
    setDeleting(true);
    try {
      await api.delete(`/payments/${deleteModalId}`);
      fetchPayments(currentPage);
      setDeleteModalId(null);
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  /* ── Export to Excel ── */
  const exportAllToExcel = async () => {
    try {
      const res = await api.get('/payments?page=0&size=10000');
      const allData = res.data.content || res.data || [];
      const formatted = allData.map(p => ({
        CustomerName: p.customerName || 'Walk-in',
        Amount: p.amount,
        Method: p.paymentMethod?.replace('_', ' '),
        Status: p.status,
        Reference: p.transactionReference,
        Date: new Date(p.createdAt || p.paidAt).toLocaleDateString()
      }));
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      XLSX.writeFile(wb, "transactions_ledger.xlsx");
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  };

  /* ── Export to PDF ── */
  const exportPDF = (p) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("RUBIS STATION KIGALI", 14, 22);
      
      doc.setFontSize(14);
      doc.text("Payment Receipt", 14, 32);

      autoTable(doc, {
        startY: 40,
        head: [['Field', 'Details']],
        body: [
          ['Transaction Ref', p.transactionReference],
          ['Customer Name', p.customerName || 'Walk-in'],
          ['Amount', p.amount.toLocaleString() + ' RWF'],
          ['Payment Method', p.paymentMethod?.replace('_', ' ') || ''],
          ['Date', p.createdAt ? new Date(p.createdAt).toLocaleString() : ''],
          ['Status', p.status]
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] } 
      });

      doc.save(`Receipt_${p.transactionReference}.pdf`);
    } catch (e) {
      alert("PDF Export failed: " + e.message);
    }
  };

  const statusStyle = (status) => {
    const map = {
      PAID:             { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)' },
      PENDING:          { color: '#eab308', bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.25)' },
      FAILED:           { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)' },
      REFUNDED:         { color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.25)' },
      REFUND_REQUESTED: { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.3)' },
    };
    return map[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
  };

  const statusLabel = (status) =>
    status === 'REFUND_REQUESTED' ? '⏳ REFUND PENDING' : status;

  /* ── 10% preview calculation ── */
  const fee10 = (amt) => Math.round(amt * 0.1);
  const net90 = (amt) => Math.round(amt * 0.9);

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', padding: '1rem 0' }}>

      {/* ── Refund Approval Modal ── */}
      {refundModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-white)',
            borderRadius: '20px', padding: '2rem', width: '420px', maxWidth: '92vw',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '8px', background: 'rgba(249,115,22,0.15)', borderRadius: '10px', display: 'flex' }}>
                  <AlertTriangle size={20} color="#f97316" />
                </div>
                <h3 style={{ fontWeight: '900', fontSize: '1.1rem', margin: 0 }}>Approve Refund</h3>
              </div>
              <button onClick={() => setRefundModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Info */}
            <div style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', lineHeight: 1.6 }}>
                The customer <strong style={{ color: 'white' }}>{refundModal.payment.customerName}</strong> has cancelled their booking and requested a refund for:
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
                Ref: <span style={{ color: 'white', fontFamily: 'monospace' }}>{refundModal.payment.transactionReference}</span>
              </p>
            </div>

            {/* Breakdown table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Original amount</span>
                <span style={{ fontWeight: '700' }}>{(refundModal.payment.amount || 0).toLocaleString()} RWF</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#f87171' }}>10% cancellation fee (kept)</span>
                <span style={{ fontWeight: '700', color: '#f87171' }}>− {fee10(refundModal.payment.amount || 0).toLocaleString()} RWF</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '1rem', borderTop: '2px solid rgba(255,255,255,0.1)', marginTop: '0.25rem' }}>
                <span style={{ color: '#4ade80', fontWeight: '800' }}>Amount to refund</span>
                <span style={{ fontWeight: '900', color: '#4ade80', fontSize: '1.15rem' }}>{net90(refundModal.payment.amount || 0).toLocaleString()} RWF</span>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem', textAlign: 'center' }}>
              This action cannot be undone. A 10% cancellation fee is retained by the station.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setRefundModal(null)}
                disabled={refunding}
                style={{
                  flex: 1, padding: '0.8rem', background: 'var(--surface)',
                  border: '1px solid var(--border-white)', borderRadius: '10px',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '800',
                  fontSize: '0.8rem', textTransform: 'uppercase',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRefund}
                disabled={refunding}
                style={{
                  flex: 2, padding: '0.8rem',
                  background: refunding ? 'rgba(74,222,128,0.1)' : 'rgba(74,222,128,0.2)',
                  border: '2px solid rgba(74,222,128,0.4)', borderRadius: '10px',
                  color: '#4ade80', cursor: refunding ? 'not-allowed' : 'pointer',
                  fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <CheckCircle2 size={15} />
                {refunding ? 'Processing...' : `Approve — Refund ${net90(refundModal.payment.amount || 0).toLocaleString()} RWF`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Customer Deletion Authorization Modal ── */}
      {deleteModalId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '20px', padding: '2rem', width: '420px', maxWidth: '92vw',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontWeight: '900', fontSize: '1.2rem', margin: '0 0 1rem', color: '#ef4444' }}>
              Confirm Deletion Check
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              You are attempting to permanently delete a transaction/booking record. Strict policy requires that you first communicate with and receive authorization from the customer.
            </p>
            
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', cursor: 'pointer', marginBottom: '1.5rem' }}>
              <input 
                type="checkbox" 
                checked={deleteConfirmed} 
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                style={{ marginTop: '0.2rem', width: '1.1rem', height: '1.1rem' }} 
              />
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'white', userSelect: 'none' }}>
                I verify that I have obtained specific permission from the customer to delete this record.
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteModalId(null)}
                style={{ flex: 1, padding: '0.8rem', background: 'var(--surface)', border: '1px solid var(--border-white)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '800' }}
              >
                CANCEL
              </button>
              <button
                onClick={confirmDelete}
                disabled={!deleteConfirmed || deleting}
                style={{
                  flex: 1, padding: '0.8rem',
                  background: !deleteConfirmed ? 'rgba(148,163,184,0.1)' : 'rgba(239,68,68,0.15)',
                  border: !deleteConfirmed ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(239,68,68,0.4)',
                  borderRadius: '10px',
                  color: !deleteConfirmed ? '#94a3b8' : '#ef4444',
                  cursor: !deleteConfirmed ? 'not-allowed' : 'pointer',
                  fontWeight: '900', textTransform: 'uppercase'
                }}
              >
                {deleting ? 'DELETING...' : 'DELETE IT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800' }}>Payment Transactions</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Process revenue and monitor payment history
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={exportAllToExcel}
            className="btn glass-panel card-hover"
            style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <Download size={16} /> Excel Ledger
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowBookingModal(true)}
            style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            New Transaction
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel card-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Daily Revenue</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{stats.dailyRevenue?.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RWF</span></h3>
            </div>
            <div style={{ padding: '6px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>REV</div>
          </div>
        </div>
        <div className="glass-panel card-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Weekly Revenue</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{stats.weeklyRevenue?.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RWF</span></h3>
            </div>
            <div style={{ padding: '6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>WK</div>
          </div>
        </div>
        <div className="glass-panel card-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #facc15' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Weekly MTN MoMo</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{stats.mtnShare?.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RWF</span></h3>
            </div>
            <div style={{ padding: '6px', background: 'rgba(250,204,21,0.1)', color: '#facc15', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>MTN</div>
          </div>
        </div>
        <div className="glass-panel card-hover" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Weekly Airtel Money</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{stats.airtelShare?.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RWF</span></h3>
            </div>
            <div style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900' }}>AIR</div>
          </div>
        </div>
      </div>

      {/* Gateways */}
      <h4 style={{ marginBottom: '1.25rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gateway Providers</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '3rem' }}>
        <button onClick={() => setShowBookingModal(true)} className="glass-panel card-hover" style={{ padding: '1.5rem', border: '1px solid rgba(250,204,21,0.2)', borderLeft: '6px solid #facc15', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', cursor: 'pointer', background: 'rgba(250,204,21,0.02)' }}>
          <div style={{ width: '56px', height: '56px', background: '#facc15', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontWeight: '900', fontSize: '1.1rem' }}>MTN</div>
          <div><h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.15rem' }}>MTN MoMo</h3><p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Process instant MTN wallet payments</p></div>
        </button>
        <button onClick={() => setShowBookingModal(true)} className="glass-panel card-hover" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '6px solid #ef4444', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', cursor: 'pointer', background: 'rgba(239,68,68,0.02)' }}>
          <div style={{ width: '56px', height: '56px', background: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.1rem' }}>AIRTEL</div>
          <div><h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.15rem' }}>Airtel Money</h3><p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Collect payments from Airtel users</p></div>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Recent Transactions</h3>
            {payments.filter(p => p.status === 'REFUND_REQUESTED').length > 0 && (
              <p style={{ color: '#f97316', fontSize: '0.78rem', fontWeight: '700', margin: '0.3rem 0 0' }}>
                ⚠ {payments.filter(p => p.status === 'REFUND_REQUESTED').length} refund request(s) awaiting your approval
              </p>
            )}
          </div>
          <input
            type="text" placeholder="SEARCH..." className="input-field"
            style={{ padding: '0.45rem 1rem', width: '200px', fontSize: '0.85rem' }}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1.25rem 1.5rem' }}>Customer</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Amount (RWF)</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Method</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Date & Time</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? payments.map((p) => {
                const ss = statusStyle(p.status);
                return (
                  <tr key={p.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem',
                    background: p.status === 'REFUND_REQUESTED' ? 'rgba(249,115,22,0.03)' : 'transparent',
                  }}>
                    {/* Customer */}
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: '700' }}>{p.customerName || 'Walk-in'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Ref: {p.transactionReference}</div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: '900', color: 'white' }}>{(p.amount || 0).toLocaleString()}</div>
                      {p.status === 'REFUNDED' && p.refundAmount && (
                        <div style={{ fontSize: '0.7rem', color: '#818cf8', marginTop: '2px' }}>
                          Refunded: {Number(p.refundAmount).toLocaleString()} RWF
                        </div>
                      )}
                      {p.status === 'REFUND_REQUESTED' && (
                        <div style={{ fontSize: '0.7rem', color: '#f97316', marginTop: '2px' }}>
                          Will refund: {net90(p.amount || 0).toLocaleString()} RWF
                        </div>
                      )}
                    </td>

                    {/* Method */}
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '900', color: p.paymentMethod === 'MTN_MOMO' ? '#facc15' : p.paymentMethod === 'CARD' ? '#3b82f6' : '#ef4444' }}>
                          {p.paymentMethod === 'MTN_MOMO' ? 'MOMO' : p.paymentMethod === 'CARD' ? 'CARD' : 'CASH'}
                        </span>
                        <span style={{ fontSize: '0.85rem' }}>{p.paymentMethod?.replace('_', ' ') || 'UNKNOWN'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{
                        padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem',
                        background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                        fontWeight: '800', whiteSpace: 'nowrap',
                      }}>
                        {statusLabel(p.status)}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>

                        {/* APPROVE REFUND — only when customer has requested it */}
                        {p.status === 'REFUND_REQUESTED' && isAdminOrMgr && (
                          <button
                            onClick={() => openRefundModal(p)}
                            style={{
                              background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)',
                              color: '#f97316', cursor: 'pointer', padding: '0.35rem 0.75rem',
                              borderRadius: '6px', fontSize: '0.68rem', fontWeight: '900',
                              textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                              animation: 'pulse-orange 2s infinite',
                            }}
                          >
                            ✓ Approve Refund
                          </button>
                        )}

                        {/* PDF PRINT */}
                        <button
                          onClick={() => exportPDF(p)}
                          style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8', cursor: 'pointer', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Print Receipt"
                        >
                          <FileText size={12} /> PDF
                        </button>

                        {/* DELETE */}
                        {isAdminOrMgr && (
                          <button
                            onClick={() => openDeleteModal(p.id)}
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900' }}
                          >
                            DELETE
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {loading ? <span style={{ fontWeight: '900', textTransform: 'uppercase' }}>Loading records...</span> : 'No transaction records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalElements={totalElements} />

      {showBookingModal && (
        <BookingModal onClose={() => setShowBookingModal(false)} onSuccess={() => { setShowBookingModal(false); fetchPayments(); }} />
      )}

      <style>{`
        @keyframes pulse-orange {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(249,115,22,0); }
        }
      `}</style>
    </div>
  );
};

export default PaymentsList;
