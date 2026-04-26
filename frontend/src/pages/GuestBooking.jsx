import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, Clock, Car, User, Phone, Calendar, ArrowRight, Loader2 } from 'lucide-react';

const GuestBooking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = details, 2 = confirmation
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    guestVehiclePlate: '',
    serviceIds: [],
    scheduledAt: '',
    notes: '',
  });

  useEffect(() => {
    api.get('/services').then(res => {
      const data = res.data;
      setServices(Array.isArray(data) ? data : (data.content || []));
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFullDetail = (s) => /full.?detail/i.test(s?.name || '');

  const toggleService = (sid) => {
    const svc = services.find(s => s.id === sid);
    const isFull = isFullDetail(svc);
    setForm(prev => {
      const selected = prev.serviceIds;
      const already = selected.includes(sid);
      if (isFull) {
        return { ...prev, serviceIds: already ? [] : services.map(s => s.id) };
      }
      if (already) {
        const fullId = services.find(s => isFullDetail(s))?.id;
        return { ...prev, serviceIds: selected.filter(id => id !== sid && id !== fullId) };
      }
      return { ...prev, serviceIds: [...selected, sid] };
    });
  };

  const primaryServiceId = () => {
    const { serviceIds } = form;
    if (!serviceIds.length) return null;
    const full = services.find(s => isFullDetail(s) && serviceIds.includes(s.id));
    if (full) return full.id;
    const picked = services.filter(s => serviceIds.includes(s.id));
    return picked.sort((a, b) => (b.price || 0) - (a.price || 0))[0]?.id || serviceIds[0];
  };

  const totalPrice = form.serviceIds.reduce((sum, sid) => {
    const s = services.find(sv => sv.id === sid);
    return sum + (s?.price || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!primaryServiceId()) {
      setError('Please select at least one service.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestVehiclePlate: form.guestVehiclePlate.toUpperCase(),
        serviceId: primaryServiceId(),
        scheduledAt: form.scheduledAt,
        notes: form.notes || null,
      };
      const { data } = await api.post('/bookings/guest', payload);
      setSuccess(data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Success Screen ───────────────────────────────────────────────
  if (step === 2 && success) {
    return (
      <div style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="animate-fade-in-up glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '2px solid #16a34a' }}>
            <CheckCircle2 size={40} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.75rem' }}>Booking Confirmed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your guest booking has been placed successfully. Show this reference at the station.
          </p>

          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', textAlign: 'left', border: '1px solid rgba(227,6,19,0.3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Reference</div>
                <div style={{ fontWeight: '900', color: 'var(--rubis-red)', fontSize: '1.1rem' }}>{success.bookingReference}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Status</div>
                <div style={{ fontWeight: '700', color: '#facc15' }}>PENDING</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Guest Name</div>
                <div style={{ fontWeight: '700' }}>{success.guestName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Vehicle</div>
                <div style={{ fontWeight: '700' }}>{success.guestVehiclePlate}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Service</div>
                <div style={{ fontWeight: '700' }}>{success.serviceName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Amount</div>
                <div style={{ fontWeight: '900', color: 'var(--rubis-red)' }}>{(success.totalAmount || 0).toLocaleString()} RWF</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-white)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Scheduled At</div>
              <div style={{ fontWeight: '700' }}>{new Date(success.scheduledAt).toLocaleString()}</div>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Payment can be made with cash at the station or via Mobile Money upon arrival.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ border: '1px solid var(--border-white)', background: 'transparent', color: 'var(--text-primary)', padding: '0.75rem 2rem', borderRadius: '50px', fontWeight: '700' }}>
                Back to Home
              </button>
            </Link>
            <button
              onClick={() => { setStep(1); setSuccess(null); setForm({ guestName: '', guestPhone: '', guestVehiclePlate: '', serviceIds: [], scheduledAt: '', notes: '' }); }}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem', borderRadius: '50px', fontWeight: '700' }}
            >
              Book Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 1: Booking Form ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--bg-primary)', display: 'flex', overflow: 'hidden' }}>

      {/* LEFT PANEL */}
      <div style={{
        flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#020617', overflow: 'hidden'
      }} className="hide-mobile">
        <img src="/assets/rubis-logo.webp" alt="Rubis" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(225deg, rgba(227,6,19,0.5) 0%, rgba(2,6,23,0.95) 65%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: '70px', height: '70px', background: 'var(--rubis-red)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', color: 'white', fontWeight: '900', fontSize: '1.1rem' }}>
            RUBIS
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Book Without <br /><span style={{ color: 'var(--rubis-red)' }}>Signing Up</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '380px', lineHeight: 1.8, marginBottom: '2rem' }}>
            No account needed. Fill in your name, phone number, and vehicle plate — and you're set. Quick, easy, and private.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'No registration required',
              'No credentials stored permanently',
              'Pay cash or mobile money at the station',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rubis-red)', flexShrink: 0 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — FORM */}
      <div style={{ flex: '0 0 540px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-secondary)', overflowY: 'auto' }}>
        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '440px' }}>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.5rem' }}>Guest Booking</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Fill in your details to reserve your slot</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Name */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} /> Full Name
              </label>
              <input
                type="text" name="guestName" className="input-field"
                style={{ height: '52px' }} placeholder="John Doe"
                value={form.guestName} onChange={handleChange} required
              />
            </div>

            {/* Phone */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="tel" name="guestPhone" className="input-field"
                style={{ height: '52px' }} placeholder="078..."
                value={form.guestPhone} onChange={handleChange} required
              />
            </div>

            {/* Vehicle Plate */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Car size={14} /> Vehicle Plate Number
              </label>
              <input
                type="text" name="guestVehiclePlate" className="input-field"
                style={{ height: '52px', textTransform: 'uppercase' }} placeholder="RAB 123A"
                value={form.guestVehiclePlate} onChange={handleChange} required
              />
            </div>

            {/* Service — multi-select cards */}
            <div className="input-group">
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Service Type — select one or more
              </label>
              {services.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
                  Loading services…
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                  {services.map(s => {
                    const isSelected = form.serviceIds.includes(s.id);
                    const isFull = isFullDetail(s);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        style={{
                          padding: '0.9rem', borderRadius: '11px', cursor: 'pointer',
                          border: `2px solid ${isSelected ? (isFull ? '#e30613' : '#818cf8') : 'rgba(255,255,255,0.08)'}`,
                          background: isSelected ? (isFull ? 'rgba(227,6,19,0.09)' : 'rgba(99,102,241,0.09)') : 'rgba(255,255,255,0.025)',
                          transition: 'all 0.15s', position: 'relative', userSelect: 'none',
                        }}
                      >
                        {isFull && (
                          <div style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.55rem', fontWeight: '900', background: '#e30613', color: 'white', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.06em' }}>
                            PREMIUM · ALL INCLUSIVE
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.3 }}>{s.name}</div>
                          <div style={{ width: '17px', height: '17px', borderRadius: '4px', flexShrink: 0, marginTop: '1px',
                            border: `2px solid ${isSelected ? (isFull ? '#e30613' : '#818cf8') : 'rgba(255,255,255,0.2)'}`,
                            background: isSelected ? (isFull ? '#e30613' : '#818cf8') : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSelected && <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: '900', lineHeight: 1 }}>✓</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '900', color: isFull ? '#e30613' : '#818cf8', marginTop: '0.4rem' }}>
                          {(s.price || 0).toLocaleString()} RWF
                        </div>
                        {isFull && isSelected && (
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '3px' }}>All services included</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} /> Preferred Date & Time
              </label>
              <input
                type="datetime-local" name="scheduledAt" className="input-field"
                style={{ height: '52px' }}
                value={form.scheduledAt} onChange={handleChange} required
                min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
              />
            </div>

            {/* Notes */}
            <div className="input-group">
              <label className="input-label">Additional Notes (optional)</label>
              <textarea
                name="notes" className="input-field" rows={3} placeholder="Any special requests..."
                style={{ resize: 'none', paddingTop: '0.75rem' }}
                value={form.notes} onChange={handleChange}
              />
            </div>

            {/* Price Preview */}
            {form.serviceIds.length > 0 && (
              <div style={{ background: 'rgba(227,6,19,0.08)', border: '1px solid rgba(227,6,19,0.25)', borderRadius: '12px', padding: '1rem' }}>
                {form.serviceIds.length > 1 && (
                  <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {services.filter(s => form.serviceIds.includes(s.id)).map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <span>{s.name}</span>
                        <span>{(s.price || 0).toLocaleString()} RWF</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(227,6,19,0.2)', marginTop: '0.25rem', paddingTop: '0.4rem' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {form.serviceIds.length > 1 ? 'Total' : services.find(s => s.id === form.serviceIds[0])?.name}
                  </span>
                  <span style={{ fontWeight: '900', color: 'var(--rubis-red)', fontSize: '1.1rem' }}>
                    {totalPrice.toLocaleString()} RWF
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit" className="btn btn-primary"
              style={{ height: '52px', fontSize: '1.05rem', borderRadius: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <> Confirm Booking <ArrowRight size={18} /></>}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default GuestBooking;
