import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EmployeeModal from '../components/EmployeeModal';
import Pagination from '../components/Pagination';
import { useSearch } from '../context/SearchContext';

const Employees = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [currentPage]);

  const fetchEmployees = async (pageIdx = 0) => {
    setLoading(true);
    try {
      const res = await api.get(`/employees?page=${pageIdx}&size=10`);
      if (res.data.content) {
        setEmployees(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      } else {
        setEmployees(res.data || []);
      }
    } catch (err) {
      setError("Failed to load employees. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action is permanent.")) return;
    try {
      await api.delete(`/employees/${id}`);
      setEmployees(prev => prev.filter(e => e.id !== id));
      setSuccess("Employee record deleted.");
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError("Failed to delete record.");
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '0.4rem' }}>Team Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Onboard staff and manage their access privileges.</p>
        </div>
        <button 
          onClick={() => { setSelectedEmployee(null); setShowModal(true); }}
          className="btn-primary" 
          style={{ padding: '0.8rem 1.5rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Staff Onboarding
        </button>
      </div>

      {success && (
        <div className="animate-slide-up" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{success}</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{error}</span>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="SEARCH STAFF RECORDS..." 
              className="input-field"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '1.5rem' }}
            />
          </div>
          <button className="btn-secondary" style={{ fontWeight: '800', fontSize: '0.75rem' }}>
            FILTER
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <span style={{ fontWeight: '900', color: 'var(--rubis-red)', textTransform: 'uppercase' }}>LOADING STAFF DATA...</span>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem', fontWeight: '700', textTransform: 'uppercase' }}>Employee</th>
                  <th style={{ padding: '1rem', fontWeight: '700', textTransform: 'uppercase' }}>Position</th>
                  <th style={{ padding: '1rem', fontWeight: '700', textTransform: 'uppercase' }}>Contact</th>
                  <th style={{ padding: '1rem', fontWeight: '700', textTransform: 'uppercase' }}>Status Since</th>
                  <th style={{ padding: '1rem', fontWeight: '700', textTransform: 'uppercase' }}>Expected Back</th>
                  <th style={{ padding: '1rem', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: '700', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--rubis-red)'
                        }}>
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700' }}>{emp.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.nationalId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{emp.position}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>MAIL:</span> {emp.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>TEL:</span> {emp.phone}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {(emp.statusChangedAt || emp.hireDate) ? new Date(emp.statusChangedAt || emp.hireDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem' }}>
                      {emp.active ? (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>—</span>
                      ) : emp.expectedReturnDate ? (
                        <span style={{
                          fontWeight: '700',
                          color: new Date(emp.expectedReturnDate) < new Date() ? '#f87171' : '#fbbf24'
                        }}>
                          {new Date(emp.expectedReturnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Not set</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
                        background: emp.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: emp.active ? '#4ade80' : '#f87171',
                        border: `1px solid ${emp.active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                      }}>
                        {emp.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => { setSelectedEmployee(emp); setShowModal(true); }}
                          style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', color: '#60a5fa', cursor: 'pointer', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900' }}
                        >
                          EDIT
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)}
                          style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900' }}
                        >
                          DEL
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>No employees found</h3>
            <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or onboarding a new member.</p>
          </div>
        )}
      </div>

      {/* Pagination component */}
      {!loading && !searchQuery ? (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalElements={totalElements}
        />
      ) : searchQuery && filteredEmployees.length > 0 && (
         <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
           Found {filteredEmployees.length} matching employees
         </div>
      )}

      {showModal && (
        <EmployeeModal 
          editData={selectedEmployee}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchEmployees();
            setSuccess(selectedEmployee ? "Profile updated!" : "Employee onboarded successfully!");
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}
    </div>
  );
};

export default Employees;
