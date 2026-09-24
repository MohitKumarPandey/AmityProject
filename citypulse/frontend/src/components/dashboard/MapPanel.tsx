import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Observation } from '../../types/observation';


interface MapPanelProps {
  observations: Observation[];
}

export const MapPanel: React.FC<MapPanelProps> = ({ observations }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const firstValid = observations.find(
      (o) => typeof o.latitude === 'number' && typeof o.longitude === 'number'
    );
    const center: [number, number] = firstValid
      ? [firstValid.longitude, firstValid.latitude]
      : [75.7878, 26.9124];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center,
      zoom: 3,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync observation markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    observations.forEach((obs) => {
      if (typeof obs.latitude !== 'number' || typeof obs.longitude !== 'number') return;

      const popupHtml = `
        <div class="map-popup">
          <strong style="color:#070a14; font-size:0.95rem;">${obs.city || 'Unknown'}</strong><br/>
          <span style="color:#334155;">Temp:</span> <strong>${obs.temperature_c ?? '—'} °C</strong><br/>
          <span style="color:#334155;">Humidity:</span> <strong>${obs.humidity_percent ?? '—'} %</strong><br/>
          <span style="color:#334155;">AQI:</span> <strong>${obs.aqi ?? '—'}</strong><br/>
          <span style="color:#475569; font-size:0.75rem;">Time: ${new Date(obs.timestamp).toLocaleString()}</span><br/>
          <span style="color:#0284c7; font-size:0.75rem;">Source: ${obs.source || '—'}</span>
        </div>
      `;

      const marker = new maplibregl.Marker({ color: '#00e5ff' })
        .setLngLat([obs.longitude, obs.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml))
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [observations]);

  if (!observations || observations.length === 0) {
    return (
      <div className="card-panel" style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No observations available for map display</p>
      </div>
    );
  }

  return (
    <section className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div ref={mapContainerRef} className="map-container-box" />
    </section>
  );
};
