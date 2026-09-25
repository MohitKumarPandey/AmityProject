import axios from 'axios';
import type { Observation } from '../types/observation';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  timeout: 10000,
});

export interface FetchObservationsParams {
  city?: string;
  limit?: number;
}

export const fetchObservations = async (params: FetchObservationsParams = {}): Promise<Observation[]> => {
  const response = await api.get<Observation[]>('/api/v1/observations/', {
    params,
  });
  return response.data;
};
