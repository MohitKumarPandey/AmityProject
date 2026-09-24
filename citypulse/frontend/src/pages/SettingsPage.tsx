import React, { useState, useEffect } from 'react';
import { fetchPreferences, updatePreferences } from '../api/client';
import type { UserPreferences } from '../types/observation';
import { TopHeader } from '../components/layout/TopHeader';

export const SettingsPage: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    home_city: 'Jaipur',
    home_zone: 'Central',
    alert_radius_km: 50.0,
    alert_preferences: { weather: true, air_quality: true, disaster: true }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchPreferences()
      .then(res => { if (res) setPrefs(res); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updatePreferences(prefs);
      setMsg('User alert preferences saved successfully.');
    } catch {
      setMsg('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHeader title="User Alert Preferences & Settings" />

      <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Personalized Alert Configuration
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Set your home city and geospatial alert radius to receive relevant proximity disaster alerts.
            </p>

            {msg && (
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                {msg}
              </div>
            )}

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading preferences...</div>
            ) : (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Home City</label>
                    <select
                      value={prefs.home_city}
                      onChange={e => setPrefs({ ...prefs, home_city: e.target.value })}
                      className="form-input"
                    >
                      <option value="Jaipur">Jaipur</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="London">London</option>
                      <option value="New York">New York</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Geospatial Alert Radius (km)</label>
                    <input
                      type="number"
                      value={prefs.alert_radius_km}
                      onChange={e => setPrefs({ ...prefs, alert_radius_km: parseFloat(e.target.value) || 50 })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    System Configuration
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Backend Base API URL: <code>{import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}</code>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%' }}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
