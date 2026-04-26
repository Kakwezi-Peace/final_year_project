import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Search, UserPlus, Phone, Car,
  Trash2, Edit2, MoreVertical, LayoutGrid,
  Table, Filter, Mail, MapPin, X, Loader2,
  AlertCircle, CheckCircle2, FileDown, FileText, UserCheck, UserX,
  ChevronDown, UserPlus2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { useSearch } from '../context/SearchContext';

const TH_STYLE = { padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' };

const CustomersList = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const [customers, setCustomers]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showModal, setShowModal]             = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [modalLoading, setModalLoading]       = useState(false);
  const [excelLoading, setExcelLoading]       = useState(false);
  const [customerPdfId, setCustomerPdfId]     = useState(null);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const [bookingsMap, setBookingsMap]         = useState({});
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [userRole, setUserRole]               = useState(null);
  const [assignDropdownId, setAssignDropdownId] = useState(null); // customerId whose dropdown is open
  const [assigningId, setAssigningId]           = useState(null); // customerId being assigned
  const [dropdownPos, setDropdownPos]           = useState({ top: 0, left: 0 });

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', nationalId: ''
  });

  const [currentPage, setCurrentPage]   = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchCustomers(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  // Fetch bookings + active employees + user role in parallel
  useEffect(() => {
    (async () => {
      try {
        const [bookingsRes, empRes, meRes] = await Promise.all([
          api.get('/bookings?page=0&size=2000&sort=createdAt,desc'),
          api.get('/employees/active'),
          api.get('/auth/me'),
        ]);

        const bookings = bookingsRes.data.content || bookingsRes.data || [];
        const map = {};
        bookings.forEach(b => {
          const cid = b.customerId;
          if (!cid) return;
          if (!map[cid]) map[cid] = { lastEmployee: null, bookings: [] };
          map[cid].bookings.push(b);
          if (!map[cid].lastEmployee && b.assignedEmployeeName)
            map[cid].lastEmployee = b.assignedEmployeeName;
        });
        setBookingsMap(map);
        setActiveEmployees(empRes.data || []);
        setUserRole(meRes.data?.role);
      } catch {
        // non-blocking
      }
    })();
  }, []);

  const fetchCustomers = async (pageIdx = 0, query = '') => {
    setLoading(true);
    try {
      const endpoint = query
        ? `/customers?q=${query}&page=${pageIdx}&size=10&sort=registeredAt,desc`
        : `/customers?page=${pageIdx}&size=10&sort=registeredAt,desc`;
      const res = await api.get(endpoint);
      setCustomers(res.data.content || res.data || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      setError('Could not load customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => { setSearchQuery(e.target.value); setCurrentPage(0); };

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', address: '', nationalId: '' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      firstName: customer.firstName || '', lastName: customer.lastName || '',
      email: customer.email || '', phone: customer.phone || '',
      address: customer.address || '', nationalId: customer.nationalId || ''
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      setSuccess('Customer deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to delete customer.'); }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError('');
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, form);
        setSuccess('Customer updated successfully!');
      } else {
        await api.post('/customers', form);
        setSuccess('Customer registered successfully!');
      }
      setShowModal(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Check your input.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleInputChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  /* ── Staff assignment ─────────────────────────────────────────────────────── */
  // Returns most recent assignable booking:
  // Priority 1 — active (PENDING / CONFIRMED / IN_PROGRESS)
  // Priority 2 — most recent non-CANCELLED (allows re-assigning COMPLETED bookings)
  const getActiveBooking = (customerId) => {
    const list = bookingsMap[customerId]?.bookings || [];
    return (
      list.find(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)) ||
      list.find(b => b.status !== 'CANCELLED')
    );
  };

  const unassignEmployee = async (bookingId, customerId) => {
    setAssigningId(customerId);
    try {
      await api.delete(`/bookings/${bookingId}/assign-employee`);
      setBookingsMap(prev => {
        const entry = prev[customerId];
        if (!entry) return prev;
        return {
          ...prev,
          [customerId]: {
            lastEmployee: entry.lastEmployee,
            bookings: entry.bookings.map(b =>
              b.id === bookingId ? { ...b, assignedEmployeeId: null, assignedEmployeeName: null } : b
            ),
          },
        };
      });
      setAssignDropdownId(null);
      setSuccess('Staff member unassigned successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to unassign: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigningId(null);
    }
  };

  const assignEmployee = async (bookingId, employeeId, customerId) => {
    setAssigningId(customerId);
    try {
      await api.patch(`/bookings/${bookingId}/assign-employee/${employeeId}`);
      const emp = activeEmployees.find(e => e.id === employeeId);
      const empName = emp?.fullName || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim();
      setBookingsMap(prev => {
        const entry = prev[customerId];
        if (!entry) return prev;
        return {
          ...prev,
          [customerId]: {
            lastEmployee: empName,
            bookings: entry.bookings.map(b =>
              b.id === bookingId
                ? { ...b, assignedEmployeeId: employeeId, assignedEmployeeName: empName }
                : b
            ),
          },
        };
      });
      setAssignDropdownId(null);
      setSuccess(`${empName} assigned successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign staff: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigningId(null);
    }
  };

  /* ── Excel: download all customers ───────────────────────────────────────── */
  const downloadExcel = async () => {
    setExcelLoading(true);
    try {
      const res = await api.get('/customers?page=0&size=10000&sort=registeredAt,desc');
      const all = res.data.content || res.data || [];
      const dateStr = new Date().toISOString().split('T')[0];

      const rows = [
        ['RUBIS Car Wash — Customer Report', '', '', '', '', '', '', ''],
        [`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          '', '', '', '', `Total: ${all.length} customers`, '', ''],
        [],
        ['#', 'Full Name', 'Email', 'Phone', 'Vehicle Plate', 'Vehicle Type', 'Last Washed By', 'Registered'],
        ...all.map((c, i) => [
          i + 1,
          c.fullName || '—',
          c.email || '—',
          c.phone || '—',
          c.primaryVehiclePlate || '—',
          c.primaryVehicleType || '—',
          bookingsMap[c.id]?.lastEmployee || '—',
          c.registeredAt ? new Date(c.registeredAt).toLocaleDateString() : '—',
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      XLSX.writeFile(wb, `rubis-customers-${dateStr}.xlsx`);
    } catch {
      setError('Failed to generate Excel. Please try again.');
    } finally {
      setExcelLoading(false);
    }
  };

  /* ── PDF: single customer detail sheet ───────────────────────────────────── */
  const downloadCustomerPDF = async (customer) => {
    setCustomerPdfId(customer.id);
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.width;
      const bookings = bookingsMap[customer.id]?.bookings || [];

      // Red header
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageW, 36, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RUBIS Car Wash', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Profile Report', 14, 25);
      doc.setFontSize(8);
      doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - 14, 20, { align: 'right' });

      // Avatar circle
      doc.setFillColor(245, 245, 250);
      doc.circle(25, 58, 12, 'F');
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text((customer.fullName?.[0] || '?').toUpperCase(), 25, 62, { align: 'center' });

      // Customer name + email
      doc.setTextColor(20, 20, 35);
      doc.setFontSize(15);
      doc.text(customer.fullName || '—', 42, 55);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 140);
      doc.text(customer.email || '—', 42, 63);

      // Divider
      doc.setDrawColor(230, 230, 240);
      doc.line(14, 74, pageW - 14, 74);

      // Details grid
      const details = [
        ['Phone', customer.phone || '—'],
        ['Vehicle Plate', customer.primaryVehiclePlate || '—'],
        ['Vehicle Type', customer.primaryVehicleType || '—'],
        ['Last Washed By', bookingsMap[customer.id]?.lastEmployee || '—'],
        ['Registered', customer.registeredAt ? new Date(customer.registeredAt).toLocaleDateString() : '—'],
      ];
      let y = 84;
      details.forEach(([label, value]) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 140, 160);
        doc.text(label.toUpperCase(), 14, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 35);
        doc.text(value, 70, y);
        y += 10;
      });

      // Booking history table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 35);
      doc.text('Booking History', 14, y + 8);

      if (bookings.length > 0) {
        autoTable(doc, {
          startY: y + 14,
          head: [['Ref', 'Service', 'Date', 'Washed By', 'Status', 'Amount (RWF)']],
          body: bookings.slice(0, 20).map(b => [
            b.bookingReference || '—',
            b.serviceName || '—',
            b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : '—',
            b.assignedEmployeeName || '—',
            b.status || '—',
            b.totalAmount ? Number(b.totalAmount).toLocaleString() : '—',
          ]),
          headStyles: { fillColor: [30, 30, 50], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 250] },
          styles: { fontSize: 7.5, cellPadding: 4, textColor: [20, 20, 35] },
        });
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 160);
        doc.text('No booking history found.', 14, y + 16);
      }

      // Page footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(180, 180, 190);
        doc.text(`Page ${i} of ${pageCount}  •  RUBIS Car Wash`, pageW / 2, doc.internal.pageSize.height - 8, { align: 'center' });
      }

      const safeName = (customer.fullName || 'customer').replace(/\s+/g, '-').toLowerCase();
      doc.save(`rubis-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch {
      setError('Failed to generate customer PDF.');
    } finally {
      setCustomerPdfId(null);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', padding: '1rem 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.15rem' }}>Customers & Vehicles</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Manage customer information and vehicle records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={downloadExcel}
            disabled={excelLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: '800',
              fontSize: '0.75rem', cursor: excelLoading ? 'default' : 'pointer',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981', opacity: excelLoading ? 0.6 : 1,
            }}
          >
            {excelLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
            {excelLoading ? 'Generating…' : 'Export Excel'}
          </button>
          <button className="btn btn-primary" onClick={openAddModal} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '900', fontSize: '0.82rem' }}>
            + ADD CUSTOMER
          </button>
        </div>
      </div>

      {/* Pending deletion requests banner */}
      {(() => {
        const pending = customers.filter(c => c.deletionRequested);
        if (!pending.length) return null;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderLeft: '4px solid #ef4444', borderRadius: '10px',
            padding: '1rem 1.25rem', marginBottom: '1.5rem',
          }}>
            <UserX size={18} color="#f87171" />
            <div>
              <span style={{ fontWeight: '800', color: '#f87171', fontSize: '0.92rem' }}>
                {pending.length} pending deletion {pending.length === 1 ? 'request' : 'requests'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                — {pending.map(c => c.fullName).join(', ')}
              </span>
            </div>
          </div>
        );
      })()}

      {success && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="SEARCH DATABASE..."
            className="input-field"
            style={{ paddingLeft: '1.5rem', padding: '0.6rem 1rem 0.6rem 1.5rem' }}
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <button className="btn btn-secondary" style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800' }}>
          FILTERS
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: '900', textTransform: 'uppercase' }}>Loading database...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ ...TH_STYLE, width: '42px' }}>#</th>
                  <th style={TH_STYLE}>Customer Name</th>
                  <th style={TH_STYLE}>Phone</th>
                  <th style={TH_STYLE}>Vehicle Plate</th>
                  <th style={TH_STYLE}>Vehicle Type</th>
                  <th style={TH_STYLE}>Booking Dates</th>
                  <th style={TH_STYLE}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserCheck size={13} /> Assigned Staff
                    </div>
                  </th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? customers.map((customer, idx) => {
                  const activeBooking  = getActiveBooking(customer.id);
                  const assignedName   = activeBooking?.assignedEmployeeName || null;
                  const lastEmployee   = bookingsMap[customer.id]?.lastEmployee;
                  const canAssign      = userRole === 'ADMIN' || userRole === 'MANAGER';
                  const isAssigning    = assigningId === customer.id;
                  const dropdownOpen   = assignDropdownId === customer.id;

                  return (
                    <tr key={customer.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s ease' }} className="card-hover">
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.78rem' }}>
                        {currentPage * 10 + idx + 1}
                      </td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(227,6,19,0.08)', color: 'var(--rubis-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0, fontSize: '0.8rem' }}>
                            {customer.fullName ? customer.fullName[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{customer.fullName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.7rem 1rem', fontSize: '0.95rem' }}>{customer.phone || 'N/A'}</td>
                      <td style={{ padding: '0.7rem 1rem', fontWeight: '900', color: 'var(--rubis-red)', fontSize: '0.95rem' }}>
                        {customer.primaryVehiclePlate || 'No Vehicle'}
                      </td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', fontWeight: '700' }}>
                          {customer.primaryVehicleType || 'N/A'}
                        </span>
                      </td>

                      {/* ── Booking Dates cell ───────────────────────────── */}
                      {(() => {
                        const lb = getActiveBooking(customer.id) || (bookingsMap[customer.id]?.bookings || [])[0];
                        if (!lb) return (
                          <td style={{ padding: '0.7rem 1rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No bookings</span>
                          </td>
                        );
                        return (
                          <td style={{ padding: '0.7rem 1rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {lb.scheduledAt ? new Date(lb.scheduledAt).toLocaleDateString() : '—'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {lb.scheduledAt ? new Date(lb.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                            {lb.completedAt ? (
                              <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: '3px', fontWeight: '700' }}>
                                ✓ {new Date(lb.completedAt).toLocaleDateString()}
                              </div>
                            ) : lb.status && lb.status !== 'CANCELLED' ? (
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {lb.status.replace('_', ' ')}
                              </div>
                            ) : null}
                          </td>
                        );
                      })()}

                      {/* ── Assigned Staff cell ───────────────────────────── */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {(() => {
                          const isActiveBkg  = activeBooking && ['PENDING','CONFIRMED','IN_PROGRESS'].includes(activeBooking.status);
                          const noBookings   = !activeBooking;

                          // Accent colours based on state
                          const btnBg     = !activeBooking ? 'rgba(107,114,128,0.08)'
                                          : !assignedName  ? 'rgba(245,158,11,0.12)'
                                          : 'rgba(99,102,241,0.12)';
                          const btnBorder = !activeBooking ? 'rgba(107,114,128,0.2)'
                                          : !assignedName  ? 'rgba(245,158,11,0.35)'
                                          : 'rgba(99,102,241,0.3)';
                          const btnColor  = !activeBooking ? '#6b7280'
                                          : !assignedName  ? '#fbbf24'
                                          : '#818cf8';
                          const btnLabel  = isAssigning    ? 'Assigning…'
                                          : noBookings     ? 'No bookings'
                                          : !assignedName  ? '+ Assign Staff'
                                          : '↺ Reassign';

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                              {/* ── Current assignment display ─────────────── */}
                              {assignedName ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '900', flexShrink: 0 }}>
                                    {assignedName[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>{assignedName}</div>
                                    {activeBooking?.status && (
                                      <span style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        color: isActiveBkg ? '#818cf8' : 'var(--text-muted)',
                                        background: isActiveBkg ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)',
                                        padding: '1px 6px', borderRadius: '8px' }}>
                                        {activeBooking.status.replace('_',' ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : activeBooking ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: '700' }}>
                                    Unassigned{isActiveBkg ? ' — needs staff' : ''}
                                  </span>
                                </div>
                              ) : lastEmployee ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(148,163,184,0.08)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '800' }}>
                                    {lastEmployee[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{lastEmployee}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.55 }}>last wash</div>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not assigned yet</span>
                              )}

                              {/* ── Assign / Reassign button (ADMIN & MANAGER) ── */}
                              {canAssign && (
                                <div style={{ position: 'relative' }}>
                                  <button
                                    onClick={(e) => {
                                      if (noBookings) return;
                                      if (dropdownOpen) { setAssignDropdownId(null); return; }
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownPos({
                                        top: rect.bottom + 6,
                                        left: Math.min(rect.left, window.innerWidth - 260),
                                      });
                                      setAssignDropdownId(customer.id);
                                    }}
                                    disabled={isAssigning || noBookings}
                                    title={noBookings ? 'No bookings found for this customer' : assignedName ? 'Change assigned staff' : 'Assign a staff member'}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                                      padding: '5px 11px', borderRadius: '7px',
                                      fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.02em',
                                      cursor: isAssigning || noBookings ? 'default' : 'pointer',
                                      background: btnBg, border: `1px solid ${btnBorder}`,
                                      color: btnColor, opacity: noBookings ? 0.4 : 1,
                                      transition: 'opacity 0.15s, background 0.15s',
                                    }}
                                  >
                                    {isAssigning
                                      ? <Loader2 size={12} className="animate-spin" />
                                      : <UserPlus2 size={12} />
                                    }
                                    {btnLabel}
                                    {!isAssigning && !noBookings && <ChevronDown size={11} />}
                                  </button>

                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '0.7rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => downloadCustomerPDF(customer)}
                            disabled={customerPdfId === customer.id}
                            title="Download customer PDF"
                            style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {customerPdfId === customer.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <FileText size={15} />
                            }
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            title="Edit Customer"
                            style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (!customer.deletionRequested) {
                                alert('This customer has not submitted a deletion request. Ask them to request deletion from their dashboard first.');
                                return;
                              }
                              handleDelete(customer.id);
                            }}
                            title={customer.deletionRequested ? 'Approve deletion request' : 'Customer has not requested deletion yet'}
                            style={{
                              color: customer.deletionRequested ? '#f87171' : '#6b7280',
                              background: customer.deletionRequested ? 'rgba(248,113,113,0.1)' : 'rgba(107,114,128,0.08)',
                              border: `1px solid ${customer.deletionRequested ? 'rgba(248,113,113,0.2)' : 'rgba(107,114,128,0.15)'}`,
                              borderRadius: '6px', cursor: 'pointer', padding: '6px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: customer.deletionRequested ? 1 : 0.4,
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {customer.deletionRequested && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase',
                              color: '#f87171', background: 'rgba(239,68,68,0.12)',
                              border: '1px solid rgba(239,68,68,0.3)', padding: '2px 7px', borderRadius: '20px',
                            }}>
                              <UserX size={10} /> Deletion Requested
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No customers found. Click "Add Customer" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalElements={totalElements}
      />

      {/* Portal: employee dropdown — rendered at body to escape overflow:hidden stacking context */}
      {assignDropdownId && (() => {
        const pc = customers.find(c => c.id === assignDropdownId);
        if (!pc) return null;
        const pb = getActiveBooking(pc.id);
        if (!pb) return null;
        const pbActive = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(pb.status);
        return createPortal(
          <>
            <div onClick={() => setAssignDropdownId(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
            <div style={{
              position: 'fixed', top: dropdownPos.top, left: dropdownPos.left,
              zIndex: 9999, minWidth: '240px', maxWidth: '300px',
              background: '#14142a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(148,163,184,0.7)' }}>
                  Active Staff
                </span>
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
                  onClick={() => unassignEmployee(pb.id, pc.id)}
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
                  <div style={{ padding: '16px', fontSize: '0.82rem', color: 'rgba(148,163,184,0.6)', textAlign: 'center' }}>
                    No active staff available.<br />
                    <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>Activate staff from the Employees page.</span>
                  </div>
                ) : activeEmployees.map(emp => {
                  const name = emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '?';
                  const isCurrent = pb.assignedEmployeeId === emp.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => assignEmployee(pb.id, emp.id, pc.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px',
                        background: isCurrent ? 'rgba(99,102,241,0.15)' : 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer', textAlign: 'left', color: '#e2e8f0',
                        transition: 'background 0.12s',
                      }}
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
                          {isCurrent && (
                            <span style={{ fontSize: '0.58rem', color: '#818cf8', background: 'rgba(99,102,241,0.2)', padding: '1px 6px', borderRadius: '8px', fontWeight: '800' }}>
                              assigned
                            </span>
                          )}
                        </div>
                        {emp.position && (
                          <div style={{ fontSize: '0.68rem', color: 'rgba(148,163,184,0.6)', marginTop: '2px' }}>{emp.position}</div>
                        )}
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
          <div className="glass-panel animate-scale-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'var(--rubis-red)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontWeight: '900', textTransform: 'uppercase', fontSize: '1rem' }}>
                {editingCustomer ? 'Update Profile' : 'New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.6rem', fontWeight: '900', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>CLOSE</button>
            </div>

            <form onSubmit={handleModalSubmit} style={{ padding: '1.75rem' }}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">First Name *</label>
                  <input type="text" name="firstName" className="input-field" value={form.firstName} onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Last Name *</label>
                  <input type="text" name="lastName" className="input-field" value={form.lastName} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <input type="email" name="email" className="input-field" value={form.email} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number *</label>
                <input type="text" name="phone" className="input-field" placeholder="e.g. 0788…" value={form.phone} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Address</label>
                <input type="text" name="address" className="input-field" value={form.address} onChange={handleInputChange} />
              </div>
              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label className="input-label">National ID</label>
                <input type="text" name="nationalId" className="input-field" value={form.nationalId} onChange={handleInputChange} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={modalLoading}>
                  {modalLoading ? <Loader2 className="animate-spin" size={18} /> : (editingCustomer ? 'Update Profile' : 'Register Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersList;
