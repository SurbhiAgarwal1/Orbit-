'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { VoiceInput } from './VoiceInput';
import { useCity } from '../ui/ThemeToggle';
import dynamic from 'next/dynamic';

const SelectedLocationMap = dynamic(
  () => import('../map/LeafletMap').then((m) => m.LeafletMap),
  { ssr: false }
);

// Mappings for officers to assign issues (requested by user)
const DEPT_OFFICERS: Record<string, { officer: string; contact: string }> = {
  'Public Works Department (PWD)': { officer: 'Mr. V. K. Chaurasia', contact: '+91-522-2238411' },
  'Water Works (Jal Sansthan)': { officer: 'Mrs. Rashmi Pandey', contact: '+91-522-2624388' },
  'Electricity Board (LESA)': { officer: 'Mr. Sandeep Mathur', contact: '+91-522-2439333' },
  'Municipal Corporation Sanitation': { officer: 'Dr. Arvind Rao', contact: '+91-522-2615455' },
  'City Administration & Other Services': { officer: 'Mr. R. P. Singh', contact: '+91-522-2235912' }
};

const CITY_COORDS = {
  Lucknow: [26.8467, 80.9462] as [number, number],
  Delhi: [28.6139, 77.2090] as [number, number],
  Mumbai: [19.0760, 72.8777] as [number, number],
  Bengaluru: [12.9716, 77.5946] as [number, number]
};

export const ComplaintForm: React.FC = () => {
  const { city } = useCity();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(26.8467);
  const [longitude, setLongitude] = useState(80.9462);
  const [image, setImage] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const analysisPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync coords to active city selection
  useEffect(() => {
    const coords = CITY_COORDS[city] || CITY_COORDS.Lucknow;
    setLatitude(coords[0]);
    setLongitude(coords[1]);
  }, [city]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleMicTranscript = (text: string) => {
    setDescription((prev) => prev ? `${prev} ${text}` : text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    setAnalysisResult(null);

    if (analysisPanelRef.current) {
      gsap.fromTo(analysisPanelRef.current, 
        { y: 100, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          latitude,
          longitude,
          image_url: image,
          category: 'other'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Track the ID in localStorage for Citizen Portal workspace representation
        try {
          const savedIds = localStorage.getItem('orbit-citizen-complaints');
          const ids = savedIds ? JSON.parse(savedIds) : [];
          ids.push(result.id);
          localStorage.setItem('orbit-citizen-complaints', JSON.stringify(ids));
        } catch (err) {
          console.warn('Failed to write to localStorage:', err);
        }
        
        setAnalysisResult(result);
        setTitle('');
        setDescription('');
        setImage(null);
        setIsSubmitting(false);

        window.dispatchEvent(new CustomEvent('complaintsubmit', { detail: result }));

      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      setIsSubmitting(false);
    }
  };

  const assignedInfo = analysisResult && DEPT_OFFICERS[analysisResult.assigned_dept] 
    ? DEPT_OFFICERS[analysisResult.assigned_dept] 
    : { officer: 'Pending Assignment', contact: 'N/A' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', height: '100%' }}>
      {/* LEFT FORM PANE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="h2" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
          File Complaint ({city})
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label" style={{ opacity: 0.6, textTransform: 'uppercase' }}>Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Broken pavement blocks near metro entrance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '12px',
                color: 'var(--primary-text)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-text)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="label" style={{ opacity: 0.6, textTransform: 'uppercase' }}>Description</label>
              <VoiceInput onTranscript={handleMicTranscript} />
            </div>
            <textarea
              required
              rows={4}
              placeholder="Provide specific details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '12px',
                color: 'var(--primary-text)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                resize: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-text)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="label" style={{ opacity: 0.6, textTransform: 'uppercase' }}>Photo Evidence</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed var(--primary-text)' : '1px dashed var(--border)',
                backgroundColor: 'var(--surface)',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              {image ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt="Upload preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="label" style={{ opacity: 0.5 }}>
                  Drag & Drop image here or click to select
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label" style={{ opacity: 0.6 }}>LATITUDE</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '8px',
                  color: 'var(--primary-text)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
            <div>
              <label className="label" style={{ opacity: 0.6 }}>LONGITUDE</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '8px',
                  color: 'var(--primary-text)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: 'var(--primary-text)',
              color: 'var(--background)',
              border: 'none',
              padding: '14px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}
          >
            {isSubmitting ? 'Analyzing Live Signal...' : 'File Citizen Complaint'}
          </button>
        </form>

        {isSubmitting && !analysisResult && (
          <div
            ref={analysisPanelRef}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ color: 'var(--primary-text)' }}>ΩRBIT AI CLASSIFIER</span>
              <span style={{ fontSize: '12px', color: 'var(--accent)', animation: 'breathing-pulse 1s infinite' }}>
                Analyzing speech & keywords...
              </span>
            </div>
            <div style={{ height: '4px', backgroundColor: 'var(--border)', width: '100%', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                backgroundColor: 'var(--primary-text)',
                width: '40%',
                animation: 'loading-bar 1.5s infinite linear'
              }} />
            </div>
          </div>
        )}

        {/* --- INCIDENT ANALYSIS: Display Officer Assignee details --- */}
        {analysisResult && (
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--primary-text)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--primary-text)' }}>
                CLASSIFIED: TICKET <strong style={{ color: 'var(--danger)' }}>#ORB-{analysisResult.id.slice(0, 4).toUpperCase()}</strong>
              </span>
              <span style={{
                backgroundColor: 'var(--primary-text)',
                color: 'var(--background)',
                fontSize: '10px',
                padding: '2px 6px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase'
              }}>
                {analysisResult.category}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div>
                <span className="label" style={{ opacity: 0.6 }}>PRIORITY</span>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {analysisResult.priority_score}/100
                </div>
              </div>
              <div>
                <span className="label" style={{ opacity: 0.6 }}>DEPT ASSIGNED</span>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-text)' }}>
                  {analysisResult.assigned_dept}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="label" style={{ opacity: 0.6 }}>ASSIGNED OFFICER</span>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>
                  {assignedInfo.officer}
                </div>
              </div>
              <div>
                <span className="label" style={{ opacity: 0.6 }}>OFFICER CONTACT</span>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  {assignedInfo.contact}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {analysisResult.ai_tags?.map((t: string) => (
                <span key={t} className="mono" style={{ fontSize: '9px', backgroundColor: 'var(--border)', padding: '2px 6px' }}>
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT LOCATION SELECTOR MAP */}
      <div style={{ border: '1px solid var(--border)', height: '100%', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          padding: '6px 12px'
        }}>
          <span className="label" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
            Set coordinates ({city})
          </span>
        </div>
        <SelectedLocationMap
          complaints={[]}
          center={CITY_COORDS[city] || CITY_COORDS.Lucknow}
          zoom={13}
          showMarkers={false}
        />
      </div>
    </div>
  );
};
