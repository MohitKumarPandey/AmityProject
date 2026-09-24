import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

import {
  fetchTrends,
  fetchCivicPulse,
  fetchSummary,
  fetchCorrelations,
  fetchAnomalies,
} from '../api/client';

import type {
  CivicPulse,
  AnalyticsSummary,
  CorrelationResult,
  Anomaly,
} from '../types/observation';

import { TopHeader } from '../components/layout/TopHeader';

type TrendPoint = {
  time: string;
  temperature: number | null;
  aqi: number | null;
  humidity: number | null;
};

const DEFAULT_CITY = 'All';

export const AnalyticsPage: React.FC = () => {
  const [city, setCity] = useState(DEFAULT_CITY);

  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [pulse, setPulse] = useState<CivicPulse | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const targetCity = city === DEFAULT_CITY ? undefined : city;

    try {
      const [
        trendResponse,
        pulseResponse,
        summaryResponse,
        correlationResponse,
        anomalyResponse,
      ] = await Promise.all([
        fetchTrends(targetCity, 48),
        fetchCivicPulse(targetCity),
        fetchSummary(targetCity),

        fetchCorrelations(targetCity).catch(
          () => [] as CorrelationResult[]
        ),

        fetchAnomalies(targetCity).catch(
          () => [] as Anomaly[]
        ),
      ]);

      const chartData: TrendPoint[] = (trendResponse ?? []).map(
        (observation: any) => ({
          time: observation.timestamp
            ? new Date(observation.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--',

          temperature:
            typeof observation.temperature_c === 'number'
              ? observation.temperature_c
              : null,

          aqi:
            typeof observation.aqi === 'number'
              ? observation.aqi
              : null,

          humidity:
            typeof observation.humidity_percent === 'number'
              ? observation.humidity_percent
              : null,
        })
      );

      setTrends(chartData);
      setPulse(pulseResponse ?? null);
      setSummary(summaryResponse ?? null);
      setCorrelations(correlationResponse ?? []);
      setAnomalies(anomalyResponse ?? []);
    } catch (err) {
      console.error('Analytics loading failed:', err);

      setError(
        'Analytics data could not be loaded from the backend.'
      );

      setTrends([]);
      setPulse(null);
      setSummary(null);
      setCorrelations([]);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCityChange = (selectedCity: string) => {
    setCity(selectedCity);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <TopHeader
        title="Civic Analytics & Predictive Engine"
        selectedCity={city}
        onCityChange={handleCityChange}
        onRefresh={load}
        apiConnected={!error}
      />

      <div
        style={{
          padding: '1.75rem 2rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={load}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* SUMMARY */}

            {summary && (
              <div
                className="card"
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid #BFDBFE',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'var(--primary)',
                    marginBottom: '0.4rem',
                  }}
                >
                  CIVIC ANALYTICS SUMMARY
                </div>

                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                  }}
                >
                  {summary.summary}
                </div>
              </div>
            )}

            {/* CIVIC PULSE */}

            {pulse && (
              <div className="grid-cols-2">
                <MetricCard
                  title="Civic Pulse"
                  value={getPulseValue(pulse)}
                  description="Current civic/environmental signal"
                />

                <MetricCard
                  title="Selected Area"
                  value={
                    city === DEFAULT_CITY
                      ? 'All Cities'
                      : city
                  }
                  description="Analytics scope"
                />
              </div>
            )}

            {/* CHARTS */}

            <div className="grid-cols-2">
              {/* TEMPERATURE + AQI */}

              <div
                className="card"
                style={{
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    marginBottom: '1rem',
                  }}
                >
                  Environmental Trends
                </div>

                {trends.length === 0 ? (
                  <EmptyState text="No recent trend data available." />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      width: '100%',
                      minHeight: 0,
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart data={trends}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E2E8F0"
                        />

                        <XAxis
                          dataKey="time"
                          stroke="#64748B"
                          fontSize={12}
                        />

                        <YAxis
                          stroke="#64748B"
                          fontSize={12}
                        />

                        <Tooltip />

                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="temperature"
                          name="Temperature (°C)"
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />

                        <Line
                          type="monotone"
                          dataKey="aqi"
                          name="AQI"
                          stroke="#DC2626"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* HUMIDITY */}

              <div
                className="card"
                style={{
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    marginBottom: '1rem',
                  }}
                >
                  Relative Humidity Trend
                </div>

                {trends.length === 0 ? (
                  <EmptyState text="No humidity observations available." />
                ) : (
                  <div
                    style={{
                      flex: 1,
                      width: '100%',
                      minHeight: 0,
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={trends}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E2E8F0"
                        />

                        <XAxis
                          dataKey="time"
                          stroke="#64748B"
                          fontSize={12}
                        />

                        <YAxis
                          stroke="#64748B"
                          fontSize={12}
                        />

                        <Tooltip />

                        <Bar
                          dataKey="humidity"
                          name="Humidity (%)"
                          fill="#06B6D4"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* ANOMALIES + CORRELATIONS */}

            <div className="grid-cols-2">
              {/* ANOMALIES */}

              <div className="card">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Detected Telemetry Anomalies
                </div>

                {anomalies.length === 0 ? (
                  <EmptyState
                    text="No statistical anomalies detected in the available data."
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    {anomalies.map((anomaly) => (
                      <div
                        key={anomaly.id}
                        style={{
                          padding: '0.75rem',
                          background: 'var(--bg-main)',
                          borderRadius: 'var(--radius-md)',
                          border:
                            '1px solid var(--border-color)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          <span>
                            {anomaly.city} —{' '}
                            {anomaly.data_type}
                          </span>

                          <span className="badge badge-warning">
                            {anomaly.severity}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '0.775rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.35rem',
                          }}
                        >
                          Score:{' '}
                          {typeof anomaly.score === 'number'
                            ? anomaly.score.toFixed(2)
                            : 'N/A'}
                          {' | '}
                          Detected:{' '}
                          {anomaly.detected_at
                            ? new Date(
                                anomaly.detected_at
                              ).toLocaleTimeString()
                            : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CORRELATIONS */}

              <div className="card">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Feature Correlations
                </div>

                {correlations.length === 0 ? (
                  <EmptyState
                    text="Insufficient real observations to compute correlations."
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    {correlations.map((correlation) => (
                      <div
                        key={correlation.id}
                        style={{
                          padding: '0.75rem',
                          background: 'var(--bg-main)',
                          borderRadius: 'var(--radius-md)',
                          border:
                            '1px solid var(--border-color)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                          }}
                        >
                          {correlation.feature_a} ↔{' '}
                          {correlation.feature_b}
                          {' (r = '}
                          {typeof correlation.correlation_coefficient ===
                          'number'
                            ? correlation.correlation_coefficient.toFixed(
                                2
                              )
                            : 'N/A'}
                          {')'}
                        </div>

                        <div
                          style={{
                            fontSize: '0.775rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.25rem',
                          }}
                        >
                          {correlation.interpretation ||
                            'No interpretation available.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   HELPER COMPONENTS
========================================================= */

const LoadingState: React.FC = () => (
  <div
    style={{
      padding: '4rem 2rem',
      textAlign: 'center',
      color: 'var(--text-muted)',
    }}
  >
    <div
      style={{
        fontSize: '1rem',
        fontWeight: 600,
        marginBottom: '0.4rem',
      }}
    >
      Loading civic analytics...
    </div>

    <div style={{ fontSize: '0.875rem' }}>
      Fetching real telemetry and calculating trends.
    </div>
  </div>
);

const ErrorState: React.FC<{
  message: string;
  onRetry: () => void;
}> = ({ message, onRetry }) => (
  <div
    style={{
      padding: '2.5rem',
      textAlign: 'center',
      background: 'var(--danger-light)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid #FCA5A5',
    }}
  >
    <div
      style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--danger)',
        marginBottom: '0.5rem',
      }}
    >
      Analytics unavailable
    </div>

    <p
      style={{
        margin: 0,
        color: 'var(--danger)',
        fontSize: '0.875rem',
      }}
    >
      {message}
    </p>

    <button
      type="button"
      onClick={onRetry}
      style={{
        marginTop: '1rem',
        padding: '0.6rem 1rem',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        background: 'var(--primary)',
        color: '#FFFFFF',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Retry
    </button>
  </div>
);

const EmptyState: React.FC<{
  text: string;
}> = ({ text }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.875rem',
      padding: '1rem',
    }}
  >
    {text}
  </div>
);

const MetricCard: React.FC<{
  title: string;
  value: string;
  description: string;
}> = ({ title, value, description }) => (
  <div className="card">
    <div
      style={{
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: '0.4rem',
      }}
    >
      {title}
    </div>

    <div
      style={{
        fontSize: '1.4rem',
        fontWeight: 700,
        color: 'var(--text-main)',
      }}
    >
      {value}
    </div>

    <div
      style={{
        marginTop: '0.3rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}
    >
      {description}
    </div>
  </div>
);

/* =========================================================
   CIVIC PULSE VALUE
========================================================= */

const getPulseValue = (
  pulse: CivicPulse
): string => {
  const value = pulse as unknown as Record<
    string,
    unknown
  >;

  const possibleValues = [
    value.score,
    value.value,
    value.pulse,
    value.civic_pulse,
  ];

  const numericValue = possibleValues.find(
    (item) => typeof item === 'number'
  );

  if (typeof numericValue === 'number') {
    return numericValue.toFixed(1);
  }

  return 'Available';
};

export default AnalyticsPage;