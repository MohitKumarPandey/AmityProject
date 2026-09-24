import React from 'react';
import type { Observation } from '../../types/observation';

interface ObservationTableProps {
  observations: Observation[];
}

export const ObservationTable: React.FC<ObservationTableProps> = ({ observations }) => {
  if (!observations || observations.length === 0) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No telemetry observations recorded for the selected filter.</p>
      </div>
    );
  }

  const sorted = [...observations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>City</th>
            <th>Data Type</th>
            <th>Metric / Reading</th>
            <th>Timestamp</th>
            <th>Provider Source</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((obs) => (
            <tr key={obs.id}>
              <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{obs.city || '—'}</td>
              <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{obs.data_type || 'environmental'}</td>
              <td>
                {obs.temperature_c != null && <span style={{ marginRight: '0.75rem' }}>🌡 {obs.temperature_c} °C</span>}
                {obs.humidity_percent != null && <span style={{ marginRight: '0.75rem' }}>💧 {obs.humidity_percent}%</span>}
                {obs.aqi != null && (
                  <span className={`badge ${obs.aqi <= 50 ? 'badge-success' : obs.aqi <= 100 ? 'badge-warning' : 'badge-danger'}`}>
                    AQI {obs.aqi}
                  </span>
                )}
                {obs.metric && obs.value != null && <span>{obs.metric}: {obs.value} {obs.unit || ''}</span>}
                {obs.temperature_c == null && obs.humidity_percent == null && obs.aqi == null && !obs.metric && '—'}
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(obs.timestamp).toLocaleString()}</td>
              <td style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.825rem' }}>{obs.source}</td>
              <td>
                <span className={`badge ${obs.is_simulated ? 'badge-info' : 'badge-success'}`}>
                  {obs.is_simulated ? 'SIMULATED' : 'LIVE PUBLIC'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
