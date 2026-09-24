import React from 'react';
import type { Observation } from '../../types/observation';

interface ObservationListProps {
  observations: Observation[];
}

export const ObservationList: React.FC<ObservationListProps> = ({ observations }) => {
  if (!observations || observations.length === 0) {
    return (
      <div className="card-panel">
        <h2 className="section-title">Live Observation Feed</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No observations available.</p>
      </div>
    );
  }

  // Show newest observations first
  const recent = [...observations]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return (
    <div className="card-panel">
      <h2 className="section-title">
        <span>Live Observation Feed</span>
        <span className="metric-pill">Real-time</span>
      </h2>
      <ul className="observation-feed-list">
        {recent.map((obs) => (
          <li key={obs.id} className="observation-feed-item">
            <div className="obs-header">
              <span className="obs-city">{obs.city || 'Unknown'}</span>
              <span className="obs-time">{new Date(obs.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="obs-metrics">
              {obs.temperature_c != null && (
                <span>Temp: <strong>{obs.temperature_c}°C</strong></span>
              )}
              {obs.humidity_percent != null && (
                <span>Humidity: <strong>{obs.humidity_percent}%</strong></span>
              )}
              {obs.aqi != null && (
                <span>AQI: <strong>{obs.aqi}</strong></span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {obs.source}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
