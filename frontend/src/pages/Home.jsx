import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, ShieldCheck, Clock, CheckCircle2, 
  MapPin, Phone, Mail, Instagram, Twitter, 
  Facebook, ArrowRight, ChevronRight, PlayCircle
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('exterior');

  const handleBookClick = () => {
    if (token) navigate('/dashboard?book=true');
    else navigate('/login');
  };

  const services = [
    {
      id: 'exterior',
      icon: <CheckCircle2 size={32} />,
      title: 'Diamond Wash',
      desc: 'Our flagship multi-stage exterior cleaning using premium surfactants and pH-balanced solutions.',
      price: '5,000'
    },
    {
      id: 'interior',
      icon: <ShieldCheck size={32} />,
      title: 'Full Detailing',
      desc: 'Complete interior restoration including steam cleaning, leather conditioning, and odor elimination.',
      price: '15,000'
    },
    {
      id: 'express',
      icon: <Clock size={32} />,
      title: 'Elite Express',
      desc: 'Rapid 15-minute high-pressure wash for professionals on the go. Speed meets quality.',
      price: '3,500'
    }
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      <section id="hero" style={{ 
        position: 'relative', 
        minHeight: '90vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        padding: '6rem 0'
      }}>
        {/* Ambient background blur */}
        <div style={{
          position: 'absolute', top: '10%', right: '-5%', width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(227,6,19,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          {/* Branded Logo Hero */}
          <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <img 
              src="/assets/rubis-logo.webp" 
              alt="Rubis logo" 
              style={{ height: '140px', width: 'auto', filter: 'drop-shadow(0 0 20px rgba(227,6,19,0.6))' }} 
            />
          </div>

          <h1 className="animate-fade-in-up delay-100" style={{
            fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1', letterSpacing: '-0.04em'
          }}>
            The Ultimate <br />
            <span style={{
              background: 'linear-gradient(135deg, #E30613 0%, #ff6666 50%, #E30613 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Rubis Clean</span>
          </h1>

          <div className="animate-fade-in-up delay-200" style={{ maxWidth: '850px', margin: '0 auto 3rem' }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              Welcome to the pinnacle of automotive care. At Rubis Wash Standard, we believe your vehicle is an extension of your lifestyle. Experience Rwanda's premier car care service, designed for those who demand absolute perfection.
            </p>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              From a rapid express wash to specialized diamond detailing, our professional staff utilize state-of-the-art technology and premium solutions. We guarantee a flawlessly clean and deeply protected surface. Sit back, relax, and let our experts deliver the ultimate Rubis Clean.
            </p>
          </div>

          <div className="animate-fade-in-up delay-300" style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleBookClick}
              className="btn btn-primary"
              style={{ padding: '1rem 3.5rem', fontSize: '1.15rem', borderRadius: '50px', fontWeight: '900', letterSpacing: '0.05em' }}
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" style={{ padding: '120px 0', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '5rem', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '40px', overflow: 'hidden' }}>
            <img 
              src="/assets/rubis_car_detailing.png"
              alt="Rubis Detailing" 
              style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '30px' }} 
            />
          </div>
          <div>
            <p className="section-label">Premier Heritage</p>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>Trusted <span style={{ color: 'var(--rubis-red)' }}>Standard of Care</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginBottom: '2.5rem', lineHeight: 1.8 }}>
              As a cornerstone of Rubis Energy Rwanda, we bring a legacy of absolute trust and professionalism to the car wash industry. We don't just wash; we preserve your investment.
            </p>
            <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rubis-red)', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em' }}>RUBIS STATIONS</span>
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', marginBottom: '1rem', textTransform: 'uppercase' }}>Kigali Headquarters</h3>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--rubis-red)' }}>24/7</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AVAILABLE</div>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section id="services" style={{ padding: '120px 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <p className="section-label" style={{ justifyContent: 'center' }}>Tailored Packages</p>
            <h2 style={{ fontSize: '3.5rem' }}>Designed for <span style={{ color: 'var(--rubis-red)' }}>Excellence</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {services.map((svc, i) => (
              <div key={i} className="glass-panel card-hover" style={{ padding: '3rem', position: 'relative' }}>
                <div style={{ color: 'var(--rubis-red)', marginBottom: '2rem' }}>{svc.icon}</div>
                <h3 style={{ fontSize: '1.75rem', marginBottom: '1.25rem' }}>{svc.title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>{svc.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-white)', paddingTop: '2rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900' }}>{svc.price} RWF</span>
                  <button onClick={handleBookClick} style={{ color: 'var(--rubis-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800' }}>Book Now →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEDIA SECTION ── */}
      <section id="media" style={{ padding: '120px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ marginBottom: '4rem' }}>
            <p className="section-label">Media & Vibes</p>
            <h2 style={{ fontSize: '3.5rem' }}>Experience <span style={{ color: 'var(--rubis-red)' }}>The Rubis Vibe</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', gridAutoRows: '300px' }}>
            <div className="glass-panel" style={{ gridColumn: 'span 8', gridRow: 'span 2', overflow: 'hidden' }}>
              <img src="/assets/rubis_car_detailing.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Detailing" />
            </div>
            <div className="glass-panel" style={{ gridColumn: 'span 4', gridRow: 'span 1', overflow: 'hidden' }}>
              <img src="/assets/rubis_express_wash.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Express" />
            </div>
            <div className="glass-panel" style={{ gridColumn: 'span 4', gridRow: 'span 1', overflow: 'hidden', background: 'var(--rubis-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <h3 style={{ color: 'white', fontSize: '2.5rem', textAlign: 'center', fontWeight: '900' }}>Rwanda's <br/> Finest</h3>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section id="contact" style={{ padding: '120px 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <div className="glass-panel" style={{ padding: '4rem', display: 'flex', gap: '4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 400px' }}>
              <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Visit <span style={{ color: 'var(--rubis-red)' }}>Our Station</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                Open 24/7 for you. Drop by for a wash or book your slot online.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ color: 'var(--rubis-red)' }}><MapPin size={24} /></div>
                  <div><h4 style={{ margin: 0 }}>Location</h4><p style={{ margin: 0, color: 'var(--text-muted)' }}>Kigali City Center, Rwanda</p></div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ color: 'var(--rubis-red)' }}><Phone size={24} /></div>
                  <div><h4 style={{ margin: 0 }}>Call Us</h4><p style={{ margin: 0, color: 'var(--text-muted)' }}>+250 123 456 789</p></div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ color: 'var(--rubis-red)' }}><Mail size={24} /></div>
                  <div><h4 style={{ margin: 0 }}>Email</h4><p style={{ margin: 0, color: 'var(--text-muted)' }}>care@rubisrwanda.rw</p></div>
                </div>
              </div>
            </div>
            <div style={{ flex: '1 1 400px', height: '400px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', overflow: 'hidden' }}>
               {/* Mock Map or Image */}
               <img src="/assets/rubis_express_wash.png" alt="Map View" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '6rem 0', background: 'var(--surface)', borderTop: '1px solid var(--border-white)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
          
          <div style={{ textAlign: 'left' }}>
            <img src="/assets/rubis-logo.webp" alt="Logo" style={{ height: '80px', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px rgba(227,6,19,0.4))' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              Setting the standard for premium car care in Rwanda. Experience the ultimate shine, precision detailing, and unmatched VIP service every time you visit.
            </p>
          </div>

          <div style={{ textAlign: 'left' }}>
            <h4 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connect With Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--rubis-red)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-white)', color: 'var(--text-primary)' }}>
                  <Instagram size={20} />
                </div>
                <span style={{ fontSize: '1.1rem' }}>@RubisWash_RW</span>
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--rubis-red)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-white)', color: 'var(--text-primary)' }}>
                  <Twitter size={20} />
                </div>
                <span style={{ fontSize: '1.1rem' }}>@RubisCarCare</span>
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--rubis-red)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-white)', color: 'var(--text-primary)' }}>
                  <Facebook size={20} />
                </div>
                <span style={{ fontSize: '1.1rem' }}>Rubis Wash Standard</span>
              </a>
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <h4 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Location</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
               <p>Kigali City Center<br/>KN 3 Ave, Kigali, Rwanda</p>
               <p style={{ marginTop: '0.5rem', color: 'var(--rubis-red)', fontWeight: 'bold' }}>Open 24/7</p>
            </div>
          </div>
          
        </div>

        <div className="container" style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>© 2026 Rubis Car Wash Management System. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default Home;
