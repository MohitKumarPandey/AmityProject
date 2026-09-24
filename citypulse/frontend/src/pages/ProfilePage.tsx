import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchPreferences, updatePreferences } from '../api/client';
import type { UserPreferences } from '../types/observation';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>({
    home_city: 'Jaipur',
    home_zone: 'Central',
    latitude: null,
    longitude: null,
    alert_radius_km: 50,
    alert_preferences: {
      disaster: true, weather: true, air_quality: true, traffic: true, anomaly: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPreferences()
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await updatePreferences(prefs);
      setSuccess('Preferences saved successfully.');
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAlertPref = (key: string) => {
    setPrefs(prev => ({
      ...prev,
      alert_preferences: {
        ...prev.alert_preferences,
        [key]: !prev.alert_preferences[key],
      },
    }));
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="dashboard-controls">
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>Profile & Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage your account and alert preferences.
          </p>
        </div>
      </div>

      {/* Account info */}
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">Account</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="info-row">
            <span className="info-label">Full Name</span>
            <span className="info-value">{user?.full_name || '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{user?.email || '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Member Since</span>
            <span className="info-value">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
        <button
          className="btn-secondary"
          style={{ marginTop: '1.25rem' }}
          onClick={logout}
        >
          Sign Out
        </button>
      </div>

      {/* Preferences form */}
      {loading ? (
        <div className="dashboard-state"><h2>Loading preferences...</h2></div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title">Location & Alert Radius</h2>

            {success && <div className="auth-success" style={{ marginBottom: '1rem' }}>{success}</div>}
            {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Home City</label>
                <input
                  id="pref-home-city"
                  type="text"
                  className="form-input"
                  value={prefs.home_city}
                  onChange={e => setPrefs(p => ({ ...p, home_city: e.target.value }))}
                  placeholder="e.g. Jaipur"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Home Zone</label>
                <input
                  id="pref-home-zone"
                  type="text"
                  className="form-input"
                  value={prefs.home_zone}
                  onChange={e => setPrefs(p => ({ ...p, home_zone: e.target.value }))}
                  placeholder="e.g. Central"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Latitude (optional)</label>
                <input
                  id="pref-lat"
                  type="number"
                  step="any"
                  className="form-input"
                  value={prefs.latitude ?? ''}
                  onChange={e => setPrefs(p => ({ ...p, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="e.g. 26.9124"
                  min={-90}
                  max={90}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude (optional)</label>
                <input
                  id="pref-lon"
                  type="number"
                  step="any"
                  className="form-input"
                  value={prefs.longitude ?? ''}
                  onChange={e => setPrefs(p => ({ ...p, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="e.g. 75.7873"
                  min={-180}
                  max={180}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">
                Alert Radius: <strong style={{ color: 'var(--primary)' }}>{prefs.alert_radius_km} km</strong>
              </label>
              <input
                id="pref-radius"
                type="range"
                min={5}
                max={500}
                step={5}
                value={prefs.alert_radius_km}
                onChange={e => setPrefs(p => ({ ...p, alert_radius_km: parseFloat(e.target.value) }))}
                style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                <span>5 km</span><span>500 km</span>
              </div>
            </div>
          </div>

          <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title">Alert Preferences</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Select which types of alerts you want to receive.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'disaster', label: 'Disaster / Emergency Events', desc: 'Floods, earthquakes, fires, storms' },
                { key: 'weather', label: 'Weather Alerts', desc: 'Extreme temperature, wind, storms' },
                { key: 'air_quality', label: 'Air Quality Alerts', desc: 'AQI anomalies and PM2.5 spikes' },
                { key: 'traffic', label: 'Traffic / Transit Alerts', desc: 'Significant delays and incidents' },
                { key: 'anomaly', label: 'Anomaly Alerts', desc: 'Statistical anomalies detected by system' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className={`pref-toggle ${prefs.alert_preferences[key] ? 'enabled' : ''}`}
                  onClick={() => toggleAlertPref(key)}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  <div className={`toggle-pill ${prefs.alert_preferences[key] ? 'on' : 'off'}`}>
                    {prefs.alert_preferences[key] ? 'ON' : 'OFF'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button id="save-prefs" type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
