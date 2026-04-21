import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ListOrdered,
  Activity, BarChart3, CreditCard,
  LogOut, UserCircle, Plus,
  ChevronRight, ChevronDown, UsersRound, ShieldCheck
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Which parent accordion sections are open
  const [teamsOpen,   setTeamsOpen]   = useState(location.pathname.startsWith('/manager'));
  const [managerOpen, setManagerOpen] = useState(location.pathname.startsWith('/manager'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  /* ─── flat menu items (excluding Teams which is rendered separately) ─── */
  const menuItems = [
    { name: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard',        roles: ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'] },
    { name: 'Book a Wash',     icon: Plus,            path: '/dashboard?book=true', roles: ['CUSTOMER'] },
    { name: 'Customers',       icon: Users,           path: '/customers',         roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Queue & Sched.',  icon: ListOrdered,     path: '/queue',             roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Operations',      icon: Activity,        path: '/operations',        roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Analytics',       icon: BarChart3,       path: '/analytics',         roles: ['ADMIN', 'MANAGER'] },
    { name: 'Payments',        icon: CreditCard,      path: '/payments',          roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  ];

  const filtered = menuItems.filter(item => item.roles.includes(user.role));
  const showTeams = ['ADMIN', 'MANAGER'].includes(user.role);

  /* ─── Link style helper ─── */
  const linkStyle = (active, isBook = false) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.85rem 1rem',
    textDecoration: 'none',
    borderRadius: '12px',
    color: active ? 'white' : isBook ? 'white' : 'var(--text-secondary)',
    background: active ? 'var(--rubis-red)' : isBook ? 'var(--rubis-red)' : 'transparent',
    border: isBook && !active ? '2px solid var(--rubis-red)' : '1px solid transparent',
    fontWeight: active || isBook ? '800' : '600',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
    boxShadow: active ? 'var(--shadow-red)' : 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    gap: '0.6rem',
  });

  /* ─── Accordion header style ─── */
  const accordionHeader = (open, highlight = false) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    background: highlight ? 'rgba(220,38,38,0.08)' : 'transparent',
    border: highlight ? '1px solid rgba(220,38,38,0.18)' : '1px solid transparent',
    color: highlight ? 'var(--rubis-red)' : 'var(--text-secondary)',
    fontWeight: '800',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  });

  /* ─── Nested (indented) link style ─── */
  const nestedLink = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem 0.65rem 1.1rem',
    textDecoration: 'none',
    borderRadius: '10px',
    color: active ? 'white' : 'var(--text-secondary)',
    background: active ? 'var(--rubis-red)' : 'transparent',
    fontWeight: active ? '800' : '600',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.2s ease',
    boxShadow: active ? 'var(--shadow-red)' : 'none',
  });

  return (
    <aside style={{
      width: '264px',
      height: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-white)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
    }}>
      {/* Brand */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-white)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--rubis-red)', fontWeight: '900', fontSize: '1.25rem', letterSpacing: '0.05em' }}>RUBIS</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>STATION KIGALI</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0.5rem 0.5rem 0.6rem', fontWeight: '800' }}>
          Management
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Flat menu links */}
          {filtered.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={linkStyle(isActive(item.path), item.name === 'Book a Wash')}
            >
              <item.icon size={15} />
              <span>{item.name}</span>
            </Link>
          ))}

          {/* ─── TEAMS (nested accordion) ─── */}
          {showTeams && (
            <div style={{ marginTop: '0.5rem' }}>
              {/* Divider label */}
              <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0.8rem 0.5rem 0.4rem', fontWeight: '800' }}>
                Teams
              </p>

              {/* TEAMS top-level – "Employees" direct link */}
              <Link
                to="/employees"
                style={linkStyle(isActive('/employees'))}
              >
                <Users size={15} />
                <span>All Employees</span>
              </Link>

              {/* ── MANAGER accordion ── */}
              <div style={{ marginTop: '0.25rem' }}>
                <div
                  style={accordionHeader(managerOpen, location.pathname.startsWith('/manager'))}
                  onClick={() => setManagerOpen(prev => !prev)}
                  role="button"
                  aria-expanded={managerOpen}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={15} />
                    <span>Manager</span>
                  </div>
                  {managerOpen
                    ? <ChevronDown size={13} style={{ transition: 'transform 0.2s' }} />
                    : <ChevronRight size={13} style={{ transition: 'transform 0.2s' }} />
                  }
                </div>

                {/* Manager sub-items */}
                {managerOpen && (
                  <div style={{
                    marginLeft: '1rem',
                    borderLeft: '2px solid rgba(220,38,38,0.25)',
                    paddingLeft: '0.6rem',
                    marginTop: '0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}>
                    {/* ── TEAM HANDLE accordion ── */}
                    <div
                      style={{
                        ...accordionHeader(teamsOpen, location.pathname === '/manager/dashboard'),
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.75rem',
                      }}
                      onClick={() => setTeamsOpen(prev => !prev)}
                      role="button"
                      aria-expanded={teamsOpen}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UsersRound size={13} />
                        <span>Team Handle</span>
                      </div>
                      {teamsOpen
                        ? <ChevronDown size={12} />
                        : <ChevronRight size={12} />
                      }
                    </div>

                    {/* Team Handle sub-items */}
                    {teamsOpen && (
                      <div style={{
                        marginLeft: '0.75rem',
                        borderLeft: '2px solid rgba(148,163,184,0.15)',
                        paddingLeft: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.15rem',
                        marginTop: '0.15rem',
                      }}>
                        <Link
                          to="/manager/dashboard"
                          style={nestedLink(isActive('/manager/dashboard'))}
                        >
                          <ShieldCheck size={12} />
                          Manager's Dashboard
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* User Session */}
      <div style={{
        padding: '1.25rem',
        borderTop: '1px solid var(--border-white)',
        background: 'var(--surface)',
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'var(--surface)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--rubis-red)', border: '1px solid var(--border-white)',
          }}>
            <UserCircle size={24} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user.fullName || 'Rubis User'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{user.role}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '0.75rem',
            background: 'var(--rubis-red)', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '0.85rem',
            fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s ease',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}
        >
          LOGOUT
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
