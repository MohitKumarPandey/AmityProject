import React from 'react';
import type { Observation } from '../../types/observation';

interface DashboardHeroProps {
  loading: boolean;
  error: string | null;
  observations: Observation[];
  lastUpdated: Date | null;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ loading, error, observations, lastUpdated }) => {
  const total = observations.length;
  const updatedStr = lastUpdated ? lastUpdated.toLocaleTimeString() : '—';

  return (
    <section className="card-panel" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
        Environmental Intelligence
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Real-time environmental observations for smarter cities.
      </p>
      {loading && <p style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Updating data from live sensors...</p>}
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>Notice: {error}</p>}
      {!loading && (
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <div>
            <strong style={{ color: 'var(--primary)' }}>Observations:</strong> {total}
          </div>
          <div>
            <strong style={{ color: 'var(--primary)' }}>Last Updated:</strong> {updatedStr}
          </div>
        </div>
      )}
    </section>
  );
};
