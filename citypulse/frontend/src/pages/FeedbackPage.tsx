import React, { useState } from 'react';
import { submitFeedback } from '../api/client';
import type { FeedbackPayload } from '../types/observation';
import { TopHeader } from '../components/layout/TopHeader';

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
      user_comment: comment || undefined
    };

    try {
      await submitFeedback(payload);
      setSuccessMsg('Ground-truth observation feedback recorded successfully. Thank you!');
      setAqi('');
      setTemp('');
      setHumidity('');
      setComment('');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit feedback to model endpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopHeader title="Human-in-the-Loop Feedback Engine" />

      <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Ground-Truth Telemetry Submission
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Submit verified real-world environmental feature values to help continuously evaluate and validate CityPulse ML prediction models.
            </p>

            {successMsg && (
              <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Observed Feature Measurements (Optional)
                </div>

                <div className="grid-cols-4">
                  <div className="form-group">
                    <label className="form-label">AQI</label>
                    <input type="number" placeholder="85" value={aqi} onChange={e => setAqi(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temp (°C)</label>
                    <input type="number" placeholder="28.5" value={temp} onChange={e => setTemp(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Humidity (%)</label>
                    <input type="number" placeholder="65" value={humidity} onChange={e => setHumidity(e.target.value)} className="form-input" />
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
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
