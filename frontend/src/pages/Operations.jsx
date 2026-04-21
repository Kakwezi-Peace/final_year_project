import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, Users, CheckCircle2, 
  Car, User, Loader2, Edit3, XCircle, DollarSign, 
  ListOrdered, Play, Trash2, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import Pagination from '../components/Pagination';

const Operations = () => {
  const [activeWashes, setActiveWashes] = useState([]);
  const [completedWashes, setCompletedWashes] = useState([]);
  const [queuedBookings, setQueuedBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Queue state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchOperations(currentPage);
    const interval = setInterval(() => fetchOperations(currentPage), 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const fetchOperations = async (pageIdx = 0) => {
    try {
      const [activeRes, completedRes, queueRes, statsRes, empRes] = await Promise.all([
        api.get('/bookings/status/IN_PROGRESS'),
        api.get('/bookings/status/COMPLETED'),
        api.get(`/bookings?page=${pageIdx}&size=50`),
        api.get('/reports/dashboard'),
        api.get('/employees/active').catch(() => ({ data: [] }))
      ]);

      setActiveWashes(activeRes.data || []);
      setCompletedWashes(completedRes.data || []);
      
      // The queue request returns Page object
      const qPage = queueRes.data;
      setQueuedBookings(qPage.content || []);
      setTotalPages(qPage.totalPages || 0);
      setTotalElements(qPage.totalElements || 0);

      setStats(statsRes.data);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error("Failed to fetch operations", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status?status=${status}`);
      fetchOperations();
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.error || err.message));
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this wash job?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      fetchOperations();
    } catch (err) {
      alert("Cancel failed: " + (err.response?.data?.error || err.message));
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const completedToday = completedWashes.filter(b => 
    b.completedAt?.startsWith(today) || b.createdAt?.startsWith(today)
  );

  const pendingWashes = queuedBookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED');

  // Calculate elapsed minutes for active washes
  const getElapsedMinutes = (startedAt) => {
    if (!startedAt) return 0;
    const start = new Date(startedAt);
    const now = new Date();
    return Math.max(0, Math.round((now - start) / 60000));
  };

  // Estimate progress based on elapsed time vs typical 30min wash
  const getProgress = (startedAt) => {
    const elapsed = getElapsedMinutes(startedAt);
    return Math.min(95, Math.round((elapsed / 30) * 100));
  };

  // Calculate today's revenue from completed bookings
  const todayRevenue = completedToday.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', padding: '1rem 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800' }}>Operations View</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Real-time car wash operations monitoring
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <button 
             onClick={fetchOperations}
             style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}
           >
             REFRESH
           </button>
           <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', alignItems: 'center' }}>
              <span style={{ color: '#4ade80', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>LIVE DATA</span>
           </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--rubis-red)" />
        </div>
      ) : (
        <>
          {/* Operational Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            
            {/* Active Washes */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--surface)', borderLeft: '6px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats?.inProgressBookings ?? activeWashes.length}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginTop: '0.25rem' }}>Active Washes</div>
                 </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIVE</div>
              </div>
            </div>

            {/* Completed Today */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--surface)', borderLeft: '6px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <div style={{ fontSize: '2rem', fontWeight: '800' }}>{completedToday.length}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginTop: '0.25rem' }}>Completed Today</div>
                 </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DONE</div>
              </div>
            </div>

            {/* Pending Queue */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--surface)', borderLeft: '6px solid #d97706' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats?.pendingBookings ?? pendingWashes.length}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginTop: '0.25rem' }}>Pending Queue</div>
                 </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QUEUE</div>
              </div>
            </div>

            {/* Today's Revenue */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--surface)', borderLeft: '6px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <div style={{ fontSize: '2rem', fontWeight: '800' }}>{(stats?.todayRevenue || todayRevenue).toLocaleString()}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginTop: '0.25rem' }}>Today Revenue (RWF)</div>
                 </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RWF</div>
              </div>
            </div>

            {/* Staff On Duty */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '6px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                   <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stats?.totalEmployees ?? employees.length}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginTop: '0.25rem' }}>Staff On Duty</div>
                 </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STAFF</div>
              </div>
            </div>
          </div>

          {/* Main Content: Active + Completed */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            
            {/* Active Washes Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', background: '#2563eb', borderRadius: '50%' }}></div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Active Washes</h3>
                 </div>
                 <span style={{ fontSize: '0.75rem', background: 'rgba(37,99,235,0.15)', color: '#60a5fa', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '700' }}>{activeWashes.length} active</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeWashes.map(wash => {
                  const elapsed = getElapsedMinutes(wash.startedAt || wash.createdAt);
                  const progress = getProgress(wash.startedAt || wash.createdAt);
                  
                  return (
                    <div key={wash.id} style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
                      {/* Action Buttons */}
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.4rem' }}>
                         <button 
                           onClick={() => cancelBooking(wash.id)}
                           title="Cancel Job"
                           style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', cursor: 'pointer', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}
                         >
                            <XCircle size={13} />
                         </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <div style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '0.8rem', borderRadius: '10px' }}>
                             <Car size={24} />
                           </div>
                           <div style={{ maxWidth: '60%' }}>
                             <h4 style={{ fontSize: '1rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wash.vehicleLicensePlate}</h4>
                             <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wash.serviceName}</span>
                           </div>
                         </div>
                         <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.6rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', borderRadius: '50px', whiteSpace: 'nowrap', marginRight: '2rem' }}>
                           ● Active
                         </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{ marginTop: '1.25rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                           <span style={{ color: 'var(--text-muted)' }}>Progress · {elapsed} min elapsed</span>
                           <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{progress}%</span>
                         </div>
                         <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: progress > 80 ? '#16a34a' : 'var(--rubis-red)', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
                         </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <User size={14} /> <span style={{ color: 'var(--text-primary)' }}>{wash.assignedEmployeeName || 'Team Rubis'}</span>
                         </div>
                         <button 
                           onClick={() => updateStatus(wash.id, 'COMPLETED')}
                           className="btn btn-primary" 
                           style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem', background: '#16a34a', fontWeight: '800', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                         >
                           <CheckCircle2 size={12} /> COMPLETE
                         </button>
                      </div>
                   </div>
                  );
                })}
                {activeWashes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                    <Activity size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.9rem' }}>No active wash sessions</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Completed Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '50%' }}></div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recently Completed</h3>
                 </div>
                 <span style={{ fontSize: '0.75rem', background: 'rgba(22,163,74,0.15)', color: '#4ade80', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '700' }}>{completedToday.length} today</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {completedToday.length > 0 ? completedToday.slice(0, 8).map(wash => {
                  const completedTime = wash.completedAt 
                    ? new Date(wash.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(wash.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  // Calculate duration if both startedAt and completedAt are available
                  let duration = wash.durationMinutes || '--';
                  if (wash.startedAt && wash.completedAt) {
                    const start = new Date(wash.startedAt);
                    const end = new Date(wash.completedAt);
                    duration = Math.round((end - start) / 60000);
                  }

                  return (
                    <div key={wash.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.1)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ color: '#16a34a' }}><CheckCircle2 size={20} /></div>
                         <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{wash.vehicleLicensePlate}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wash.serviceName} · {wash.customerName || 'Customer'}</div>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{duration} min</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>at {completedTime}</div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                    <CheckCircle2 size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.9rem' }}>No completed washes today</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Staff Performance Section */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '50%' }}></div>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Staff On Duty</h3>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '700' }}>{employees.length} on duty</span>
                 <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Auto-refresh: 30s</span>
               </div>
             </div>
             <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Staff Name</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Role / Contact</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Status</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Active Assignment</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Completed Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length > 0 ? employees.map(emp => {
                       const empName = emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                       const initials = (empName || 'S').split(' ').map(n => n[0]).join('').toUpperCase();
                       const activeWash = activeWashes.find(b => b.assignedEmployeeId === emp.id);
                       const empCompleted = completedWashes.filter(b => b.assignedEmployeeId === emp.id).length;
                       const isBusy = !!activeWash;

                      return (
                        <tr key={emp.id} style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          background: isBusy ? 'rgba(59,130,246,0.03)' : 'transparent'
                        }}>
                           <td style={{ padding: '1rem' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ 
                                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                  background: isBusy ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                  fontWeight: '800', color: isBusy ? '#60a5fa' : 'var(--rubis-red)', fontSize: '0.85rem'
                                }}>
                                   {initials}
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{empName}</div>
                             </div>
                           </td>
                           <td style={{ padding: '1rem' }}>
                             <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{emp.position || 'Washer'}</div>
                             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.phone || '—'}</div>
                           </td>
                           <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                fontSize: '0.65rem', padding: '0.3rem 0.6rem', 
                                background: isBusy ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)', 
                                color: isBusy ? '#60a5fa' : '#4ade80', 
                                borderRadius: '4px', fontWeight: '800', display: 'inline-block' 
                              }}>
                                {isBusy ? '● WASHING' : '● IDLE'}
                              </span>
                           </td>
                           <td style={{ padding: '1rem' }}>
                              {isBusy ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', fontSize: '0.8rem' }}>
                                  <Car size={13} />
                                  <span style={{ fontWeight: '800' }}>{activeWash.vehicleLicensePlate}</span>
                                  <span style={{ opacity: 0.7 }}>· {activeWash.serviceName}</span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>None</span>
                              )}
                           </td>
                           <td style={{ padding: '1rem', fontWeight: '800', color: empCompleted > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                             {empCompleted} <span style={{ fontSize:'0.7rem', fontWeight:'normal', opacity:0.7 }}>washes</span>
                           </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <Users size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
                          <div style={{ fontSize: '0.9rem' }}>No active employees found. Add employees in your admin panel.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
             </div>
          </div>
        </>
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

export default Operations;
