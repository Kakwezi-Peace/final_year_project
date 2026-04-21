import React, { useState, useEffect } from 'react';
import { 
  Users, Search, UserPlus, Phone, Car, 
  Trash2, Edit2, MoreVertical, LayoutGrid, 
  Table, Filter, Mail, MapPin, X, Loader2,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { useSearch } from '../context/SearchContext';

const CustomersList = () => {
  const { searchQuery, setSearchQuery } = useSearch();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    nationalId: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchCustomers(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const fetchCustomers = async (pageIdx = 0, query = '') => {
    setLoading(true);
    try {
      const endpoint = query 
        ? `/customers?q=${query}&page=${pageIdx}&size=10`
        : `/customers?page=${pageIdx}&size=10`;
      
      const res = await api.get(endpoint);
      // Backend returns Page object
      setCustomers(res.data.content || res.data || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch customers", err);
      setError("Could not load customers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setCurrentPage(0); // Reset to first page on search
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', address: '', nationalId: '' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      nationalId: customer.nationalId || ''
    });
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      setSuccess("Customer deleted successfully!");
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError("Failed to delete customer.");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError('');
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, form);
        setSuccess("Customer updated successfully!");
      } else {
        await api.post('/customers', form);
        setSuccess("Customer registered successfully!");
      }
      setShowModal(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed. Check your input.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', padding: '1rem 0' }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800' }}>Customers & Vehicles</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Manage customer information and vehicle records
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '900' }}>
          + ADD CUSTOMER
        </button>
      </div>

      {success && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           {success}
        </div>
      )}

      {/* Control Bar */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
         <div style={{ position: 'relative', flex: 1 }}>
           <input 
             type="text" 
             placeholder="SEARCH DATABASE..." 
             className="input-field"
             style={{ paddingLeft: '1.5rem' }}
             value={searchQuery}
             onChange={handleSearch}
           />
         </div>
         <button className="btn btn-secondary" style={{ padding: '0.8rem 1.25rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>
           FILTERS
         </button>
      </div>

      {/* Customer Grid */}
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
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Customer Name</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Phone</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Vehicle Plate</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Vehicle Type</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? customers.map(customer => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s ease' }} className="card-hover">
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(227,6,19,0.08)', color: 'var(--rubis-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                            {customer.fullName ? customer.fullName[0] : '?'}
                         </div>
                         <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem' }}>{customer.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{customer.email}</div>
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                         {customer.phone || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '900', color: 'var(--rubis-red)', fontSize: '0.95rem' }}>
                         {customer.primaryVehiclePlate || 'No Vehicle'}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                       <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border-white)', color: 'var(--text-muted)', fontWeight: '700' }}>
                         {customer.primaryVehicleType || 'N/A'}
                       </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                         <button 
                          onClick={() => openEditModal(customer)} 
                          title="Edit Customer"
                          style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                         >
                            <Edit2 size={15} />
                         </button>
                         <button 
                          onClick={() => handleDelete(customer.id)} 
                          title="Delete Customer"
                          style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                         >
                            <Trash2 size={15} />
                         </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
          <div className="glass-panel animate-scale-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ background: 'var(--rubis-red)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', fontWeight: '900', textTransform: 'uppercase', fontSize: '1rem' }}>{editingCustomer ? 'Update Profile' : 'New Customer'}</h3>
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
                  <input type="text" name="phone" className="input-field" placeholder="e.g. 0788..." value={form.phone} onChange={handleInputChange} required />
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
