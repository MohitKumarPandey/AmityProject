import React, { useState, useEffect } from 'react';
import { useObservations } from '../hooks/useObservations';
import { fetchCities, createObservation, deleteObservation } from '../api/client';
import type { Observation } from '../types/observation';
import { TopHeader } from '../components/layout/TopHeader';

export const ObservationsPage: React.FC = () => {
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creation
  const [newCity, setNewCity] = useState('');
  const [newDataType, setNewDataType] = useState('weather');
  const [newTemp, setNewTemp] = useState('');
  const [newAqi, setNewAqi] = useState('');
  const [newHumidity, setNewHumidity] = useState('');
  const [newSeverity, setNewSeverity] = useState('NORMAL');
  const [creating, setCreating] = useState(false);

  const { observations, loading, error, refresh } = useObservations(
    cityFilter !== 'All' ? cityFilter : undefined,
    typeFilter !== 'All' ? typeFilter : undefined,
    300
  );

  useEffect(() => {
    fetchCities().then((cities) => {
      setAvailableCities(cities || []);
    }).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) return;

    setCreating(true);
    try {
      await createObservation({
        city: newCity.trim(),
        data_type: newDataType,
        temperature_c: newTemp ? parseFloat(newTemp) : undefined,
        aqi: newAqi ? parseFloat(newAqi) : undefined,
        humidity_percent: newHumidity ? parseFloat(newHumidity) : undefined,
        severity: newSeverity,
      });

      setShowCreateModal(false);
      setNewCity('');
      setNewTemp('');
      setNewAqi('');
      setNewHumidity('');
      refresh();
    } catch (err) {
      console.error('Failed to create observation:', err);
      alert('Failed to save observation.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this observation?')) return;
    try {
      await deleteObservation(id);
      setSelectedObs(null);
      refresh();
    } catch (err) {
      console.error('Failed to delete observation:', err);
      alert('Failed to delete observation.');
    }
  };

  // Filter observations locally by search and severity
  const filtered = observations.filter((obs) => {
    if (severityFilter !== 'All' && (obs.severity || 'NORMAL').toUpperCase() !== severityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCity = (obs.city || '').toLowerCase().includes(q);
      const matchSource = (obs.source || '').toLowerCase().includes(q);
      const matchType = (obs.data_type || '').toLowerCase().includes(q);
      if (!matchCity && !matchSource && !matchType) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity?: string) => {
    const s = (severity || 'NORMAL').toUpperCase();
    if (s.includes('CRITICAL') || s.includes('HIGH') || s.includes('ALERT')) return 'badge-danger';
    if (s.includes('MODERATE') || s.includes('WARNING')) return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHeader
        title="Observation Explorer & Telemetry Manager"
        selectedCity={cityFilter}
        onCityChange={setCityFilter}
        onRefresh={refresh}
        refreshing={loading}
        apiConnected={!error}
      />

      <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* HEADER CONTROLS */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Live Telemetry Observations ({filtered.length})
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                View, filter, and log real civic telemetry readings.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search city, source, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  fontSize: '0.85rem',
                  width: '200px'
                }}
              />

              <select
                className="select-control"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.6rem' }}
              >
                <option value="All">All Cities</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                className="select-control"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.6rem' }}
              >
                <option value="All">All Types</option>
                <option value="weather">Weather</option>
                <option value="air_quality">Air Quality</option>
                <option value="transit">Transit</option>
                <option value="disaster">Disaster</option>
              </select>

              <select
                className="select-control"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.6rem' }}
              >
                <option value="All">All Severities</option>
                <option value="NORMAL">NORMAL</option>
                <option value="MODERATE">MODERATE</option>
                <option value="HIGH">HIGH / ALERT</option>
              </select>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                + Log Reading
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          {loading && observations.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading telemetry observations...
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--danger-light)', border: '1px solid #FCA5A5' }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Unable to load observations</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
              <button className="btn-primary" onClick={refresh}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No environmental measurements are available for this location and filter selection.
            </div>
          ) : (
            <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Severity</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Temperature</th>
                    <th style={{ padding: '0.75rem 1rem' }}>AQI</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Humidity</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Source</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((obs) => (
                    <tr key={obs.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#{obs.id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>{obs.city}</td>
                      <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{obs.data_type}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${getSeverityBadge(obs.severity)}`}>
                          {(obs.severity || 'NORMAL').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {obs.temperature_c !== null && obs.temperature_c !== undefined ? `${obs.temperature_c} °C` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {obs.aqi !== null && obs.aqi !== undefined ? obs.aqi : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {obs.humidity_percent !== null && obs.humidity_percent !== undefined ? `${obs.humidity_percent}%` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{obs.source || 'OpenWeather'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {obs.timestamp ? new Date(obs.timestamp).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedObs(obs)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: '0.4rem' }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(obs.id)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #FCA5A5', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* VIEW MODAL */}
      {selectedObs && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Observation Details #{selectedObs.id}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div><strong>Location:</strong> {selectedObs.city}</div>
              <div><strong>Data Type:</strong> {selectedObs.data_type}</div>
              <div><strong>Severity:</strong> {selectedObs.severity || 'NORMAL'}</div>
              <div><strong>Temperature:</strong> {selectedObs.temperature_c ?? 'N/A'} °C</div>
              <div><strong>AQI:</strong> {selectedObs.aqi ?? 'N/A'}</div>
              <div><strong>Humidity:</strong> {selectedObs.humidity_percent ?? 'N/A'} %</div>
              <div><strong>Source:</strong> {selectedObs.source}</div>
              <div><strong>Coordinates:</strong> {selectedObs.latitude ?? 'N/A'}, {selectedObs.longitude ?? 'N/A'}</div>
              <div><strong>Timestamp:</strong> {selectedObs.timestamp ? new Date(selectedObs.timestamp).toLocaleString() : 'N/A'}</div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setSelectedObs(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Log New Telemetry Reading
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jaipur"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Data Type</label>
                  <select value={newDataType} onChange={(e) => setNewDataType(e.target.value)} className="form-input">
                    <option value="weather">Weather</option>
                    <option value="air_quality">Air Quality</option>
                    <option value="disaster">Disaster</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} className="form-input">
                    <option value="NORMAL">NORMAL</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Temp (°C)</label>
                  <input type="number" step="any" placeholder="25.0" value={newTemp} onChange={(e) => setNewTemp(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">AQI</label>
                  <input type="number" step="any" placeholder="60" value={newAqi} onChange={(e) => setNewAqi(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Humidity (%)</label>
                  <input type="number" step="any" placeholder="50" value={newHumidity} onChange={(e) => setNewHumidity(e.target.value)} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Saving...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationsPage;
