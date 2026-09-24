import React, { useState } from 'react';
import { useObservations } from '../hooks/useObservations';
import { ObservationTable } from '../components/dashboard/ObservationTable';

export const ObservationsPage: React.FC = () => {
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  
  const { observations, loading, error, refresh } = useObservations(
    cityFilter !== 'All' ? cityFilter : undefined,
    typeFilter !== 'All' ? typeFilter : undefined,
    200
  );

  // unique cities from recent fetch + some defaults
  const uniqueCities = Array.from(new Set(observations.map((o) => o.city).filter(Boolean))).sort();
  if (uniqueCities.length > 0 && !uniqueCities.includes('All')) {
    uniqueCities.unshift('All');
  } else if (uniqueCities.length === 0) {
    uniqueCities.push('All', 'Jaipur', 'Delhi', 'Mumbai', 'London', 'New York');
  }

  return (
    <div className="observations-page" style={{ paddingBottom: '2rem' }}>
      <div className="dashboard-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>Observation Explorer</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Raw civic data points from all configured providers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="select-control"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            {Array.from(new Set(uniqueCities)).map((city) => (
              <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>
            ))}
          </select>
          <select
            className="select-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="weather">Weather</option>
            <option value="air_quality">Air Quality</option>
            <option value="transit">Transit</option>
            <option value="disaster">Disaster</option>
          </select>
          <button type="button" className="btn-primary" onClick={refresh}>Refresh</button>
        </div>
      </div>

      {loading && observations.length === 0 ? (
        <div className="dashboard-state" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '4px' }}></div>
        </div>
      ) : error ? (
        <div className="dashboard-state" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Failed to load observations</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <button type="button" className="btn-primary" onClick={refresh}>Retry Connection</button>
        </div>
      ) : observations.length === 0 ? (
        <div className="dashboard-state" style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-color-subtle)' }}>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>No observations available</h2>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or triggering an ingestion cycle.</p>
        </div>
      ) : (
        <div className="card-panel">
          <ObservationTable observations={observations} />
        </div>
      )}
    </div>
  );
};

export default ObservationsPage;
