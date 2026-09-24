import { useState, useEffect, useCallback } from 'react';
import { fetchObservations } from '../api/client';
import type { Observation } from '../types/observation';

export function useObservations(city?: string, data_type?: string, limit: number = 100) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchObservations({ city: city === 'All' ? undefined : city, data_type, limit });
      setObservations(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [city, data_type, limit]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const refresh = () => {
    load();
  };

  return { observations, loading, error, lastUpdated, refresh };
}
