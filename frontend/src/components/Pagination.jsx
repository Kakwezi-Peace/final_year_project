import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalElements, pageSize = 10 }) => {
  if (totalPages === 0 && !totalElements) return null;

  const from = totalElements ? currentPage * pageSize + 1 : null;
  const to   = totalElements ? Math.min((currentPage + 1) * pageSize, totalElements) : null;

  const btnStyle = (active, disabled) => ({
    minWidth: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 0.75rem',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.2s ease',
    background: active ? 'var(--rubis-red)' : 'var(--surface)',
    color: active ? 'white' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    border: active ? 'none' : '1px solid var(--border-white)',
    opacity: disabled ? 0.35 : 1,
  });

  const pages = [];
  if (totalPages > 1) {
    const maxVisible = 5;
    let start = Math.max(0, currentPage - 2);
    let end   = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(0, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '0.9rem 1.25rem',
      background: 'var(--surface-solid)',
      borderRadius: '12px',
      border: '1px solid var(--border-white)',
      flexWrap: 'wrap',
      gap: '0.75rem',
    }}>
      {/* Left: count */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {from && to ? (
          <>Showing <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{from}–{to}</span> of{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{totalElements}</span> records</>
        ) : (
          <>Page <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{currentPage + 1}</span> of{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{Math.max(totalPages, 1)}</span></>
        )}
      </div>

      {/* Right: nav (only when multiple pages) */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button onClick={() => onPageChange(0)} disabled={currentPage === 0}
            style={btnStyle(false, currentPage === 0)} className="pagination-btn">FIRST</button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}
            style={btnStyle(false, currentPage === 0)} className="pagination-btn">PREV</button>

          {pages.map(p => (
            <button key={p} onClick={() => onPageChange(p)}
              style={btnStyle(p === currentPage, false)} className="pagination-btn">
              {p + 1}
            </button>
          ))}

          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}
            style={btnStyle(false, currentPage === totalPages - 1)} className="pagination-btn">NEXT</button>
          <button onClick={() => onPageChange(totalPages - 1)} disabled={currentPage === totalPages - 1}
            style={btnStyle(false, currentPage === totalPages - 1)} className="pagination-btn">LAST</button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
