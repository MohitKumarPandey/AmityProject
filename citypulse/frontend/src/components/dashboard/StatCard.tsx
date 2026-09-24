import React from 'react';

interface StatCardProps {
  title: string;
  value?: number | string | null;
  unit?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, unit = '', loading = false }) => {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      {loading ? (
        <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>Loading…</span>
      ) : (
        <div className="stat-value">
          {value != null && value !== 'N/A' ? `${value}${unit}` : 'N/A'}
        </div>
      )}
    </div>
  );
};
