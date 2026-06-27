'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapFeedItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  category: string;
  priority_score: number;
  status: string;
  assigned_dept?: string;
  created_at: string;
}

interface LeafletMapProps {
  complaints: MapFeedItem[];
  center?: [number, number];
  zoom?: number;
  showHeatmap?: boolean;
  showMarkers?: boolean;
  showWards?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  complaints,
  center = [26.8467, 80.9462], // Lucknow center
  zoom = 12,
  showHeatmap = false,
  showMarkers = true,
  showWards = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layersRef = useRef<any>({
    markers: null,
    heatmap: null,
    wards: null
  });

  const [L, setL] = useState<any>(null);

  // Load Leaflet dynamically to bypass SSR compilation errors
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  // Handle center changes dynamically when switching cities (pan map view smoothly)
  useEffect(() => {
    if (mapRef.current && L) {
      mapRef.current.setView(center, zoom, { animate: true, duration: 1.0 });
    }
  }, [center, zoom, L]);

  useEffect(() => {
    if (!L || !mapContainerRef.current) return;

    // Fix default marker icon paths in Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Initialize Map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false
      });

      // Add clean dark/light map tile styles based on document theme
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapRef.current);
      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // --- FIX TILE THEME SYNC GLITCH: Listen for themechange ---
    const handleThemeChange = (e: any) => {
      const nextTheme = e.detail.theme;
      const nextUrl = nextTheme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      tileLayerRef.current = L.tileLayer(nextUrl, { maxZoom: 19 }).addTo(map);
    };

    window.addEventListener('themechange', handleThemeChange);

    // --- RENDER MARKERS LAYER ---
    if (layersRef.current.markers) {
      map.removeLayer(layersRef.current.markers);
    }

    if (showMarkers) {
      const markerGroup = L.layerGroup();
      
      complaints.forEach((c) => {
        let color = '#888888';
        if (c.priority_score >= 80) color = 'var(--danger)'; // Critical
        else if (c.priority_score >= 60) color = '#E07A22'; // High (Orange)
        else if (c.status === 'resolved') color = 'var(--success)';

        const categorySymbol = c.category === 'road' ? '🛣️' 
                             : c.category === 'water' ? '💧' 
                             : c.category === 'electricity' ? '⚡' 
                             : c.category === 'sanitation' ? '🧹' 
                             : '⚠️';

        const customHtml = `
          <div style="
            background-color: var(--surface);
            border: 2px solid ${color};
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: var(--glow-intensity);
            transition: all 0.15s ease-out;
          ">
            ${categorySymbol}
          </div>
        `;

        const customIcon = L.divIcon({
          html: customHtml,
          className: 'custom-map-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const popupContent = `
          <div style="font-family: var(--font-body); padding: 4px;">
            <div style="font-family: var(--font-mono); font-size: 10px; color: ${color}; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">
              ${c.category} · Priority ${c.priority_score}
            </div>
            <h4 style="font-family: var(--font-display); font-size: 14px; font-weight: bold; margin: 0 0 6px 0; color: var(--primary-text);">
              ${c.title}
            </h4>
            <div style="font-size: 11px; color: var(--primary-text); opacity: 0.7; margin-bottom: 8px;">
              Status: <span style="font-family: var(--font-mono); font-weight: bold; text-transform: uppercase;">${c.status}</span>
            </div>
            <button onclick="window.dispatchEvent(new CustomEvent('selectcomplaint', {detail: '${c.id}'}))" style="
              width: 100%;
              background: var(--primary-text);
              color: var(--background);
              border: none;
              font-family: var(--font-mono);
              font-size: 11px;
              padding: 6px;
              cursor: pointer;
              text-transform: uppercase;
            ">
              View Details
            </button>
          </div>
        `;

        const marker = L.marker([c.latitude, c.longitude], { icon: customIcon })
          .bindPopup(popupContent);
          
        markerGroup.addLayer(marker);
      });

      markerGroup.addTo(map);
      layersRef.current.markers = markerGroup;
    }

    // --- RENDER HEATMAP LAYER ---
    if (layersRef.current.heatmap) {
      map.removeLayer(layersRef.current.heatmap);
    }

    if (showHeatmap) {
      const heatGroup = L.layerGroup();
      
      complaints.forEach((c) => {
        if (c.status === 'resolved') return;
        
        let heatRadius = 150;
        let opacity = 0.25;
        let color = '#E05555';

        if (c.priority_score >= 80) {
          heatRadius = 250;
          opacity = 0.45;
        } else if (c.priority_score < 40) {
          heatRadius = 90;
          opacity = 0.15;
          color = '#888888';
        }

        const circle = L.circle([c.latitude, c.longitude], {
          color: color,
          fillColor: color,
          fillOpacity: opacity,
          radius: heatRadius,
          stroke: false
        });

        heatGroup.addLayer(circle);
      });

      heatGroup.addTo(map);
      layersRef.current.heatmap = heatGroup;
    }

    // --- RENDER WARD BOUNDARIES ---
    if (layersRef.current.wards) {
      map.removeLayer(layersRef.current.wards);
    }

    if (showWards) {
      const wardGroup = L.layerGroup();
      
      // Select appropriate ward coordinates map to display AQI boundary circles
      // Get city centers and draw relative wards
      const LucknowWards = [
        { name: "Hazratganj", center: [26.8467, 80.9462], aqi: 156 },
        { name: "Aliganj", center: [26.8920, 80.9380], aqi: 182 },
        { name: "Indira Nagar", center: [26.8833, 80.9988], aqi: 145 },
        { name: "Gomti Nagar", center: [26.8580, 81.0020], aqi: 160 },
        { name: "Aminabad", center: [26.8420, 80.9250], aqi: 172 },
        { name: "Chowk", center: [26.8680, 80.9020], aqi: 138 },
        { name: "Charbagh", center: [26.8240, 80.9150], aqi: 195 },
        { name: "Janki Puram", center: [26.9200, 80.9420], aqi: 130 }
      ];

      LucknowWards.forEach((w) => {
        let aqiColor = '#22A060';
        if (w.aqi > 150) aqiColor = '#E05555';
        else if (w.aqi > 100) aqiColor = '#E07A22';

        const polygon = L.circle(w.center, {
          color: aqiColor,
          weight: 1,
          fillColor: aqiColor,
          fillOpacity: 0.15,
          radius: 1200
        });

        const tooltip = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'ward-map-label'
        })
        .setContent(`
          <div style="
            font-family: var(--font-mono);
            font-size: 8px;
            font-weight: bold;
            color: var(--primary-text);
            text-transform: uppercase;
            text-shadow: 0 0 2px var(--background);
          ">
            ${w.name}<br/>AQI: ${w.aqi}
          </div>
        `);

        polygon.bindTooltip(tooltip);
        wardGroup.addLayer(polygon);
      });

      wardGroup.addTo(map);
      layersRef.current.wards = wardGroup;
    }

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };

  }, [L, complaints, showHeatmap, showMarkers, showWards, center, zoom]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        zIndex: 1,
        backgroundColor: 'var(--background)'
      }}
    />
  );
};
