import React, { useState, useEffect } from 'react';
import { fetchProviders } from '../api/client';
import type { Provider } from '../types/observation';
import { TopHeader } from '../components/layout/TopHeader';

export const DataSourcesPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetchProviders()
      .then(setProviders)
      .catch(() => setError('Unable to connect to provider telemetry services.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHeader title="Civic Data Sources & Ingestion System" onRefresh={load} apiConnected={!error} />

      <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--warning-light)', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Data Transparency & Provenance Policy
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            Real environmental data is fetched live from public APIs (Open-Meteo, OpenAQ, USGS). Internal simulated fallback feeds are explicitly labeled with the <span className="badge badge-info" style={{ display: 'inline-block' }}>SIMULATED</span> badge.
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Querying provider statuses...</div>
        ) : error ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--danger-light)', borderRadius: 'var(--radius-lg)', border: '1px solid #FCA5A5' }}>
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ marginBottom: '2rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Provider Name</th>
                  <th>Data Type</th>
                  <th>Status</th>
                  <th>Last Update Timestamp</th>
                  <th>Records (24h)</th>
                  <th>Data Provenance</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{p.data_type.replace('_', ' ')}</td>
                    <td>
                      <span className={`badge ${p.status === 'LIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {p.last_updated ? new Date(p.last_updated).toLocaleString() : 'No updates'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.record_count}</td>
                    <td>
                      <span className={`badge ${p.is_simulated ? 'badge-info' : 'badge-success'}`}>
                        {p.is_simulated ? 'SIMULATED' : 'LIVE PUBLIC API'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Configured Integration Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Open-Meteo Weather API</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live temperature, humidity, and atmospheric weather telemetry across monitored cities.</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>OpenAQ Air Quality Index API</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live PM2.5, PM10, and Air Quality Index telemetry.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesPage;
