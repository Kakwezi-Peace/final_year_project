import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ListOrdered, Play, CheckCircle2, Clock, Activity,
  Plus, Search, Car, Timer, Loader2, Trash2, Edit, XCircle, GripVertical
} from 'lucide-react';
import api from '../services/api';
import BookingModal from '../components/BookingModal';
import Pagination from '../components/Pagination';

const Queue = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const querySearch = new URLSearchParams(location.search).get('search') || "";

  useEffect(() => {
    fetchBookings(currentPage, querySearch);
  }, [currentPage, querySearch]);

  const fetchBookings = async (pageIdx = 0, q = "") => {
    setLoading(true);
    try {
      const qParam = q ? `?q=${encodeURIComponent(q)}&` : '?';
      const res = await api.get(`/bookings${qParam}page=${pageIdx}&size=50&sort=createdAt,desc`);
      const data = res.data;
      setBookings(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    } finally {
      setLoading(false);
    }
  };

  // Backend-driven filtering
  const filteredBookings = bookings;

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status?status=${status}`);
      fetchBookings(currentPage, querySearch);
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.error || "Unknown error"));
    }
  };
  
  const deleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking record? This cannot be undone.")) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings(currentPage, querySearch);
    } catch (err) {
      alert("Failed to delete booking: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  // Filter columns
  const waiting = filteredBookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED');
  const inProgress = filteredBookings.filter(b => b.status === 'IN_PROGRESS');
  
  const today = new Date().toISOString().split('T')[0];
  const [editingBooking, setEditingBooking] = useState(null);
  const [employees, setEmployees]           = useState([]);
  const [updating, setUpdating]             = useState(false);
  const completedToday = filteredBookings.filter(b => b.status === 'COMPLETED' && (b.completedAt?.startsWith(today) || b.createdAt?.startsWith(today)));

  useEffect(() => {
    api.get('/employees/active').then(res => setEmployees(res.data || [])).catch(() => {});
  }, []);

  const handleEdit = (booking) => {
    setEditingBooking({
      id: booking.id,
      notes: booking.notes || '',
      assignedEmployeeId: booking.assignedEmployeeId || '',
      status: booking.status,
      scheduledAt: booking.scheduledAt ? booking.scheduledAt.slice(0, 16) : ''
    });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await api.put(`/bookings/${editingBooking.id}`, {
        notes: editingBooking.notes,
        assignedEmployeeId: editingBooking.assignedEmployeeId ? parseInt(editingBooking.assignedEmployeeId) : null,
        scheduledAt: editingBooking.scheduledAt,
        status: editingBooking.status
      });
      setEditingBooking(null);
      fetchBookings(currentPage, querySearch);
    } catch (err) {
      alert("Failed to update booking.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking permanently?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings(currentPage, querySearch);
    } catch (err) {
      alert("Failed to delete booking.");
    }
  };

  /* ── DRAG AND DROP ── */
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image slightly transparent
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnName);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedItem) return;
    
    const currentStatus = draggedItem.status;

    // Don't do anything if dropping in same column
    if (targetColumn === 'WAITING' && (currentStatus === 'PENDING' || currentStatus === 'CONFIRMED')) return;
    if (targetColumn === 'IN_PROGRESS' && currentStatus === 'IN_PROGRESS') return;
    if (targetColumn === 'COMPLETED' && currentStatus === 'COMPLETED') return;

    // Build the chain of transitions needed to reach the target
    // Backend state machine: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
    const transitionChain = [];

    if (targetColumn === 'IN_PROGRESS') {
      if (currentStatus === 'PENDING') {
        transitionChain.push('CONFIRMED', 'IN_PROGRESS');
      } else if (currentStatus === 'CONFIRMED') {
        transitionChain.push('IN_PROGRESS');
      }
    } else if (targetColumn === 'COMPLETED') {
      if (currentStatus === 'PENDING') {
        transitionChain.push('CONFIRMED', 'IN_PROGRESS', 'COMPLETED');
      } else if (currentStatus === 'CONFIRMED') {
        transitionChain.push('IN_PROGRESS', 'COMPLETED');
      } else if (currentStatus === 'IN_PROGRESS') {
        transitionChain.push('COMPLETED');
      }
    }

    if (transitionChain.length === 0) return;

    // Execute each transition sequentially
    try {
      for (const status of transitionChain) {
        await api.patch(`/bookings/${draggedItem.id}/status?status=${status}`);
      }
      fetchBookings(currentPage, querySearch);
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.error || err.response?.data?.message || err.message));
    }
    setDraggedItem(null);
  };

  const columnStyle = (colName) => ({
    background: dragOverColumn === colName ? 'var(--rubis-red-subtle)' : 'var(--surface)',
    border: dragOverColumn === colName ? '2px dashed var(--rubis-red)' : '1px solid var(--border-white)',
    borderRadius: '20px',
    minHeight: '600px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', padding: '2rem' }}>
      
      {/* Edit Modal */}
      {editingBooking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={() => setEditingBooking(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
          <div className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
             <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Edit Booking Detail</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Assigned Staff</label>
                  <select className="input-field" value={editingBooking.assignedEmployeeId} onChange={e => setEditingBooking({...editingBooking, assignedEmployeeId: e.target.value})} style={{ width: '100%' }}>
                    <option value="">-- No Assignment --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
                <div>
                   <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Update Status</label>
                   <select className="input-field" value={editingBooking.status} onChange={e => setEditingBooking({...editingBooking, status: e.target.value})} style={{ width: '100%' }}>
                     {['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
                <div>
                   <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Notes</label>
                   <textarea className="input-field" rows={3} value={editingBooking.notes} onChange={e => setEditingBooking({...editingBooking, notes: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setEditingBooking(null)} className="btn btn-secondary" style={{ flex: 1 }}>Discard</button>
                  <button onClick={handleUpdate} className="btn btn-primary" style={{ flex: 2 }} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800' }}>Queue & Scheduling</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Drag and drop cards between columns to update status
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBookingModal(true)} style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: '700' }}>
          <Plus size={18} /> New Booking
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--rubis-red)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
           
           {/* ──────── WAITING COLUMN ──────── */}
           <div 
             className="glass-panel" 
             style={columnStyle('WAITING')}
             onDragOver={(e) => handleDragOver(e, 'WAITING')}
             onDragLeave={handleDragLeave}
             onDrop={(e) => handleDrop(e, 'WAITING')}
           >
             <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: '900', fontSize: '1rem', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waiting</span>
                </div>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '700' }}>{waiting.length}</span>
             </div>
             
             <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
               {waiting.map(item => (
                 <div 
                   key={item.id} 
                   draggable
                   onDragStart={(e) => handleDragStart(e, item)}
                   onDragEnd={handleDragEnd}
                   className="glass-panel card-hover" 
                   style={{ padding: '1.25rem', background: 'var(--surface-solid)', cursor: 'grab', border: '1px solid var(--border-white)' }}
                 >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ fontWeight: '800', fontSize: '0.95rem' }}>{item.guestVehiclePlate || item.vehicleLicensePlate}</h4>
                          {item.isGuest && <span style={{ fontSize: '0.6rem', background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '900', border: '1px solid rgba(168,85,247,0.3)' }}>GUEST</span>}
                       </div>
                       <span style={{ fontSize: '0.65rem', background: 'rgba(250,204,21,0.1)', color: '#facc15', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: '700' }}>{item.status}</span>
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                       <div style={{ fontWeight: '600' }}>{item.customerName}</div>
                       <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{item.serviceName}</div>
                    </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                           {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           <span style={{ marginLeft: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>{(item.totalAmount || 0).toLocaleString()} RWF</span>
                         </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                           <button onClick={() => handleEdit(item)} title="Edit" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', color: '#60a5fa', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>Edit</button>
                           <button onClick={() => updateStatus(item.id, 'CANCELLED')} title="Cancel" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', color: '#f59e0b', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>Cancel</button>
                           <button onClick={() => deleteBooking(item.id)} title="Delete" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>Del</button>
                           <button onClick={() => updateStatus(item.id, 'IN_PROGRESS')} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.65rem', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase' }}>Start</button>
                        </div>
                      </div>
                 </div>
               ))}
               {waiting.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No vehicles waiting. Drop a card here.</div>}
             </div>
           </div>

           {/* ──────── IN PROGRESS COLUMN ──────── */}
           <div 
             className="glass-panel" 
             style={columnStyle('IN_PROGRESS')}
             onDragOver={(e) => handleDragOver(e, 'IN_PROGRESS')}
             onDragLeave={handleDragLeave}
             onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
           >
             <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ padding: '0.4rem', color: '#38bdf8' }}><Activity size={16} /></div>
                 <span style={{ fontWeight: '800', fontSize: '1rem', color: '#38bdf8' }}>In Progress</span>
               </div>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '700' }}>{inProgress.length}</span>
             </div>

             <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
               {inProgress.map(item => (
                 <div 
                   key={item.id} 
                   draggable
                   onDragStart={(e) => handleDragStart(e, item)}
                   onDragEnd={handleDragEnd}
                   className="glass-panel card-hover" 
                   style={{ padding: '1.25rem', background: 'var(--surface-solid)', cursor: 'grab', border: '1px solid var(--border-white)' }}
                 >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <Car size={16} style={{ color: 'var(--rubis-red)' }} />
                          <h4 style={{ fontWeight: '800', fontSize: '0.95rem' }}>{item.guestVehiclePlate || item.vehicleLicensePlate}</h4>
                          {item.isGuest && <span style={{ fontSize: '0.6rem', background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '900', border: '1px solid rgba(168,85,247,0.3)' }}>GUEST</span>}
                       </div>
                       <span style={{ fontSize: '0.65rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: '700' }}>● Washing</span>
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', paddingLeft: '2rem' }}>
                       <div style={{ fontWeight: '600' }}>{item.customerName}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                         <Timer size={14} /> Active
                         <span style={{ marginLeft: '0.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>RWF {(item.totalAmount || 0).toLocaleString()}</span>
                       </div>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEdit(item)} title="Edit" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}><Edit size={13} /></button>
                          <button onClick={() => handleDelete(item.id)} title="Delete" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}><Trash2 size={13} /></button>
                       </div>
                    </div>
                    <button onClick={() => updateStatus(item.id, 'COMPLETED')} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.65rem', fontSize: '0.8rem', background: '#16a34a', fontWeight: '800', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                       <CheckCircle2 size={14} /> COMPLETE WASH
                    </button>
                 </div>
               ))}
               {inProgress.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active washes. Drop a card here to start.</div>}
             </div>
           </div>

           {/* ──────── COMPLETED COLUMN ──────── */}
           <div 
             className="glass-panel" 
             style={columnStyle('COMPLETED')}
             onDragOver={(e) => handleDragOver(e, 'COMPLETED')}
             onDragLeave={handleDragLeave}
             onDrop={(e) => handleDrop(e, 'COMPLETED')}
           >
             <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ padding: '0.4rem', color: '#16a34a' }}><CheckCircle2 size={16} /></div>
                 <span style={{ fontWeight: '700', fontSize: '1rem', color: '#16a34a' }}>Completed Today</span>
               </div>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '700' }}>{completedToday.length}</span>
             </div>

             <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
               {completedToday.map(item => (
                 <div key={item.id} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', opacity: 0.7 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Car size={16} style={{ color: 'var(--text-muted)' }} />
                          <h4 style={{ fontWeight: '800', fontSize: '0.95rem' }}>{item.guestVehiclePlate || item.vehicleLicensePlate}</h4>
                          {item.isGuest && <span style={{ fontSize: '0.6rem', background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '900', border: '1px solid rgba(168,85,247,0.3)' }}>GUEST</span>}
                       </div>
                       <span style={{ fontSize: '0.65rem', background: 'rgba(22,163,74,0.1)', color: '#16a34a', padding: '0.2rem 0.4rem', borderRadius: '4px', fontWeight: '700' }}>● Done</span>
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                       <div style={{ fontWeight: '600' }}>{item.customerName}</div>
                       <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{item.serviceName}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', opacity: 0.8 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                         <Clock size={14} /> Finished
                         <span style={{ marginLeft: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>RWF {(item.totalAmount || 0).toLocaleString()}</span>
                       </div>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEdit(item)} title="Edit" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}><Edit size={13} /></button>
                          <button onClick={() => handleDelete(item.id)} title="Delete" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}><Trash2 size={13} /></button>
                       </div>
                    </div>
                 </div>
               ))}
               {completedToday.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No washes completed today. Drop a card here to complete.</div>}
             </div>
           </div>
        </div>
      )}

      {showBookingModal && (
        <BookingModal 
          onClose={() => setShowBookingModal(false)} 
          onSuccess={() => {
            setShowBookingModal(false);
            fetchBookings(currentPage, querySearch);
          }} 
        />
      )}

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalElements={totalElements}
      />
    </div>
  );
};

export default Queue;
