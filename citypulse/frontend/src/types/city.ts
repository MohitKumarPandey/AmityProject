export interface NormalizedCityObservation {
  city: string;
  latitude: number | null;
  longitude: number | null;

  temperature?: number | null;
  humidity?: number | null;

  [key: string]: unknown;
}