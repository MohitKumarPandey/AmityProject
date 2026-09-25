import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(maplibreWorker);

import type { NormalizedCityObservation } from '../../types/observation';
import {
  fetchMapPlaces,
  fetchTrafficIncidents,
} from '../../api/client';

interface MapPanelProps {
  observations?: (NormalizedCityObservation | any)[];
  selectedCity?: string;
  selectedLocation?: { name: string; lat: number; lng: number } | null;
  normalizedData?: Record<string, NormalizedCityObservation>;
}

interface POI {
  id?: string;
  name?: string;
  category?: string;
  latitude: number;
  longitude: number;
}

interface Incident {
  id?: string;
  latitude: number;
  longitude: number;
  description?: string;
  severity?: string;
}

interface TrafficResponse {
  incidents?: Incident[];
}

export const MapPanel: React.FC<MapPanelProps> = ({
  observations = [],
  selectedCity,
  selectedLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<maplibregl.Map | null>(null);

  const cityMarkersRef = useRef<
    maplibregl.Marker[]
  >([]);

  const poiMarkersRef = useRef<
    maplibregl.Marker[]
  >([]);

  const incidentMarkersRef = useRef<
    maplibregl.Marker[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [loadingInc, setLoadingInc] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [mapReady, setMapReady] = useState(false);

  /**
   * -----------------------------------------
   * GET VALID CENTER
   * -----------------------------------------
   */

  const getCenter = useCallback(() => {
    if (selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number') {
      return {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      };
    }

    const validObservation =
      observations.find(
        (item) =>
          typeof item.latitude === 'number' &&
          typeof item.longitude === 'number'
      );

    if (validObservation && typeof validObservation.latitude === 'number' && typeof validObservation.longitude === 'number') {
      return {
        lat: validObservation.latitude,
        lng: validObservation.longitude,
      };
    }

    // Fallback default center
    return {
      lat: 26.9124,
      lng: 75.7873,
    };
  }, [selectedLocation, observations]);

  /**
   * -----------------------------------------
   * INITIALIZE MAP
   * -----------------------------------------
   */

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const center = getCenter();

    const mapboxToken =
      import.meta.env.VITE_MAPBOX_TOKEN;

    const mapStyle = mapboxToken
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${mapboxToken}`
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  const container = mapContainerRef.current;

if (!container) {
  return;
}

const map = new maplibregl.Map({
  container,
  style: mapStyle,
  center: [center.lng, center.lat],
  zoom: 10,
  
});

    map.addControl(
      new maplibregl.NavigationControl(),
      'top-right'
    );

    map.addControl(
      new maplibregl.FullscreenControl(),
      'top-right'
    );

    map.on('load', () => {
      setMapReady(true);
      setMapError(null);
    });

    // Capture map errors (e.g., style load failure)
    map.on('error', (e: any) => {
      console.error('MapLibre error:', e.error);
      setMapError(e.error?.message || 'Map failed to load');
      setMapReady(false);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      setMapError(null);
    };
  }, [getCenter]);

  /**
   * -----------------------------------------
   * FLY TO SELECTED CITY / OBSERVATION
   * -----------------------------------------
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const center = getCenter();

    map.flyTo({
      center: [center.lng, center.lat],
      zoom: 11,
      duration: 1200,
    });
  }, [
    selectedCity,
    observations,
    mapReady,
    getCenter,
  ]);

  /**
   * -----------------------------------------
   * CLEAR POI MARKERS
   * -----------------------------------------
   */

  const clearPoiMarkers = () => {
    poiMarkersRef.current.forEach(
      (marker) => marker.remove()
    );

    poiMarkersRef.current = [];
  };

  /**
   * -----------------------------------------
   * CLEAR INCIDENT MARKERS
   * -----------------------------------------
   */

  const clearIncidentMarkers = () => {
    incidentMarkersRef.current.forEach(
      (marker) => marker.remove()
    );

    incidentMarkersRef.current = [];
  };

  /**
   * -----------------------------------------
   * LOAD REAL POIs
   * -----------------------------------------
   */

  const loadPlaces = useCallback(
    async (
      latitude: number,
      longitude: number
    ) => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      setLoading(true);

      try {
        clearPoiMarkers();

        const response =
          await fetchMapPlaces(
            '',
            latitude,
            longitude
          );

        const places: POI[] =
          Array.isArray(response)
            ? response
            : Array.isArray(
                  (
                    response as {
                      places?: POI[];
                    }
                  )?.places
                )
              ? (
                  response as {
                    places: POI[];
                  }
                ).places
              : [];

        places.forEach((place) => {
          if (
            typeof place.latitude !==
              'number' ||
            typeof place.longitude !==
              'number'
          ) {
            return;
          }

          const marker =
            new maplibregl.Marker({
              color: '#ff9800',
            })
              .setLngLat([
                place.longitude,
                place.latitude,
              ])
              .setPopup(
                new maplibregl.Popup({
                  offset: 25,
                }).setHTML(`
                  <div style="min-width:180px">
                    <strong>
                      ${
                        place.name ||
                        'Place'
                      }
                    </strong>

                    ${
                      place.category
                        ? `
                      <br/>
                      <span>
                        ${place.category}
                      </span>
                    `
                        : ''
                    }
                  </div>
                `)
              )
              .addTo(map);

          poiMarkersRef.current.push(
            marker
          );
        });
      } catch (error) {
        console.error(
          'Map places load error:',
          error
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * -----------------------------------------
   * LOAD REAL TRAFFIC INCIDENTS
   * -----------------------------------------
   */

  const loadTrafficIncidents =
    useCallback(
      async () => {
        const map = mapRef.current;

        if (!map) {
          return;
        }

        setLoadingInc(true);

        try {
          const bounds =
            map.getBounds();

          const bbox = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
          ].join(',');

          const incData =
            await fetchTrafficIncidents(
              bbox
            );

          clearIncidentMarkers();

          /**
           * fetchTrafficIncidents() may currently
           * have a response type that does not
           * expose `incidents`.
           *
           * Therefore safely normalize it here.
           */
          const trafficResponse =
            incData as
              | TrafficResponse
              | null
              | undefined;

          const incidents: Incident[] =
            Array.isArray(
              trafficResponse?.incidents
            )
              ? trafficResponse.incidents
              : [];

          incidents.forEach(
            (incident: Incident) => {
              if (
                typeof incident.latitude !==
                  'number' ||
                typeof incident.longitude !==
                  'number'
              ) {
                return;
              }

              const marker =
                new maplibregl.Marker({
                  color: '#e53935',
                })
                  .setLngLat([
                    incident.longitude,
                    incident.latitude,
                  ])
                  .setPopup(
                    new maplibregl.Popup({
                      offset: 25,
                    }).setHTML(`
                      <div style="min-width:200px">
                        <strong>
                          Traffic Incident
                        </strong>

                        <br/>

                        <span>
                          ${
                            incident.description ||
                            'No description available'
                          }
                        </span>

                        <br/>

                        <span>
                          Severity:
                          ${
                            incident.severity ||
                            'Unavailable'
                          }
                        </span>
                      </div>
                    `)
                  )
                  .addTo(map);

              incidentMarkersRef.current.push(
                marker
              );
            }
          );
        } catch (error) {
          console.error(
            'Traffic incident load error:',
            error
          );
        } finally {
          setLoadingInc(false);
        }
      },
      []
    );

  /**
   * -----------------------------------------
   * LOAD MAP DATA
   * -----------------------------------------
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const center = getCenter();

    loadPlaces(
      center.lat,
      center.lng
    );

    loadTrafficIncidents();
  }, [
    mapReady,
    selectedCity,
    getCenter,
    loadPlaces,
    loadTrafficIncidents,
  ]);

  /**
   * -----------------------------------------
   * REFRESH DATA WHEN MAP MOVES
   * -----------------------------------------
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    let timeoutId:
      ReturnType<typeof setTimeout> | null =
      null;

    const handleMoveEnd = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const center =
          map.getCenter();

        loadPlaces(
          center.lat,
          center.lng
        );

        loadTrafficIncidents();
      }, 500);
    };

    map.on(
      'moveend',
      handleMoveEnd
    );

    return () => {
      map.off(
        'moveend',
        handleMoveEnd
      );

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    mapReady,
    loadPlaces,
    loadTrafficIncidents,
  ]);

  /**
   * -----------------------------------------
   * OBSERVATION MARKERS
   * -----------------------------------------
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    cityMarkersRef.current.forEach(
      (marker) => marker.remove()
    );

    cityMarkersRef.current = [];

    observations.forEach(
      (observation) => {
        if (
          typeof observation.latitude !==
            'number' ||
          typeof observation.longitude !==
            'number'
        ) {
          return;
        }

        const marker =
          new maplibregl.Marker({
            color: '#1976d2',
          })
            .setLngLat([
              observation.longitude,
              observation.latitude,
            ])
            .setPopup(
              new maplibregl.Popup({
                offset: 25,
              }).setHTML(`
                <div style="min-width:200px">
                  <strong>
                    ${
                      observation.city ||
                      'City'
                    }
                  </strong>

                  <br/>

                  ${
                    observation.temperature_c != null
                      ? `
                    Temperature:
                    ${observation.temperature_c}°C
                  `
                      : ''
                  }

                  ${
                    observation.humidity_percent != null
                      ? `
                    <br/>
                    Humidity:
                    ${observation.humidity_percent}%
                  `
                      : ''
                  }
                </div>
              `)
            )
            .addTo(map);

        cityMarkersRef.current.push(
          marker
        );
      }
    );
  }, [
    observations,
    mapReady,
  ]);

  /**
   * -----------------------------------------
   * EMPTY STATE
   * -----------------------------------------
   */

  const hasObservations =
    observations.length > 0;

  return (
    <section className="relative h-full min-h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px' }}>
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', height: '100%' }}
      />

      {/* Map loading / error overlay */}
      {(!mapReady && !mapError) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
            <div className="text-sm font-medium text-slate-700">
              Loading map…
            </div>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-100/90 backdrop-blur-sm">
          <div className="rounded-xl border border-red-300 bg-white px-5 py-4 shadow-lg max-w-md">
            <div className="text-sm font-medium text-red-800">
              Map unavailable – {mapError}
            </div>
            <div className="mt-2 text-xs text-red-600">
              Check your MAPBOX token or internet connection.
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute left-4 top-4 z-20 rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-md">
          Loading places…
        </div>
      )}

      {loadingInc && (
        <div className="absolute left-4 top-16 z-20 rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-md">
          Loading traffic…
        </div>
      )}

      {!hasObservations && mapReady && !mapError && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-xs rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-md">
          <p className="text-sm font-medium text-slate-800">
            No live city observations
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Move the map or search for a location to load available real-world data.
          </p>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-20 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md">
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            City Data
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            Places
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
            Traffic
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapPanel;