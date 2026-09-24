export interface Observation {
  id: number;
  source: string;
  data_type: string;
  city: string;
  zone?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  severity?: string;
  metric?: string | null;
  value?: number | null;
  unit?: string | null;
  status?: string;
  temperature_c?: number | null;
  humidity_percent?: number | null;
  aqi?: number | null;
  is_simulated: boolean;
}

export interface Alert {
  id: number;
  user_id?: number;
  event_id?: number;
  anomaly_id?: number;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  source_city: string;
  target_city: string;
  distance_km: number;
  created_at: string;
  is_read: boolean;
  delivery_status?: string;
  metadata_info?: Record<string, any>;
}

export interface CivicEvent {
  id: number;
  event_type: string;
  title: string;
  description: string;
  city: string;
  zone?: string;
  latitude: number;
  longitude: number;
  severity: string;
  source: string;
  started_at: string;
  status: string;
  radius_km: number;
  is_simulated: boolean;
  metadata_info?: Record<string, any>;
}

export interface Anomaly {
  id: number;
  observation_id?: number;
  city: string;
  zone?: string;
  data_type: string;
  detected_at: string;
  algorithm: string;
  score: number;
  severity: string;
  expected_value?: number;
  actual_value?: number;
  deviation?: string;
  is_confirmed: boolean;
  model_version: string;
  metadata_info?: Record<string, any>;
}

export interface CorrelationResult {
  id: number;
  city: string;
  zone?: string;
  feature_a: string;
  feature_b: string;
  time_window: string;
  correlation_coefficient: number;
  sample_size: number;
  detected_at: string;
  interpretation: string;
  model_version: string;
}

export interface UserPreferences {
  home_city: string;
  home_zone: string;
  latitude?: number | null;
  longitude?: number | null;
  alert_radius_km: number;
  alert_preferences: Record<string, boolean>;
}

export interface Provider {
  name: string;
  data_type: string;
  status: string;
  last_updated?: string | null;
  record_count: number;
  is_simulated: boolean;
}

export interface CivicPulse {
  status: string;
  city: string;
  period_hours: number;
  observation_count: number;
  dimensions: {
    air_quality: { avg_aqi?: number; score?: number; status: string; explanation: string };
    weather: { avg_temperature_c?: number; avg_humidity_percent?: number; status: string; explanation: string };
    emergency: { active_events: number; status: string; explanation: string };
    infrastructure: { anomaly_count: number; status: string; explanation: string };
  };
  alerts_unread: number;
}

export interface AnalyticsSummary {
  status: string;
  summary: string;
  observation_count: number;
  cities?: string[];
  avg_temperature_c?: number | null;
  avg_aqi?: number | null;
  avg_humidity_percent?: number | null;
  active_events?: number;
  period_hours?: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface FeedbackPayload {
  alert_id?: number;
  anomaly_id?: number;
  feedback_type: string;
  predicted_severity?: string;
  actual_severity?: string;
  observed_features?: Record<string, number>;
  user_comment?: string;
}
