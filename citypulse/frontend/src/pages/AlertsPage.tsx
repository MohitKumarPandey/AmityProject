import React, { useState, useEffect, useCallback } from 'react';
import { fetchAlerts, fetchUnreadCount, markAlertRead, markAllRead, submitFeedback } from '../api/client';
import type { Alert, FeedbackPayload } from '../types/observation';
import { TopHeader } from '../components/layout/TopHeader';

const getSeverityBadgeClass = (severity: string) => {
  const s = severity?.toUpperCase();
  if (s === 'CRITICAL' || s === 'HIGH') return 'badge-danger';
  if (s === 'MEDIUM') return 'badge-warning';
  return 'badge-success';
};

const FeedbackForm: React.FC<{ alert: Alert; onClose: () => void }> = ({ alert, onClose }) => {
  const [severityRating, setSeverityRating] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload: FeedbackPayload = {
      alert_id: alert.id,
      feedback_type: 'alert_usefulness',
      predicted_severity: alert.severity,
      actual_severity: severityRating || undefined,
      user_comment: comment || undefined,
    };

    try {
      await submitFeedback(payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '1rem', background: 'var(--success-light)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Thank you!</div>
        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Your feedback has been submitted to validate future ML alerts.</div>
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Submit Alert Feedback</div>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</div>}
      
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="form-label" style={{ fontSize: '0.775rem' }}>Was the alert severity accurate?</label>
        <select value={severityRating} onChange={e => setSeverityRating(e.target.value)} className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
          <option value="">Select severity evaluation...</option>
          <option value="ACCURATE">Accurate</option>
          <option value="TOO_HIGH">Too High (Over-alerted)</option>
          <option value="TOO_LOW">Too Low (Under-alerted)</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="form-label" style={{ fontSize: '0.775rem' }}>Comments / Ground-Truth Observation</label>
        <textarea
          className="form-input"
          placeholder="Describe ground-truth conditions..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ height: '60px', padding: '0.4rem', fontSize: '0.8rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}>
          Cancel
        </button>
      </div>
    </form>
  );
};

const AlertCard: React.FC<{ alert: Alert; onRead: () => void }> = ({ alert, onRead }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleCardClick = async () => {
    if (!alert.is_read) {
      await markAlertRead(alert.id);
      onRead();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="card"
      style={{
        cursor: 'pointer',
        borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? 'var(--danger)' : alert.severity === 'HIGH' ? 'var(--warning)' : 'var(--primary)'}`,
        background: alert.is_read ? 'var(--bg-card)' : 'var(--primary-light)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`badge ${getSeverityBadgeClass(alert.severity)}`}>
            {alert.severity}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {alert.alert_type.replace('_', ' ')}
          </span>
        </div>
        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          {new Date(alert.created_at).toLocaleString()}
        </span>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
        {alert.title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
        {alert.message}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div>
          <span>From: {alert.source_city}</span>
          {alert.distance_km > 0 && <span style={{ marginLeft: '0.75rem' }}>Distance: ~{Math.round(alert.distance_km)} km</span>}
        </div>
        <button
          className="btn-secondary"
          onClick={(e) => { e.stopPropagation(); setShowFeedback(!showFeedback); }}
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        >
          {showFeedback ? 'Hide Feedback' : 'Provide Feedback'}
        </button>
      </div>

      {showFeedback && (
        <div onClick={(e) => e.stopPropagation()}>
          <FeedbackForm alert={alert} onClose={() => setShowFeedback(false)} />
        </div>
      )}
    </div>
  );
};

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [alertData, countData] = await Promise.all([
        fetchAlerts(filter === 'unread'),
        fetchUnreadCount(),
      ]);
      setAlerts(alertData);
      setUnreadCount(countData.unread_count);
    } catch {
      setError('Unable to load alerts. Please verify authentication state.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHeader title="Disaster & Civic Alerts" onRefresh={load} apiConnected={!error} />

      <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Alert Feed
              {unreadCount > 0 && <span className="badge badge-danger">{unreadCount} unread</span>}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Personalized disaster and proximity environmental alerts</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="city-select-dropdown"
            >
              <option value="all">All Alerts</option>
              <option value="unread">Unread Only</option>
            </select>
            {unreadCount > 0 && (
              <button className="btn-secondary" onClick={handleMarkAllRead}>Mark All Read</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading alerts...</div>
        ) : error ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--danger-light)', borderRadius: 'var(--radius-lg)', border: '1px solid #FCA5A5' }}>
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No alerts found for the current filter settings.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} onRead={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
