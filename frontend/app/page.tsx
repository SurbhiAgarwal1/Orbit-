'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { KPICard } from '../components/ui/KPICard';
import { useCity } from '../components/ui/ThemeToggle';

const CityScene = dynamic(
  () => import('../components/three/CityScene').then((m) => m.CityScene),
  { ssr: false }
);

export default function OverviewPage() {
  const { city } = useCity();

  const [data, setData] = useState<any>({
    health_score: 73,
    open_count: 142,
    resolved_today: 38,
    aqi: 156,
    wards: [],
    complaints: []
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const bottomStripRef = useRef<HTMLDivElement>(null);

  // Fetch summary analytics whenever city selection changes
  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/analytics/summary?city=${city}`);
      if (response.ok) {
        const res = await response.json();
        setData(res);
      }
    } catch (err) {
      console.warn('Backend offline, using seed mock values.');
      const mockWards = [
        { id: 1, name: 'Ward A', health_score: 82 },
        { id: 2, name: 'Ward B', health_score: 75 },
        { id: 3, name: 'Ward C', health_score: 88 },
        { id: 4, name: 'Ward D', health_score: 91 },
        { id: 5, name: 'Ward E', health_score: 68 },
        { id: 6, name: 'Ward F', health_score: 70 },
        { id: 7, name: 'Ward G', health_score: 54 },
        { id: 8, name: 'Ward H', health_score: 77 }
      ];
      setData({
        health_score: 76,
        open_count: 32,
        resolved_today: 12,
        aqi: 145,
        wards: mockWards,
        complaints: [
          { id: '1', title: 'Street light broken', priority_score: 88, ward_id: 1, status: 'assigned' },
          { id: '2', title: 'Water logging near station', priority_score: 65, ward_id: 2, status: 'pending' },
          { id: '3', title: 'Transformer sparks', priority_score: 95, ward_id: 3, status: 'in_progress' }
        ]
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Setup listener to re-fetch if a new complaint is filed (Real-time sync representation)
    const handleSync = () => fetchData();
    window.addEventListener('complaintsubmit', handleSync);
    window.addEventListener('complaintupdate', handleSync);
    return () => {
      window.removeEventListener('complaintsubmit', handleSync);
      window.removeEventListener('complaintupdate', handleSync);
    };
  }, [city]);

  // GSAP Staggers on load
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(heroRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );
    }

    if (bottomStripRef.current) {
      const cards = bottomStripRef.current.children;
      gsap.fromTo(cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--background)' }}>
      {/* 3D HERO VIEWPORT SECTION */}
      <div
        ref={heroRef}
        style={{
          flex: 1,
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          opacity: 0 // controlled by GSAP
        }}
      >
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          padding: '8px 16px',
          boxShadow: 'var(--glow-intensity)'
        }}>
          <h1 className="h1" style={{ fontSize: '24px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Operational Grid ({city})
          </h1>
          <span className="mono" style={{ fontSize: '10px', opacity: 0.6 }}>
            Hover buildings to analyze Ward Status
          </span>
        </div>

        <CityScene
          wards={data.wards}
          complaints={data.complaints || []}
          city={city}
        />
      </div>

      {/* BOTTOM STRIP LIVE KPI TILES */}
      <div
        ref={bottomStripRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--background)',
          zIndex: 5
        }}
      >
        <KPICard title="ΩRBIT Score" value={data.health_score} label="Composite City Health index" hasPulse={true} />
        <KPICard title="Open Complaints" value={data.open_count} label="Pending verification/assignment" />
        <KPICard title="Resolved Today" value={data.resolved_today} label="Closed by civic teams today" />
        <KPICard title="AQI Index" value={data.aqi} label="Particulate matter reading (PM2.5)" />
      </div>
    </div>
  );
}
