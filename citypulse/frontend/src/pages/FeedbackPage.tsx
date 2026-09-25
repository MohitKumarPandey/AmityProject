import React, { useState, useEffect, useCallback } from 'react';
import { submitFeedback, fetchFeedbackHistory, fetchFeedbackMetrics } from '../api/client';
import type { FeedbackPayload } from '../types/observation';
import { TopHeader } from '../components/layout/TopHeader';

interface FeedbackItem {
  id: number;
  user_id?: number;
  feedback_type: string;
  predicted_severity?: string;
  actual_severity?: string;
  observed_features?: Record<string, any>;
  user_comment?: string;
  validation_status: string;
  created_at: string;
}

interface FeedbackMetrics {
  total_samples: number;
  severity_agreement_rate: number;
  prediction_accuracy: number;
  mean_absolute_error: number;
}

export const FeedbackPage: React.FC = () => {
  const [feedbackType, setFeedbackType] = useState('human_in_the_loop');
  const [predictedSeverity, setPredictedSeverity] = useState('MEDIUM');
  const [actualSeverity, setActualSeverity] = useState('MEDIUM');
  const [aqi, setAqi] = useState('');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const loadFeedbackData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [histData, metricData] = await Promise.all([
        fetchFeedbackHistory().catch(() => []),
        fetchFeedbackMetrics().catch(() => null),
      ]);
      setHistory(histData || []);
      setMetrics(metricData);
    } catch (err) {
      console.error('Failed to load feedback data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadFeedbackData();
  }, [loadFeedbackData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const observedFeatures: Record<string, number> = {};
    if (aqi) observedFeatures['aqi'] = parseFloat(aqi);
    if (temp) observedFeatures['temperature_c'] = parseFloat(temp);
    if (humidity) observedFeatures['humidity_percent'] = parseFloat(humidity);

    setSubmitting(true);
    const payload: FeedbackPayload = {
      feedback_type: feedbackType,
      predicted_severity: predictedSeverity,
      actual_severity: actualSeverity,
      observed_features: Object.keys(observedFeatures).length > 0 ? observedFeatures : undefined,
      user_comment: comment || undefined,
    };

    try {
      await submitFeedback(payload);
      setSuccessMsg('Ground-truth observation feedback recorded successfully in backend database!');
      setAqi('');
      setTemp('');
      setHumidity('');
      setComment('');
      loadFeedbackData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit feedback to backend endpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadgeClass = (severity?: string) => {
    if (!severity) return 'badge-neutral';
    const upper = severity.toUpperCase();
    if (upper === 'CRITICAL' || upper === 'HIGH') return 'badge-danger';
    if (upper === 'MEDIUM') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHeader title="Human-in-the-Loop Feedback Engine" />

      <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
          
          {/* MODEL PERFORMANCE METRICS */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
              MODEL EVALUATION & ACCURACY METRICS
            </h3>
            
            <div className="grid-cols-4">
              <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Feedback Samples</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {metrics ? metrics.total_samples : 0}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Severity Agreement Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {metrics ? `${metrics.severity_agreement_rate}%` : 'N/A'}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Validation Accuracy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                  {metrics ? `${metrics.prediction_accuracy}%` : 'N/A'}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mean Absolute Error</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {metrics ? metrics.mean_absolute_error : 0.0}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* SUBMISSION FORM */}
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Ground-Truth Telemetry Submission
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Submit verified real-world environmental feature values to continuously validate CityPulse ML models.
              </p>

              {successMsg && (
                <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Feedback Category</label>
                  <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)} className="form-input">
                    <option value="human_in_the_loop">Human-in-the-Loop Model Calibration</option>
                    <option value="alert_usefulness">Alert Usefulness & Severity Verification</option>
                    <option value="anomaly_validation">Anomaly Detection Verification</option>
                  </select>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">System Predicted Severity</label>
                    <select value={predictedSeverity} onChange={e => setPredictedSeverity(e.target.value)} className="form-input">
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Actual Observed Severity</label>
                    <select value={actualSeverity} onChange={e => setActualSeverity(e.target.value)} className="form-input">
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Observed Feature Measurements (Optional)
                  </div>

                  <div className="grid-cols-3">
                    <div className="form-group">
                      <label className="form-label">AQI</label>
                      <input type="number" step="any" value={aqi} onChange={e => setAqi(e.target.value)} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temp (°C)</label>
                      <input type="number" step="any" value={temp} onChange={e => setTemp(e.target.value)} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Humidity (%)</label>
                      <input type="number" step="any" value={humidity} onChange={e => setHumidity(e.target.value)} className="form-input" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observations / Notes</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Provide additional context regarding the observed environmental conditions..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? 'Submitting Feedback...' : 'Submit Ground-Truth Feedback'}
                </button>
              </form>
            </div>

            {/* FEEDBACK HISTORY */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Feedback Submission History
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Stored ground-truth observations recorded in the database.
              </p>

              {loadingData ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No feedback submissions recorded yet. Submit your first observation above!
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem' }}>Timestamp</th>
                        <th style={{ padding: '0.5rem' }}>Predicted</th>
                        <th style={{ padding: '0.5rem' }}>Actual</th>
                        <th style={{ padding: '0.5rem' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <span className={`badge ${getSeverityBadgeClass(item.predicted_severity)}`}>
                              {item.predicted_severity || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <span className={`badge ${getSeverityBadgeClass(item.actual_severity)}`}>
                              {item.actual_severity || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-main)' }}>
                            {item.user_comment || (item.observed_features ? JSON.stringify(item.observed_features) : '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
