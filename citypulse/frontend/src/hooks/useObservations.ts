import { useState, useEffect, useCallback } from 'react';
import { fetchObservations } from '../api/client';
import type { Observation, NormalizedCityObservation } from '../types/observation';

export function useObservations(cityFilter?: string, data_type?: string, limit: number = 200) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [normalized, setNormalized] = useState<Record<string, NormalizedCityObservation>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchObservations({ city: cityFilter === 'All' ? undefined : cityFilter, data_type, limit });
      setObservations(data);
      
      const cityMap: Record<string, NormalizedCityObservation> = {};
      data.forEach((obs) => {
        if (!obs.city) return;
        if (!cityMap[obs.city]) {
          cityMap[obs.city] = {
            city: obs.city,
            latitude: obs.latitude ?? null,
            longitude: obs.longitude ?? null,
            latest_timestamp: obs.timestamp,
            temperature_c: typeof obs.temperature_c === 'number' ? obs.temperature_c : null,
            temp_source: typeof obs.temperature_c === 'number' ? obs.source : null,
            temp_time: typeof obs.temperature_c === 'number' ? obs.timestamp : null,
            humidity_percent: typeof obs.humidity_percent === 'number' ? obs.humidity_percent : null,
            aqi: typeof obs.aqi === 'number' ? obs.aqi : null,
            aqi_source: typeof obs.aqi === 'number' ? obs.source : null,
            aqi_time: typeof obs.aqi === 'number' ? obs.timestamp : null,
          };
        } else {
          const existing = cityMap[obs.city];
          if (typeof obs.temperature_c === 'number' && existing.temperature_c === null) {
            existing.temperature_c = obs.temperature_c;
            existing.temp_source = obs.source;
            existing.temp_time = obs.timestamp;
          }
          if (typeof obs.humidity_percent === 'number' && existing.humidity_percent === null) {
            existing.humidity_percent = obs.humidity_percent;
          }
          if (typeof obs.aqi === 'number' && existing.aqi === null) {
            existing.aqi = obs.aqi;
            existing.aqi_source = obs.source;
            existing.aqi_time = obs.timestamp;
          }
          if (new Date(obs.timestamp) > new Date(existing.latest_timestamp)) {
            existing.latest_timestamp = obs.timestamp;
          }
        }
      });
      setNormalized(cityMap);
      
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cityFilter, data_type, limit]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const refresh = () => {
    load();
  };

  return { observations, normalized, loading, error, lastUpdated, refresh };
}
