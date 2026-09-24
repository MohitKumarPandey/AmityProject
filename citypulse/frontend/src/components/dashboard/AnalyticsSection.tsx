import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Observation } from '../../types/observation';

interface AnalyticsSectionProps {
  observations: Observation[];
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ observations }) => {
  const chartData = useMemo(() => {
    return observations
      .map((o) => ({
        timestamp: new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTime: new Date(o.timestamp).getTime(),
        city: o.city,
        temperature: o.temperature_c ?? null,
        humidity: o.humidity_percent ?? null,
        aqi: o.aqi ?? null,
      }))
      .filter((d) => d.temperature !== null || d.humidity !== null || d.aqi !== null)
      .sort((a, b) => a.rawTime - b.rawTime);
  }, [observations]);

  const hasTemp = chartData.some((d) => d.temperature !== null);
  const hasHum = chartData.some((d) => d.humidity !== null);
  const hasAqi = chartData.some((d) => d.aqi !== null);

  if (chartData.length < 2) {
    return (
      <div className="card-panel">
        <h2 className="section-title">Environmental Trends</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Not enough historical observations for trend analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="card-panel">
      <h2 className="section-title">Environmental Trends & Analytics</h2>
      <div style={{ width: '100%', height: 320, marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="timestamp" stroke="var(--text-dim)" fontSize={12} />
            <YAxis stroke="var(--text-dim)" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--text-muted)' }} />
            {hasTemp && (
              <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} />
            )}
            {hasHum && (
              <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {hasAqi && (
              <Line type="monotone" dataKey="aqi" name="AQI" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
