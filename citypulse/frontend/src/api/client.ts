import axios from 'axios';
import type {
  Observation, Alert, CivicEvent, Anomaly, CorrelationResult,
  UserPreferences, Provider, CivicPulse, AnalyticsSummary, User, FeedbackPayload
} from '../types/observation';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('citypulse_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const signup = (email: string, password: string, full_name: string) =>
  api.post<User>('/api/v1/auth/signup', { email, password, full_name });

export const login = (email: string, password: string) =>
  api.post<{ access_token: string; token_type: string }>('/api/v1/auth/login', { email, password });

export const loginWithGoogle = (credential: string) =>
  api.post<{ access_token: string; token_type: string }>('/api/v1/auth/google', { credential });

export const getMe = () => api.get<User>('/api/v1/auth/me');

// Observations
export const fetchObservations = (params: { city?: string; data_type?: string; limit?: number } = {}) =>
  api.get<Observation[]>('/api/v1/observations/', { params }).then(r => r.data);

// Alerts
export const fetchAlerts = (unread_only?: boolean) =>
  api.get<Alert[]>('/api/v1/alerts/', { params: { unread_only } }).then(r => r.data);

export const fetchUnreadCount = () =>
  api.get<{ unread_count: number }>('/api/v1/alerts/unread-count').then(r => r.data);

export const markAlertRead = (id: number) =>
  api.post(`/api/v1/alerts/${id}/read`);

export const markAllRead = () =>
  api.post('/api/v1/alerts/read-all');

// Events
export const fetchEvents = (limit = 50) =>
  api.get<CivicEvent[]>('/api/v1/events/', { params: { limit } }).then(r => r.data);

// Anomalies
export const fetchAnomalies = (city?: string) =>
  api.get<Anomaly[]>('/api/v1/anomalies/', { params: { city } }).then(r => r.data);

// Correlations
export const fetchCorrelations = (city?: string) =>
  api.get<CorrelationResult[]>('/api/v1/correlations/', { params: { city } }).then(r => r.data);

// Analytics
export const fetchCivicPulse = (city?: string) =>
  api.get<CivicPulse>('/api/v1/analytics/civic-pulse', { params: { city } }).then(r => r.data);

export const fetchSummary = (city?: string) =>
  api.get<AnalyticsSummary>('/api/v1/analytics/summary', { params: { city } }).then(r => r.data);

export const fetchTrends = (city?: string, hours_back = 48) =>
  api.get<Observation[]>('/api/v1/analytics/trends', { params: { city, hours_back } }).then(r => r.data);

export const triggerAnomalyDetection = (city: string) =>
  api.post('/api/v1/analytics/detect-anomalies', null, { params: { city } }).then(r => r.data);

export const triggerCorrelation = (city: string) =>
  api.post('/api/v1/analytics/compute-correlations', null, { params: { city } }).then(r => r.data);

// Providers
export const fetchProviders = () =>
  api.get<Provider[]>('/api/v1/providers/').then(r => r.data);

// User preferences
export const fetchPreferences = () =>
  api.get<UserPreferences>('/api/v1/users/preferences').then(r => r.data);

export const updatePreferences = (prefs: UserPreferences) =>
  api.put<UserPreferences>('/api/v1/users/preferences', prefs).then(r => r.data);

// Feedback
export const submitFeedback = (payload: FeedbackPayload) =>
  api.post('/api/v1/feedback/', payload).then(r => r.data);

// Models
export const fetchModels = () =>
  api.get('/api/v1/models/').then(r => r.data);

export default api;
