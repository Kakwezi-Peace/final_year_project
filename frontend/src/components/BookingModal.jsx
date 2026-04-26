import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VEHICLE_MAKES = {
  "Toyota": ["Rav4", "Land Cruiser", "Corolla", "Hilux", "Prado", "Yaris", "Vitz"],
  "Mercedes-Benz": ["C-Class", "E-Class", "G-Class", "GLE"],
  "BMW": ["X3", "X5", "X6", "3 Series", "5 Series"],
  "Volkswagen": ["Golf", "Polo", "Touareg", "Tiguan", "Amarok"],
  "Nissan": ["Patrol", "Navara", "Almera", "X-Trail"],
  "Hyundai": ["Tucson", "Santa Fe", "Elantra", "Creta"]
};

const BookingModal = ({ onClose, onSuccess, editData = null }) => {
  const [step, setStep]                 = useState('form');   // 'form' | 'payment' | 'success'
  const [services, setServices]         = useState([]);
  const [vehicles, setVehicles]         = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); 
  const [employees, setEmployees]       = useState([]);
  const [profile, setProfile]           = useState(null);
  const [dataLoading, setDataLoading]   = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  
  // Array of selected service IDs instead of a single selection
  const [selectedServices, setSelectedServices] = useState([]);
  
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO');
  const [mobileNumber, setMobileNumber]   = useState('');

  const [form, setForm] = useState({
    customerId: editData?.customerId || '', 
    vehicleId: editData?.vehicleId || '', 
    scheduledAt: editData?.scheduledAt ? editData.scheduledAt.substring(0, 16) : '',
    notes: editData?.notes || '',
    assignedEmployeeId: editData?.assignedEmployeeId || '',
  });

  // Vehicle formatting states
  const [plateFormat, setPlateFormat] = useState('RWANDA'); // 'RWANDA' | 'OTHER'
  const [isMakeOther, setIsMakeOther] = useState(false);
  const [isModelOther, setIsModelOther] = useState(false);

  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '',
    make: '',
    model: '',
    year: '',
  });

  useEffect(() => {
    loadData();
  }, [editData]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [svcRes, profRes] = await Promise.all([
        api.get('/services/active'),
        api.get('/auth/me'),
      ]);
      const availableServices = svcRes.data || [];
      setServices(availableServices);
      
      const prof = profRes.data;
      setProfile(prof);

      if (['ADMIN', 'MANAGER', 'STAFF'].includes(prof.role)) {
        try {
          const [cRes, eRes] = await Promise.all([
            api.get('/customers'),
            api.get('/employees/active')
          ]);
          setAllCustomers(cRes.data.content || cRes.data || []);
          setEmployees(eRes.data || []);
        } catch { 
           setAllCustomers([]); 
           setEmployees([]);
        }
      }

      if (editData) {
        // Hydrate selected services (Primary + Additional from the name aggregation or IDs if we had them)
        // Since editData primarily came from the list, we'll just check if it matches by primary service
        const found = availableServices.find(s => s.id === editData.serviceId);
        if (found) setSelectedServices([found]);
      }

      const effectiveId = editData?.customerId || (prof.role === 'CUSTOMER' ? prof.customerId : null);
      if (effectiveId) {
        if (!editData) setForm(prev => ({ ...prev, customerId: effectiveId }));
        const vRes = await api.get(`/vehicles/customer/${effectiveId}`);
        setVehicles(vRes.data || []);
        if (!editData && (vRes.data || []).length === 0) setShowNewVehicle(true);
      }
    } catch (err) {
      setError('Failed to load initial data.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (form.customerId && ['ADMIN', 'MANAGER', 'STAFF'].includes(profile?.role)) {
      api.get(`/vehicles/customer/${form.customerId}`)
        .then(res => {
          setVehicles(res.data || []);
          if (!editData) setShowNewVehicle((res.data || []).length === 0);
        })
        .catch(() => setVehicles([]));
    }
  }, [form.customerId, profile?.role, editData]);

  // License Plate Formatter
  const handlePlateChange = (val) => {
    let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (plateFormat === 'RWANDA') {
       let formatted = '';
       if (clean.length > 0) formatted += clean.substring(0, 3);
       if (clean.length > 3) formatted += ' ' + clean.substring(3, 6);
       if (clean.length > 6) formatted += ' ' + clean.substring(6, 7);
       setNewVehicle({...newVehicle, licensePlate: formatted});
    } else {
       setNewVehicle({...newVehicle, licensePlate: val.toUpperCase()});
    }
  };

  // Multi-select service logic
  const handleServiceToggle = (s) => {
    // Check if it's full detailing
    const isFullDetailing = s.name.toLowerCase().includes('full detailing');
    
    // Check if currently selected
    const isSelected = selectedServices.some(curr => curr.id === s.id);
    
    if (isSelected) {
      // Removing the service
      setSelectedServices(selectedServices.filter(curr => curr.id !== s.id));
    } else {
      // Adding the service
      if (isFullDetailing) {
        // Full detailing overrides everything else
        setSelectedServices([s]);
      } else {
        // If they click a normal service but full detailing is selected, clear full detailing first
        const hasFullDetailing = selectedServices.some(curr => curr.name.toLowerCase().includes('full detailing'));
        if (hasFullDetailing) {
          setSelectedServices([s]);
        } else {
          setSelectedServices([...selectedServices, s]);
        }
      }
    }
  };

  const registerNewVehicle = async () => {
    try {
      const targetCustomerId = form.customerId || profile?.customerId;
      const endpoint = profile?.role === 'CUSTOMER' ? '/vehicles/my-vehicle' : '/vehicles';
      const res = await api.post(endpoint, {
        ...newVehicle,
        licensePlate: newVehicle.licensePlate.trim() || 'e.g. RQB 459',
        make: newVehicle.make.trim(),
        model: newVehicle.model.trim(),
        vehicleType: 'SEDAN',
        customerId: targetCustomerId
      });
      return res.data.id;
    } catch (err) {
      setError('Vehicle registration failed.');
      return null;
    }
  };

  const handleContinueToPayment = async () => {
    setError('');

    if (selectedServices.length === 0) {
      setError('Please select at least one service package.');
      return;
    }
    if (!form.scheduledAt) {
      setError('Please select a preferred date and time for your service.');
      return;
    }

    let vId = form.vehicleId;
    if (showNewVehicle || !vId) {
      if (!newVehicle.licensePlate) {
         setError('Please provide a vehicle license plate.');
         return;
      }
      if (!newVehicle.make || !newVehicle.model || !newVehicle.year) {
         setError('Please provide Make, Model, and Year for the vehicle.');
         return;
      }
      setSubmitting(true);
      vId = await registerNewVehicle();
      setSubmitting(false);
      if (!vId) return;
      setForm(prev => ({ ...prev, vehicleId: vId }));
    }
    
    if (editData) {
      await handleConfirmPayment(); 
    } else {
      setStep('payment');
    }
  };

  const handleConfirmPayment = async () => {
    setError('');
    
    // Total calculation
    const totalAmount = selectedServices.reduce((acc, curr) => acc + curr.price, 0);

    // Skip payment validation entirely if we are just editing
    if (!editData) {
      if (paymentMethod === 'MTN_MOMO' && (!mobileNumber.startsWith('078') && !mobileNumber.startsWith('079'))) {
        setError('MTN number should start with 078 or 079');
        return;
      } else if (paymentMethod === 'AIRTEL_MONEY' && (!mobileNumber.startsWith('072') && !mobileNumber.startsWith('073'))) {
        setError('Airtel number should start with 072 or 073');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Split services into Primary and Additional for backend grouping
      const selectedIds = selectedServices.map(s => s.id);
      const primaryServiceId = selectedIds[0];
      const additionalServiceIds = selectedIds.slice(1);

      const payload = {
        ...form,
        serviceId: primaryServiceId,
        additionalServiceIds: additionalServiceIds,
        paymentMethod,
        mobileMoneyNumber: mobileNumber,
        scheduledAt: form.scheduledAt.length === 16 ? form.scheduledAt + ':00' : form.scheduledAt
      };
      
      if (editData) {
        await api.put(`/bookings/${editData.id}`, payload);
      } else {
        await api.post('/bookings', payload);
      }
      
      setStep('success');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) return null;
  const totalPriceAggregated = selectedServices.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
      
      <div style={{ 
        position: 'relative', width: '100%', maxWidth: '620px', 
        background: '#0a0a0a', borderRadius: '24px', 
        border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          background: '#e30613', padding: '1.25rem 2rem', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            {editData ? 'Update Booking' : 'New Booking'}
          </h2>
          <button onClick={onClose} style={{ 
            background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', 
            width: '36px', height: '36px', color: 'white', cursor: 'pointer', 
            fontSize: '1.2rem', fontWeight: '900'
          }}>✕</button>
        </div>

        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '700' }}>
              {error}
            </div>
          )}

          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Vehicle Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>Vehicle Select/Create</label>
                
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' 
                }}>
                   {['ADMIN', 'MANAGER', 'STAFF'].includes(profile?.role) && (
                      <select className="input-field" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} style={{ width: '100%', background: '#111', border: '1px solid #222' }}>
                        <option value="">-- Select Customer --</option>
                        {allCustomers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                      </select>
                   )}

                   {vehicles.length > 0 && !showNewVehicle ? (
                     <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <select className="input-field" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} style={{ flex: 1, background: '#111', border: '1px solid #222' }}>
                          <option value="">-- Choose saved vehicle --</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} ({v.make} {v.model})</option>)}
                        </select>
                        <button onClick={() => setShowNewVehicle(true)} style={{ background: '#222', border: 'none', borderRadius: '8px', padding: '0.75rem 1rem', color: 'white', cursor: 'pointer', fontWeight: '900' }}>+ NEW</button>
                     </div>
                   ) : (
                     <>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '-0.5rem' }}>
                          <button onClick={() => setPlateFormat('RWANDA')} style={{ flex: 1, padding: '0.5rem', background: plateFormat === 'RWANDA' ? '#333' : 'transparent', color: plateFormat === 'RWANDA' ? 'white' : '#666', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>Rwandan Plate</button>
                          <button onClick={() => setPlateFormat('OTHER')} style={{ flex: 1, padding: '0.5rem', background: plateFormat === 'OTHER' ? '#333' : 'transparent', color: plateFormat === 'OTHER' ? 'white' : '#666', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>Other Format</button>
                        </div>
                        <input 
                          className="input-field" 
                          placeholder={plateFormat === 'RWANDA' ? "e.g. RQB 459 A" : "e.g. KCD 123X"}
                          value={newVehicle.licensePlate} 
                          onChange={e => handlePlateChange(e.target.value)} 
                          style={{ width: '100%', padding: '1rem', background: '#111', border: '1px solid #222', fontSize: '1.2rem', fontWeight: '800', letterSpacing: '1px' }} 
                        />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                          {/* Make Field */}
                          {isMakeOther ? (
                            <input className="input-field" placeholder="Make (e.g. Audi)" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} style={{ background: '#111', border: '1px solid #222', fontSize: '0.9rem' }} />
                          ) : (
                            <select className="input-field" value={newVehicle.make} onChange={e => {
                              if (e.target.value === 'OTHER') { setIsMakeOther(true); setNewVehicle({...newVehicle, make: '', model: ''}); setIsModelOther(true); } 
                              else { setNewVehicle({...newVehicle, make: e.target.value, model: ''}); setIsModelOther(false); }
                            }} style={{ background: '#111', border: '1px solid #222', fontSize: '0.9rem', color: newVehicle.make ? 'white' : '#666' }}>
                              <option value="" disabled>Make...</option>
                              {Object.keys(VEHICLE_MAKES).map(m => <option key={m} value={m}>{m}</option>)}
                              <option value="OTHER">Other...</option>
                            </select>
                          )}

                          {/* Model Field */}
                          {isModelOther || !VEHICLE_MAKES[newVehicle.make] ? (
                            <input className="input-field" placeholder="Model" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} style={{ background: '#111', border: '1px solid #222', fontSize: '0.9rem' }} disabled={!newVehicle.make && !isMakeOther} />
                          ) : (
                            <select className="input-field" value={newVehicle.model} onChange={e => {
                               if (e.target.value === 'OTHER') { setIsModelOther(true); setNewVehicle({...newVehicle, model: ''}); }
                               else { setNewVehicle({...newVehicle, model: e.target.value}); }
                            }} style={{ background: '#111', border: '1px solid #222', fontSize: '0.9rem', color: newVehicle.model ? 'white' : '#666' }}>
                              <option value="" disabled>Model...</option>
                              {(VEHICLE_MAKES[newVehicle.make] || []).map(m => <option key={m} value={m}>{m}</option>)}
                              <option value="OTHER">Other...</option>
                            </select>
                          )}

                          {/* Year Field */}
                          <input type="number" className="input-field" placeholder="Year" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} style={{ background: '#111', border: '1px solid #222', fontSize: '0.9rem' }} />
                        </div>
                        {vehicles.length > 0 && (
                          <button onClick={() => setShowNewVehicle(false)} style={{ background: 'none', border: 'none', color: '#444', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left' }}>← Use saved vehicle</button>
                        )}
                     </>
                   )}
                </div>
              </div>

              {/* Service Package Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>Service Packages <span style={{fontSize: '0.7rem', fontWeight: '400', paddingLeft: '5px'}}>(Select multiple)</span></label>
                  <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#facc15' }}>TOTAL: {totalPriceAggregated.toLocaleString()} RWF</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {services.map(s => {
                    const isSelected = selectedServices.some(curr => curr.id === s.id);
                    const isFullDetailing = s.name.toLowerCase().includes('full detailing');
                    const hasFullDetailingSelected = selectedServices.some(curr => curr.name.toLowerCase().includes('full detailing'));
                    
                    // Disable normal options if full detailing is active and this isn't it
                    const disabled = hasFullDetailingSelected && !isFullDetailing;

                    return (
                      <div 
                        key={s.id} 
                        onClick={() => !disabled && handleServiceToggle(s)}
                        style={{ 
                          padding: '1rem', borderRadius: '12px', 
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          border: `2px solid ${isSelected ? '#e30613' : 'rgba(255,255,255,0.03)'}`,
                          background: isSelected ? 'rgba(227,6,19,0.06)' : 'rgba(255,255,255,0.01)',
                          opacity: disabled ? 0.3 : 1,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{ 
                          width: '20px', height: '20px', borderRadius: '4px', 
                          border: `2px solid ${isSelected ? '#e30613' : '#333'}`,
                          background: isSelected ? '#e30613' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'white', marginBottom: '0.2rem' }}>{s.name}</div>
                          <div style={{ color: '#e30613', fontWeight: '800', fontSize: '0.75rem' }}>RWF {s.price.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignment & Details */}
              {['ADMIN', 'MANAGER', 'STAFF'].includes(profile?.role) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>Assign Staff (Optional)</label>
                  <select className="input-field" value={form.assignedEmployeeId} onChange={e => setForm({...form, assignedEmployeeId: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <option value="">-- No Assignment --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>Scheduled At</label>
                <input type="datetime-local" className="input-field" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', color: 'white' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>Special Instructions</label>
                <textarea className="input-field" rows="2" placeholder="e.g. Please clean the engine bay" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', resize: 'none' }} />
              </div>

              <button className="btn btn-primary" onClick={handleContinueToPayment} disabled={submitting} style={{ padding: '1.25rem', fontSize: '1.05rem', fontWeight: '900', borderRadius: '16px', background: '#e30613', border: 'none', marginTop: '0.5rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'PROCESSING...' : `PROCEED TO CHECKOUT (RWF ${totalPriceAggregated.toLocaleString()})`}
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Checkout Summary ── */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: '#555', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Checkout Summary</span>
                  {selectedServices.map(s => (
                    <span key={s.id} style={{ fontSize: '0.95rem', color: 'white', fontWeight: '700' }}>• {s.name}</span>
                  ))}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#facc15', lineHeight: 1 }}>RWF {totalPriceAggregated.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '3px' }}>Inclusive of taxes</div>
                </div>
              </div>

              {/* ── Pay To ── */}
              <div style={{ background: 'rgba(227,6,19,0.06)', border: '1px solid rgba(227,6,19,0.2)', borderRadius: '12px', padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Pay To · RUBIS Car Wash Kigali</div>
                  <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#facc15', letterSpacing: '3px' }}>0783 672 723</div>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText('0783672723'); }}
                  style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', color: '#facc15', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Copy
                </button>
              </div>

              {/* ── Provider Selection ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Select MoMo Provider</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div onClick={() => setPaymentMethod('MTN_MOMO')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1.1rem', borderRadius: '14px', cursor: 'pointer', background: paymentMethod === 'MTN_MOMO' ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.02)', border: `2px solid ${paymentMethod === 'MTN_MOMO' ? '#facc15' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.15s' }}>
                    <div style={{ width: '44px', height: '44px', background: '#facc15', borderRadius: '11px', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.85rem' }}>MTN</div>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>MTN MoMo</span>
                    {paymentMethod === 'MTN_MOMO' && <span style={{ fontSize: '0.6rem', color: '#facc15', fontWeight: '800', background: 'rgba(250,204,21,0.15)', padding: '1px 8px', borderRadius: '20px' }}>SELECTED</span>}
                  </div>
                  <div onClick={() => setPaymentMethod('AIRTEL_MONEY')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1.1rem', borderRadius: '14px', cursor: 'pointer', background: paymentMethod === 'AIRTEL_MONEY' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', border: `2px solid ${paymentMethod === 'AIRTEL_MONEY' ? '#ef4444' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.15s' }}>
                    <div style={{ width: '44px', height: '44px', background: '#ef4444', borderRadius: '11px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.85rem' }}>Artl</div>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>Airtel Money</span>
                    {paymentMethod === 'AIRTEL_MONEY' && <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: '800', background: 'rgba(239,68,68,0.15)', padding: '1px 8px', borderRadius: '20px' }}>SELECTED</span>}
                  </div>
                </div>
              </div>

              {/* ── Step-by-step guide ── */}
              {paymentMethod && (() => {
                const isMtn = paymentMethod === 'MTN_MOMO';
                const accentColor = isMtn ? '#facc15' : '#ef4444';
                const accentBg   = isMtn ? 'rgba(250,204,21,0.08)' : 'rgba(239,68,68,0.08)';
                const ussd       = isMtn
                  ? `*182*1*1*0783672723*${totalPriceAggregated}#`
                  : `*185*1*0783672723*${totalPriceAggregated}#`;
                const steps = isMtn ? [
                  { text: 'Dial the USSD code on your MTN line', code: ussd },
                  { text: 'Or manually: dial *182*1*1# and follow the prompts' },
                  { text: 'Enter recipient number: 0783672723 (RUBIS Car Wash)' },
                  { text: `Enter amount: RWF ${totalPriceAggregated.toLocaleString()}` },
                  { text: 'Enter your MTN MoMo PIN to confirm' },
                  { text: 'Enter your phone number below and tap PAY NOW', highlight: true },
                ] : [
                  { text: 'Dial the USSD code on your Airtel line', code: ussd },
                  { text: 'Or manually: dial *185# → Send Money' },
                  { text: 'Enter recipient number: 0783672723 (RUBIS Car Wash)' },
                  { text: `Enter amount: RWF ${totalPriceAggregated.toLocaleString()}` },
                  { text: 'Enter your Airtel Money PIN to confirm' },
                  { text: 'Enter your phone number below and tap PAY NOW', highlight: true },
                ];
                return (
                  <div style={{ background: accentBg, border: `1px solid ${accentColor}22`, borderRadius: '14px', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '900', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        How to Pay — {isMtn ? 'MTN MoMo' : 'Airtel Money'}
                      </span>
                    </div>
                    {steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                          background: s.highlight ? '#e30613' : `${accentColor}22`,
                          color: s.highlight ? 'white' : accentColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.62rem', fontWeight: '900' }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.83rem', color: s.highlight ? 'white' : 'rgba(255,255,255,0.75)', fontWeight: s.highlight ? '700' : '500', lineHeight: 1.45 }}>
                            {s.text}
                          </span>
                          {s.code && (
                            <div style={{ marginTop: '6px', background: 'rgba(0,0,0,0.45)', borderRadius: '8px', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <code style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: '900', color: '#4ade80', letterSpacing: '0.04em' }}>{s.code}</code>
                              <button
                                onClick={() => navigator.clipboard.writeText(s.code)}
                                style={{ fontSize: '0.62rem', fontWeight: '800', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', padding: '3px 9px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                              >
                                Copy
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ── Your phone number ── */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', display: 'block' }}>
                  Your Payment Phone Number
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. 0788 000 000"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  style={{ width: '100%', textAlign: 'center', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '3px', background: 'rgba(0,0,0,0.4)', padding: '1rem', border: `2px solid ${mobileNumber ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', color: '#facc15', transition: 'border 0.2s' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '5px', textAlign: 'center' }}>
                  The number you used to make the MoMo payment above
                </div>
              </div>

              {/* ── Actions ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting || !mobileNumber || !paymentMethod}
                  style={{ padding: '1.1rem', background: submitting || !mobileNumber || !paymentMethod ? 'rgba(250,204,21,0.3)' : '#facc15', color: '#1a1a1a', fontWeight: '900', borderRadius: '14px', fontSize: '1rem', border: 'none', cursor: submitting || !mobileNumber || !paymentMethod ? 'default' : 'pointer', transition: 'background 0.2s', letterSpacing: '0.04em' }}
                >
                  {submitting ? 'CONFIRMING...' : 'CONFIRM PAYMENT'}
                </button>
                <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', padding: '0.5rem' }}>
                  ← Go back
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
               <div style={{ width: '100px', height: '100px', background: 'rgba(34,197,94,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '3px solid rgba(34,197,94,0.15)', fontSize: '2rem', color: '#4ade80' }}>✓</div>
               <h3 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.75rem', color: 'white' }}>{editData ? 'Updated!' : 'Order Received!'}</h3>
               <p style={{ color: '#666', marginBottom: '2.5rem', maxWidth: '300px', margin: '0 auto 2.5rem', fontSize: '0.95rem' }}>We've recorded your details.</p>
               <button onClick={onClose} className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '12px', fontWeight: '800' }}>DONE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
