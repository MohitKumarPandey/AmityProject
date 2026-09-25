import axios from 'axios';

import type {
  Observation,
  Alert,
  CivicEvent,
  Anomaly,
  CorrelationResult,
  UserPreferences,
  Provider,
  CivicPulse,
  AnalyticsSummary,
  User,
  FeedbackPayload,
} from '../types/observation';

const BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8090';

// Mapbox public token for client-side map rendering
export const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN || '';

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('citypulse_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =====================================================
// AUTH
// =====================================================

export const signup = (
  email: string,
  password: string,
  full_name: string
) =>
  api
    .post<User>('/api/v1/auth/signup', {
      email,
      password,
      full_name,
    });

export const login = (
  email: string,
  password: string
) =>
  api
    .post<{
      access_token: string;
      token_type: string;
    }>('/api/v1/auth/login', {
      email,
      password,
    });

export const loginWithGoogle = (credential: string) =>
  api
    .post<{
      access_token: string;
      token_type: string;
    }>('/api/v1/auth/google', {
      credential,
    });

export const getMe = () =>
  api.get<User>('/api/v1/auth/me');

// =====================================================
// OBSERVATIONS
// =====================================================

export const fetchObservations = (
  params: {
    city?: string;
    data_type?: string;
    limit?: number;
  } = {}
) =>
  api
    .get<Observation[]>('/api/v1/observations/', {
      params,
    })
    .then((r) => r.data);

// Distinct city list
export const fetchCities = () =>
  api
    .get<string[]>('/api/v1/observations/cities')
    .then((r) => r.data);

export const createObservation = (payload: {
  city: string;
  data_type?: string;
  source?: string;
  latitude?: number;
  longitude?: number;
  severity?: string;
  temperature_c?: number;
  humidity_percent?: number;
  aqi?: number;
  notes?: string;
}) =>
  api
    .post('/api/v1/observations/', payload)
    .then((r) => r.data);

export const deleteObservation = (id: number) =>
  api
    .delete(`/api/v1/observations/${id}`)
    .then((r) => r.data);

// =====================================================
// MAPS
// =====================================================

export const fetchMapSearch = (q: string) =>
  api
    .get<any[]>('/api/v1/maps/search', {
      params: { q },
    })
    .then((r) => r.data);

export const fetchMapPlaces = (
  q: string,
  lat?: number,
  lon?: number
) =>
  api
    .get<any[]>('/api/v1/maps/places', {
      params: {
        q,
        lat,
        lon,
      },
    })
    .then((r) => r.data);

export const fetchMapRoute = (
  profile: string,
  origin: string,
  destination: string,
  alternatives: boolean = false
) =>
  api
    .get<any>('/api/v1/maps/route', {
      params: {
        profile,
        origin,
        destination,
        alternatives,
      },
    })
    .then((r) => r.data);

// =====================================================
// TRAFFIC
// =====================================================

export const fetchTrafficIncidents = (
  bbox: string
) =>
  api
    .get<any>('/api/v1/traffic/incidents', {
      params: {
        bbox,
      },
    })
    .then((r) => r.data);

// =====================================================
// TRANSIT
// =====================================================

export const fetchTransitRoute = (
  origin: string,
  destination: string,
  departure_time: string = 'now',
  alternatives: boolean = false
) =>
  api
    .get<any>('/api/v1/transit/route', {
      params: {
        origin,
        destination,
        departure_time,
        alternatives,
      },
    })
    .then((r) => r.data);

// =====================================================
// ALERTS
// =====================================================

export const fetchAlerts = (
  unread_only?: boolean
) =>
  api
    .get<Alert[]>('/api/v1/alerts/', {
      params: { unread_only },
    })
    .then((r) => r.data);

export const fetchUnreadCount = () =>
  api
    .get<{ unread_count: number }>(
      '/api/v1/alerts/unread-count'
    )
    .then((r) => r.data);

export const markAlertRead = (id: number) =>
  api.post(`/api/v1/alerts/${id}/read`);

export const markAllRead = () =>
  api.post('/api/v1/alerts/read-all');

// =====================================================
// EVENTS
// =====================================================

export const fetchEvents = (limit = 50) =>
  api
    .get<CivicEvent[]>('/api/v1/events/', {
      params: { limit },
    })
    .then((r) => r.data);

// =====================================================
// ANOMALIES
// =====================================================

export const fetchAnomalies = (city?: string) =>
  api
    .get<Anomaly[]>('/api/v1/anomalies/', {
      params: { city },
    })
    .then((r) => r.data);

// =====================================================
// CORRELATIONS
// =====================================================

export const fetchCorrelations = (city?: string) =>
  api
    .get<CorrelationResult[]>('/api/v1/correlations/', {
      params: { city },
    })
    .then((r) => r.data);

// =====================================================
// ANALYTICS
// =====================================================

export const fetchCivicPulse = (city?: string) =>
  api
    .get<CivicPulse>(
      '/api/v1/analytics/civic-pulse',
      {
        params: { city },
      }
    )
    .then((r) => r.data);

export const fetchSummary = (city?: string) =>
  api
    .get<AnalyticsSummary>(
      '/api/v1/analytics/summary',
      {
        params: { city },
      }
    )
    .then((r) => r.data);

export const fetchTrends = (
  city?: string,
  hours_back = 48
) =>
  api
    .get<Observation[]>(
      '/api/v1/analytics/trends',
      {
        params: {
          city,
          hours_back,
        },
      }
    )
    .then((r) => r.data);

export const triggerAnomalyDetection = (
  city: string
) =>
  api
    .post(
      '/api/v1/analytics/detect-anomalies',
      null,
      {
        params: { city },
      }
    )
    .then((r) => r.data);

export const triggerCorrelation = (
  city: string
) =>
  api
    .post(
      '/api/v1/analytics/compute-correlations',
      null,
      {
        params: { city },
      }
    )
    .then((r) => r.data);

// =====================================================
// PROVIDERS
// =====================================================

export const fetchProviders = () =>
  api
    .get<Provider[]>('/api/v1/providers/')
    .then((r) => r.data);

// =====================================================
// USER PREFERENCES
// =====================================================

export const fetchPreferences = () =>
  api
    .get<UserPreferences>(
      '/api/v1/users/preferences'
    )
    .then((r) => r.data);

export const updatePreferences = (
  prefs: UserPreferences
) =>
  api
    .put<UserPreferences>(
      '/api/v1/users/preferences',
      prefs
    )
    .then((r) => r.data);

// =====================================================
// FEEDBACK
// =====================================================

export const submitFeedback = (
  payload: FeedbackPayload
) =>
  api
    .post('/api/v1/feedback/', payload)
    .then((r) => r.data);

export const fetchFeedbackHistory = () =>
  api
    .get<any[]>('/api/v1/feedback/')
    .then((r) => r.data);

export const fetchFeedbackMetrics = () =>
  api
    .get<{
      total_samples: number;
      severity_agreement_rate: number;
      prediction_accuracy: number;
      mean_absolute_error: number;
    }>('/api/v1/feedback/metrics')
    .then((r) => r.data);

// =====================================================
// MODELS
// =====================================================

export const fetchModels = () =>
  api
    .get('/api/v1/models/')
    .then((r) => r.data);

export default api;