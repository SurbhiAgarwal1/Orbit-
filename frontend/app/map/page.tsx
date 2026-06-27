'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { useCity } from '../../components/ui/ThemeToggle';

const LiveMap = dynamic(
  () => import('../../components/map/LeafletMap').then((m) => m.LeafletMap),
  { ssr: false }
);

const CITY_COORDS = {
  Lucknow: [26.8467, 80.9462] as [number, number],
  Delhi: [28.6139, 77.2090] as [number, number],
  Mumbai: [19.0760, 72.8777] as [number, number],
  Bengaluru: [12.9716, 77.5946] as [number, number]
};

export default function MapViewPage() {
  const { city } = useCity();

  const [complaints, setComplaints] = useState([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWards, setShowWards] = useState(false);

  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Fetch city complaints for spatial display
  const fetchComplaints = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/complaints?city=${city}`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (err) {
      console.warn('Backend connection failed. Using mock mapping data.');
      // Offline fallback Coordinates scatters
      const center = CITY_COORDS[city] || CITY_COORDS.Lucknow;
      const categories = ["road", "water", "electricity", "sanitation", "other"];
      const mockPoints: any = [];
      for (let i = 0; i < 40; i++) {
        mockPoints.push({
          id: `mock-${city}-${i}`,
          latitude: center[0] + (Math.random() - 0.5) * 0.03,
          longitude: center[1] + (Math.random() - 0.5) * 0.03,
          title: `Mock ${city} Issue ${i + 1}`,
          category: categories[i % categories.length],
          priority_score: Math.floor(Math.random() * 85) + 15,
          status: i % 5 === 0 ? 'resolved' : 'assigned',
          created_at: new Date().toISOString()
        });
      }
      setComplaints(mockPoints);
    }
  };

  useEffect(() => {
    fetchComplaints();

    const handleNew = () => fetchComplaints();
    window.addEventListener('complaintsubmit', handleNew);
    window.addEventListener('complaintupdate', handleNew);
    return () => {
      window.removeEventListener('complaintsubmit', handleNew);
      window.removeEventListener('complaintupdate', handleNew);
    };
  }, [city]);

  useEffect(() => {
    if (filterPanelRef.current) {
      gsap.fromTo(filterPanelRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      {/* FLOATING GLASS FILTER PANEL */}
      <div
        ref={filterPanelRef}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)',
          padding: '20px',
          width: '280px',
          boxShadow: 'var(--glow-intensity)',
          opacity: 0 // controlled by GSAP
        }}
      >
        <span className="mono" style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>
          GEOSPATIAL OVERLAYS
        </span>
        <h2 className="h2" style={{ fontSize: '20px', fontFamily: 'var(--font-display)', marginBottom: '16px', textTransform: 'uppercase' }}>
          {city} Map View
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={() => setShowMarkers(!showMarkers)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span className="mono" style={{ fontSize: '12px' }}>INCIDENT SIGNAL MARKERS</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={() => setShowHeatmap(!showHeatmap)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span className="mono" style={{ fontSize: '12px' }}>INCIDENT HEATMAP DENSITY</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showWards}
              onChange={() => setShowWards(!showWards)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span className="mono" style={{ fontSize: '12px' }}>WARD AQI REGIONAL BOUNDARIES</span>
          </label>
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '11px', opacity: 0.6 }}>
          Displaying complaints within {city} operational boundaries.
        </div>
      </div>

      {/* MAP */}
      <LiveMap
        complaints={complaints}
        center={CITY_COORDS[city] || CITY_COORDS.Lucknow}
        zoom={12}
        showMarkers={showMarkers}
        showHeatmap={showHeatmap}
        showWards={showWards}
      />
    </div>
  );
}
