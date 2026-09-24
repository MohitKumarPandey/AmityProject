import React from 'react';

interface TopHeaderProps {
  onToggleMobileMenu?: () => void;
  apiConnected?: boolean;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  onRefresh?: () => void;
  title?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  apiConnected = true,
  selectedCity = 'All',
  onCityChange,
  onRefresh,
  title = 'Civic Intelligence Platform'
}) => {
  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onToggleMobileMenu && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            style={{ padding: '0.4rem 0.6rem' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-controls">
        {onCityChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>City:</span>
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="city-select-dropdown"
            >
              <option value="All">All Monitored Cities</option>
              <option value="Delhi">Delhi</option>
              <option value="Jaipur">Jaipur</option>
              <option value="Mumbai">Mumbai</option>
              <option value="London">London</option>
              <option value="New York">New York</option>
            </select>
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        )}

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: apiConnected ? 'var(--success-light)' : 'var(--danger-light)',
          color: apiConnected ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${apiConnected ? '#A7F3D0' : '#FCA5A5'}`
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: apiConnected ? 'var(--success)' : 'var(--danger)'
          }} />
          {apiConnected ? 'API Connected' : 'Disconnected'}
        </div>
      </div>
    </header>
  );
};
