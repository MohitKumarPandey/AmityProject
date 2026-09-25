import React, { useEffect, useState, useCallback } from 'react';
import { fetchCivicPulse } from '../api/client';
import type { CivicPulse } from '../types/observation';
import { MapPanel } from '../components/dashboard/MapPanel';
import { useObservations } from '../hooks/useObservations';
import { TopHeader } from '../components/layout/TopHeader';

export const Dashboard: React.FC = () => {
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [pulse, setPulse] = useState<CivicPulse | null>(null);
  const [loadingPulse, setLoadingPulse] = useState(true);
  const [pulseError, setPulseError] = useState('');

  const { observations, normalized, loading: obsLoading, error: obsError, refresh: refreshObs, lastUpdated } = useObservations(cityFilter);

  const loadPulse = useCallback(async () => {
    setLoadingPulse(true);
    setPulseError('');
    try {
      const data = await fetchCivicPulse(cityFilter === 'All' ? undefined : cityFilter);
      setPulse(data);
    } catch (e: any) {
      setPulseError(e.response?.data?.detail || e.message || 'Unable to connect to CityPulse API services.');
    } finally {
      setLoadingPulse(false);
    }
  }, [cityFilter]);

  useEffect(() => {
    loadPulse();
  }, [loadPulse]);

  const handleRefresh = () => {
    refreshObs();
    loadPulse();
  };

  const getStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('good') || lower.includes('clear') || lower.includes('normal') || lower.includes('healthy')) return 'badge-success';
    if (lower.includes('moderate') || lower.includes('watch') || lower.includes('anomalies')) return 'badge-warning';
    return 'badge-danger';
  };

  const loading = loadingPulse || obsLoading;
  const error = pulseError || obsError;
  
  const currentCityData = cityFilter === 'All' 
    ? (Object.values(normalized).sort((a,b) => new Date(b.latest_timestamp).getTime() - new Date(a.latest_timestamp).getTime())[0] || null)
    : normalized[cityFilter];

  const latestValidTemp = currentCityData?.temperature_c;
  const latestValidAqi = currentCityData?.aqi;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHeader
        title="Civic Intelligence Dashboard"
        selectedCity={cityFilter}
        onCityChange={setCityFilter}
        onSelectLocation={setSelectedLocation}
        onRefresh={handleRefresh}
        refreshing={loading}
        apiConnected={!error}
      />

      <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
        {loading && (!pulse || observations.length === 0) ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Loading live civic telemetry...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--danger-light)', borderRadius: 'var(--radius-lg)', border: '1px solid #FCA5A5' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Unable to connect to CityPulse services</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>
            <button className="btn-primary" onClick={handleRefresh}>Retry Connection</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* CIVIC PULSE BANNER */}
            {pulse && pulse.status !== 'insufficient_data' && (
              <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>CIVIC PULSE SUMMARY</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on {pulse.observation_count} recent telemetry observations in {cityFilter}</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'now'}</span>
                </div>

                <div className="grid-cols-4">
                  <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Air Quality</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${getStatusBadge(pulse.dimensions.air_quality.status)}`}>
                        {pulse.dimensions.air_quality.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{pulse.dimensions.air_quality.explanation}</div>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Weather Conditions</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${getStatusBadge(pulse.dimensions.weather.status)}`}>
                        {pulse.dimensions.weather.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{pulse.dimensions.weather.explanation}</div>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Disaster Emergency</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${getStatusBadge(pulse.dimensions.emergency.status)}`}>
                        {pulse.dimensions.emergency.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{pulse.dimensions.emergency.explanation}</div>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Infrastructure</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${getStatusBadge(pulse.dimensions.infrastructure.status)}`}>
                        {pulse.dimensions.infrastructure.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{pulse.dimensions.infrastructure.explanation}</div>
                  </div>
                </div>
              </div>
            )}

            {/* KPI GRID */}
            <div className="grid-cols-4">
              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>Current Air Quality (AQI)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {latestValidAqi !== undefined ? latestValidAqi : 'N/A'}
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>Current Temperature</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {latestValidTemp !== undefined ? `${latestValidTemp} °C` : 'N/A'}
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>Active Civic Events</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {pulse?.dimensions.emergency.active_events !== undefined ? pulse.dimensions.emergency.active_events : 0}
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>Unread Alerts</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {pulse?.alerts_unread !== undefined ? pulse.alerts_unread : 0}
                </div>
              </div>
            </div>

            {/* MAP SECTION */}
            <div className="card" style={{ height: '480px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                LIVE GEOSPATIAL MAP — TELEMETRY & ALERTS
              </div>
              <div style={{ flex: 1, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <MapPanel
                  normalizedData={normalized}
                  selectedCity={cityFilter}
                  selectedLocation={selectedLocation}
                  observations={observations}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;