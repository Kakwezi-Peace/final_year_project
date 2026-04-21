import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalElements }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(0, currentPage - 2);
  let end = Math.min(totalPages - 1, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(0, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const btnStyle = (active) => ({
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: active ? 'var(--rubis-red)' : 'var(--surface)',
    color: active ? 'white' : 'var(--text-secondary)',
    border: active ? 'none' : '1px solid var(--border-white)',
  });

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginTop: '2rem',
      padding: '1rem',
      background: 'var(--surface-solid)',
      borderRadius: '12px',
      border: '1px solid var(--border-white)'
    }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing page <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{currentPage + 1}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{totalPages}</span>
        {totalElements !== undefined && (
           <> · <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{totalElements}</span> total records</>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <button 
          onClick={() => onPageChange(0)} 
          disabled={currentPage === 0}
          style={{ ...btnStyle(false), width: 'auto', padding: '0 0.75rem', opacity: currentPage === 0 ? 0.3 : 1, cursor: currentPage === 0 ? 'default' : 'pointer', fontSize: '0.65rem' }}
          className="pagination-btn"
        >
          FIRST
        </button>
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 0}
          style={{ ...btnStyle(false), width: 'auto', padding: '0 0.75rem', opacity: currentPage === 0 ? 0.3 : 1, cursor: currentPage === 0 ? 'default' : 'pointer', fontSize: '0.65rem' }}
          className="pagination-btn"
        >
          PREV
        </button>

        {pages.map(p => (
          <button 
            key={p} 
            onClick={() => onPageChange(p)} 
            style={btnStyle(p === currentPage)}
            className="pagination-btn"
          >
            {p + 1}
          </button>
        ))}

        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages - 1}
          style={{ ...btnStyle(false), width: 'auto', padding: '0 0.75rem', opacity: currentPage === totalPages - 1 ? 0.3 : 1, cursor: currentPage === totalPages - 1 ? 'default' : 'pointer', fontSize: '0.65rem' }}
          className="pagination-btn"
        >
          NEXT
        </button>
        <button 
          onClick={() => onPageChange(totalPages - 1)} 
          disabled={currentPage === totalPages - 1}
          style={{ ...btnStyle(false), width: 'auto', padding: '0 0.75rem', opacity: currentPage === totalPages - 1 ? 0.3 : 1, cursor: currentPage === totalPages - 1 ? 'default' : 'pointer', fontSize: '0.65rem' }}
          className="pagination-btn"
        >
          LAST
        </button>
      </div>
    </div>
  );
};

export default Pagination;
