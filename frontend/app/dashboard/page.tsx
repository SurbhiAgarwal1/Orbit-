'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { useCity } from '../../components/ui/ThemeToggle';
import Link from 'next/link';

interface ComplaintItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority_score: number;
  status: string;
  ward_id: number;
  assigned_dept?: string;
  created_at: string;
  image_url?: string;
  user_id?: string;
}

// Assigned Officer Contact Details
const DEPT_OFFICERS: Record<string, { officer: string; contact: string }> = {
  'Public Works Department (PWD)': { officer: 'Mr. V. K. Chaurasia', contact: '+91-522-2238411' },
  'Water Works (Jal Sansthan)': { officer: 'Mrs. Rashmi Pandey', contact: '+91-522-2624388' },
  'Electricity Board (LESA)': { officer: 'Mr. Sandeep Mathur', contact: '+91-522-2439333' },
  'Municipal Corporation Sanitation': { officer: 'Dr. Arvind Rao', contact: '+91-522-2615455' },
  'City Administration & Other Services': { officer: 'Mr. R. P. Singh', contact: '+91-522-2235912' }
};

export default function DashboardPage() {
  const { city } = useCity();

  // Persona State: 'citizen' | 'officer' | 'admin'
  const [activePersona, setActivePersona] = useState<'citizen' | 'officer' | 'admin'>('citizen');

  // General State
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [myComplaintIds, setMyComplaintIds] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('Public Works Department (PWD)');
  const [adminFilter, setAdminFilter] = useState('All');
  // Emergency Red Alert State for Admin Panel
  const [emergencyModalTicket, setEmergencyModalTicket] = useState<ComplaintItem | null>(null);
  const audioContextRef = useRef<any>(null);
  const sirenIntervalRef = useRef<any>(null);

  // Drawer details
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const departments = [
    'Public Works Department (PWD)',
    'Water Works (Jal Sansthan)',
    'Electricity Board (LESA)',
    'Municipal Corporation Sanitation',
    'City Administration & Other Services'
  ];

  // Synthesize Two-Tone Web Audio Emergency Siren Sound
  const playEmergencySiren = () => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(960, ctx.currentTime); // High pitch A5
      osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.35); // Low pitch A4
      osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.7);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    } catch (e) {
      console.warn('Web Audio Siren playback error:', e);
    }
  };

  const startContinuousSiren = () => {
    stopContinuousSiren();
    playEmergencySiren();
    sirenIntervalRef.current = setInterval(() => {
      playEmergencySiren();
    }, 900);
  };

  const stopContinuousSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
  };

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/complaints?city=${city}`);
      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a: any, b: any) => b.priority_score - a.priority_score);
        setComplaints(sorted);
      }
    } catch (err) {
      console.error('Failed to load complaints from backend:', err);
    }
  };

  // Sync clock & load local citizen tickets & check query params
  useEffect(() => {
    fetchComplaints();
    const saved = localStorage.getItem('orbit-citizen-complaints');
    if (saved) {
      setMyComplaintIds(JSON.parse(saved));
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('persona');
      if (p === 'admin' || p === 'officer' || p === 'citizen') {
        setActivePersona(p);
      }
    }
  }, [city]);

  // Listen to external triggers & trigger Emergency Red Alert for Admin
  useEffect(() => {
    const handleNewSubmission = (e: any) => {
      fetchComplaints();
      const ticket = e?.detail;
      if (ticket && ticket.priority_score >= 80) {
        setEmergencyModalTicket(ticket);
        startContinuousSiren();
      }
    };

    window.addEventListener('complaintsubmit', handleNewSubmission);
    window.addEventListener('complaintupdate', fetchComplaints);
    return () => {
      window.removeEventListener('complaintsubmit', handleNewSubmission);
      window.removeEventListener('complaintupdate', fetchComplaints);
      stopContinuousSiren();
    };
  }, [city]);

  const dismissEmergencyModal = () => {
    stopContinuousSiren();
    setEmergencyModalTicket(null);
  };

  const handleRowClick = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setShowDrawer(true);

    if (drawerRef.current) {
      gsap.fromTo(drawerRef.current, 
        { x: '100%' }, 
        { x: '0%', duration: 0.35, ease: 'power2.out' }
      );
    }
  };

  const closeDrawer = () => {
    if (drawerRef.current) {
      gsap.to(drawerRef.current, {
        x: '100%',
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setShowDrawer(false);
          setSelectedComplaint(null);
        }
      });
    } else {
      setShowDrawer(false);
      setSelectedComplaint(null);
    }
  };

  // Status transitions patch
  const updateTicketStatus = async (complaintId: string, newStatus: string, deptName?: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const body: any = { status: newStatus };
      if (deptName) body.assigned_dept = deptName;

      const response = await fetch(`${apiUrl}/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const updated = await response.json();
        setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedComplaint && selectedComplaint.id === updated.id) {
          setSelectedComplaint(updated);
        }
        window.dispatchEvent(new CustomEvent('complaintupdate', { detail: updated }));
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const getAgeString = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  // Memoized Filters for Admin
  const adminFilteredComplaints = useMemo(() => {
    let result = [...complaints];
    if (adminFilter === 'Critical') {
      result = result.filter(c => c.priority_score >= 80 && c.status !== 'resolved');
    } else if (adminFilter === 'Road') {
      result = result.filter(c => c.category === 'road');
    } else if (adminFilter === 'Water') {
      result = result.filter(c => c.category === 'water');
    } else if (adminFilter === 'Unassigned') {
      result = result.filter(c => !c.assigned_dept || c.status === 'pending');
    }
    return result;
  }, [complaints, adminFilter]);
  const getAdminFilteredComplaints = () => adminFilteredComplaints;

  // Memoized Filters for Officer
  const officerComplaints = useMemo(() => {
    return complaints.filter(c => c.assigned_dept === selectedDept);
  }, [complaints, selectedDept]);
  const getOfficerComplaints = () => officerComplaints;

  // Memoized Filters for Citizen
  const citizenComplaints = useMemo(() => {
    return complaints.filter(c => 
      c.user_id === '22222222-2222-4222-b222-222222222222' || 
      myComplaintIds.includes(c.id)
    );
  }, [complaints, myComplaintIds]);
  const getCitizenComplaints = () => citizenComplaints;

  // Get active status details for drawer
  const assignedOfficerInfo = selectedComplaint?.assigned_dept 
    ? DEPT_OFFICERS[selectedComplaint.assigned_dept] 
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--background)', overflow: 'hidden' }}>
      
      {/* WORKSPACE PERSONA SELECTION HEADER */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        backgroundColor: 'var(--surface)',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActivePersona('citizen')}
            style={{
              backgroundColor: activePersona === 'citizen' ? 'var(--primary-text)' : 'transparent',
              color: activePersona === 'citizen' ? 'var(--background)' : 'var(--primary-text)',
              border: '1px solid var(--border)',
              padding: '8px 16px',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Citizen Hub
          </button>
          <button
            onClick={() => setActivePersona('officer')}
            style={{
              backgroundColor: activePersona === 'officer' ? 'var(--primary-text)' : 'transparent',
              color: activePersona === 'officer' ? 'var(--background)' : 'var(--primary-text)',
              border: '1px solid var(--border)',
              padding: '8px 16px',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Officer Workspace
          </button>
          <button
            onClick={() => setActivePersona('admin')}
            style={{
              backgroundColor: activePersona === 'admin' ? 'var(--primary-text)' : 'transparent',
              color: activePersona === 'admin' ? 'var(--background)' : 'var(--primary-text)',
              border: '1px solid var(--border)',
              padding: '8px 16px',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Admin Panel
          </button>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0.6 }}>
          WORKSPACE PORTAL // CITY: {city.toUpperCase()}
        </div>
      </div>

      {/* CITIZEN PORTAL WORKSPACE */}
      {activePersona === 'citizen' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 className="h1" style={{ fontFamily: 'var(--font-display)', fontSize: '26px' }}>
                Welcome, Karan Sharma
              </h1>
              <p style={{ opacity: 0.6, fontSize: '14px', marginTop: '4px' }}>
                Track reported complaints and review live resolution statuses from civic officials.
              </p>
            </div>
            <Link href="/submit" style={{
              backgroundColor: 'var(--primary-text)',
              color: 'var(--background)',
              textDecoration: 'none',
              padding: '12px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              + File New Issue
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            {/* CITIZEN PROFILE DETAILS */}
            <div style={{ border: '1px solid var(--border)', padding: '24px', backgroundColor: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=karan"
                  alt="Citizen Avatar"
                  style={{ width: '48px', height: '48px', border: '1px solid var(--border)' }}
                />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Karan Sharma</h3>
                  <span className="mono" style={{ fontSize: '11px', opacity: 0.5 }}>RESIDENT ID: #ORB-CIT-4929</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '13px' }}>
                <div><span style={{ opacity: 0.6 }}>Primary City:</span> <strong>{city}</strong></div>
                <div><span style={{ opacity: 0.6 }}>Default Ward:</span> <strong>Ward 4</strong></div>
                <div><span style={{ opacity: 0.6 }}>Email:</span> <strong>karan@gmail.com</strong></div>
                <div><span style={{ opacity: 0.6 }}>Total Filed:</span> <strong>{getCitizenComplaints().length} tickets</strong></div>
              </div>
            </div>

            {/* TRACK CITIZEN TICKETS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="mono" style={{ opacity: 0.6 }}>TRACK ACTIVE COMPLAINTS ({getCitizenComplaints().length})</span>
              {getCitizenComplaints().length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', padding: '48px', textAlign: 'center', opacity: 0.5 }}>
                  <span className="mono" style={{ display: 'block', marginBottom: '8px' }}>NO SUBMITTED TICKETS FOUND</span>
                  <p style={{ fontSize: '13px' }}>Submit a civic report via the File Issue portal to start tracking.</p>
                </div>
              ) : (
                getCitizenComplaints().map(c => {
                  const officer = DEPT_OFFICERS[c.assigned_dept || ''] || { officer: 'Pending AI Assignment', contact: 'N/A' };
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '20px',
                        backgroundColor: 'var(--surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-text)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ fontSize: '11px', opacity: 0.6 }}>#ORB-{c.id.slice(0, 6).toUpperCase()}</span>
                        <span style={{
                          backgroundColor: c.status === 'resolved' ? 'var(--success)' : c.status === 'assigned' ? 'var(--primary-text)' : 'var(--danger)',
                          color: c.status === 'resolved' ? 'white' : 'var(--background)',
                          fontSize: '10px',
                          padding: '2px 8px',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-mono)'
                        }}>{c.status}</span>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                        <p style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {c.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '11px', opacity: 0.6 }} className="mono">
                        <div>ROUTED DEPT: {c.assigned_dept?.toUpperCase() || 'UNASSIGNED'}</div>
                        <div>OFFICER: {officer.officer}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT OFFICER WORKSPACE */}
      {activePersona === 'officer' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* OFFICER SELECTION BAR */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--surface)'
          }}>
            <span className="label" style={{ opacity: 0.6 }}>SELECT OFFICER DEPT:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--primary-text)',
                border: '1px solid var(--border)',
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                outline: 'none',
                borderRadius: '0px'
              }}
            >
              {departments.map(d => (
                <option key={d} value={d}>{d} - {DEPT_OFFICERS[d]?.officer}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', flex: 1, overflow: 'hidden' }}>
            {/* DEPARTMENT CONTACT CARD */}
            <div style={{ padding: '24px', borderRight: '1px solid var(--border)', overflowY: 'auto', backgroundColor: 'var(--surface)' }}>
              <span className="mono" style={{ opacity: 0.5, fontSize: '10px' }}>DEPARTMENT ROSTER PROFILE</span>
              <h2 className="h2" style={{ fontSize: '20px', fontFamily: 'var(--font-display)', marginTop: '8px' }}>
                {DEPT_OFFICERS[selectedDept]?.officer}
              </h2>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)' }}>Chief Officer, {city} HQ</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div><span style={{ opacity: 0.6 }}>Direct Contact:</span> <strong>{DEPT_OFFICERS[selectedDept]?.contact}</strong></div>
                <div><span style={{ opacity: 0.6 }}>Service Area:</span> <strong>{selectedDept}</strong></div>
                <div><span style={{ opacity: 0.6 }}>Pending Assignments:</span> <strong>{getOfficerComplaints().filter(c => c.status === 'assigned').length}</strong></div>
                <div><span style={{ opacity: 0.6 }}>In Progress Tasks:</span> <strong>{getOfficerComplaints().filter(c => c.status === 'in_progress').length}</strong></div>
                <div><span style={{ opacity: 0.6 }}>Resolved Total:</span> <strong>{getOfficerComplaints().filter(c => c.status === 'resolved').length}</strong></div>
              </div>
            </div>

            {/* OFFICER ASSIGNED TICKETS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px' }}>
              <span className="mono" style={{ opacity: 0.6, marginBottom: '16px' }}>ASSIGNED DEPT WORKLIST ({getOfficerComplaints().length} Tasks)</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getOfficerComplaints().length === 0 ? (
                  <div style={{ border: '1px dashed var(--border)', padding: '48px', textAlign: 'center', opacity: 0.5 }}>
                    <span className="mono">NO ASSIGNED ISSUES TO ROUTE</span>
                  </div>
                ) : (
                  getOfficerComplaints().map(c => (
                    <div
                      key={c.id}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '20px',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ fontSize: '11px', opacity: 0.6 }}>#ORB-{c.id.slice(0, 6).toUpperCase()}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{
                            backgroundColor: c.status === 'resolved' ? 'var(--success)' : c.status === 'in_progress' ? '#E07A22' : 'var(--primary-text)',
                            color: c.status === 'resolved' ? 'white' : 'var(--background)',
                            fontSize: '10px',
                            padding: '2px 8px',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700
                          }}>{c.status}</span>
                        </div>
                      </div>
                      
                      <div onClick={() => handleRowClick(c)} style={{ cursor: 'pointer' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                        <p style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>{c.description}</p>
                      </div>

                      {/* OFFICER ACTION ACTIONS */}
                      <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                        {c.status === 'assigned' && (
                          <button
                            onClick={() => updateTicketStatus(c.id, 'in_progress')}
                            style={{
                              backgroundColor: 'var(--primary-text)',
                              color: 'var(--background)',
                              border: 'none',
                              padding: '8px 16px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textTransform: 'uppercase'
                            }}
                          >
                            Mark In Progress
                          </button>
                        )}
                        {c.status !== 'resolved' && (
                          <button
                            onClick={() => updateTicketStatus(c.id, 'resolved')}
                            style={{
                              backgroundColor: 'var(--success)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textTransform: 'uppercase'
                            }}
                          >
                            Mark Resolved
                          </button>
                        )}
                        <button
                          onClick={() => handleRowClick(c)}
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--primary-text)',
                            border: '1px solid var(--border)',
                            padding: '8px 16px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textTransform: 'uppercase'
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL */}
      {activePersona === 'admin' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* STATS ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)'
          }}>
            <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', textAlign: 'center' }}>
              <span className="label" style={{ opacity: 0.6 }}>AVG RESOLUTION</span>
              <div className="h1" style={{ fontSize: '28px', fontFamily: 'var(--font-mono)' }}>4.2 days</div>
            </div>
            <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', textAlign: 'center' }}>
              <span className="label" style={{ opacity: 0.6 }}>ACTIVE WARD TICKETS ({city})</span>
              <div className="h1" style={{ fontSize: '28px', fontFamily: 'var(--font-mono)' }}>
                {complaints.filter(c => c.status !== 'resolved').length}
              </div>
            </div>
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <span className="label" style={{ opacity: 0.6, color: 'var(--danger)' }}>CRITICAL OPEN ISSUES</span>
              <div className="h1" style={{ fontSize: '28px', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                {complaints.filter(c => c.priority_score >= 80 && c.status !== 'resolved').length}
              </div>
            </div>
          </div>

          {/* FILTER BAR */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--background)'
          }}>
            <span className="label" style={{ opacity: 0.6, marginRight: '12px' }}>FILTER {city.toUpperCase()} SIGNALS:</span>
            {['All', 'Critical', 'Road', 'Water', 'Unassigned'].map((f) => (
              <button
                key={f}
                onClick={() => setAdminFilter(f)}
                style={{
                  background: adminFilter === f ? 'var(--primary-text)' : 'none',
                  color: adminFilter === f ? 'var(--background)' : 'var(--primary-text)',
                  border: '1px solid var(--border)',
                  padding: '6px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* ADMIN TABLE */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>TICKET ID</th>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>DESCRIPTION</th>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>CATEGORY</th>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>PRIORITY</th>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>STATUS</th>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>WARD</th>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>DEPARTMENT</th>
                  <th className="mono" style={{ padding: '16px 24px', opacity: 0.6 }}>AGE</th>
                </tr>
              </thead>
              <tbody>
                {getAdminFilteredComplaints().length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                      NO ACTIVE INCIDENTS REPORTED IN {city.toUpperCase()}
                    </td>
                  </tr>
                ) : (
                  getAdminFilteredComplaints().map((c) => {
                    const priorityColor = c.priority_score >= 80 ? 'var(--danger)' : c.priority_score >= 60 ? '#E07A22' : 'var(--primary-text)';
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleRowClick(c)}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'background-color 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="mono" style={{ padding: '16px 24px', fontWeight: 700 }}>
                          #ORB-{c.id.slice(0, 4).toUpperCase()}
                        </td>
                        <td style={{ padding: '16px 24px', maxWidth: '380px' }}>
                          <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{c.title}</div>
                          <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: '1.4', color: 'var(--primary-text)' }}>{c.description}</div>
                        </td>
                        <td className="mono" style={{ padding: '16px 24px', textTransform: 'uppercase', fontSize: '11px' }}>
                          {c.category}
                        </td>
                        <td className="mono" style={{ padding: '16px 24px', color: priorityColor, fontWeight: 700 }}>
                          {c.priority_score}/100
                        </td>
                        <td className="mono" style={{ padding: '16px 24px', fontSize: '11px', textTransform: 'uppercase' }}>
                          <span style={{
                            color: c.status === 'resolved' ? 'var(--success)' : c.status === 'in_progress' ? '#E07A22' : 'var(--danger)',
                            fontWeight: 600
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          Ward {c.ward_id}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                          {c.assigned_dept || <span className="mono" style={{ opacity: 0.4 }}>UNASSIGNED</span>}
                        </td>
                        <td className="mono" style={{ padding: '16px 24px', opacity: 0.7 }}>
                          {getAgeString(c.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILS SLIDE-IN DRAWER (Shared across all personas) */}
      {showDrawer && selectedComplaint && (
        <div
          ref={drawerRef}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '440px',
            backgroundColor: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--glow-intensity)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            padding: '32px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="mono" style={{ fontWeight: 700 }}>
              TICKET DETAILS #ORB-{selectedComplaint.id.slice(0, 6).toUpperCase()}
            </span>
            <button
              onClick={closeDrawer}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-text)',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 className="h2" style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
                {selectedComplaint.title}
              </h2>
              
              <div style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                padding: '16px',
                marginBottom: '16px',
                borderLeft: '4px solid var(--primary-text)'
              }}>
                <span className="mono" style={{ fontSize: '10px', opacity: 0.6, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                  ORIGINAL USER COMPLAINT DESCRIPTION
                </span>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--primary-text)', whiteSpace: 'pre-wrap' }}>
                  {selectedComplaint.description}
                </p>
              </div>
            </div>

            {selectedComplaint.image_url && (
              <div>
                <span className="label" style={{ opacity: 0.5 }}>ATTACHED SIGNAL EVIDENCE</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedComplaint.image_url}
                  alt="Evidence"
                  style={{ width: '100%', height: '160px', objectFit: 'cover', marginTop: '6px', border: '1px solid var(--border)' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="label" style={{ opacity: 0.5 }}>PRIORITY INDEX</span>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {selectedComplaint.priority_score}/100
                </div>
              </div>
              <div>
                <span className="label" style={{ opacity: 0.5 }}>CURRENT STATUS</span>
                <div style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  {selectedComplaint.status}
                </div>
              </div>
            </div>

            {/* --- INCIDENT OWNER DETAILS: Display Mapped Assigned Officer info --- */}
            {assignedOfficerInfo && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span className="label" style={{ opacity: 0.5 }}>ASSIGNED OPERATIONAL OFFICER</span>
                <div style={{
                  marginTop: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {assignedOfficerInfo.officer}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Head of department
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    Tel: {assignedOfficerInfo.contact}
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN-SPECIFIC ROUTING (Or visible if not resolved) */}
            {selectedComplaint.status !== 'resolved' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span className="label" style={{ opacity: 0.5, display: 'block', marginBottom: '8px' }}>
                  ROUTE SIGNAL (DEPT ASSIGNMENT)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {departments.map((d) => (
                    <button
                      key={d}
                      onClick={() => updateTicketStatus(selectedComplaint.id, 'assigned', d)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        backgroundColor: selectedComplaint.assigned_dept === d ? 'var(--primary-text)' : 'var(--background)',
                        color: selectedComplaint.assigned_dept === d ? 'var(--background)' : 'var(--primary-text)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedComplaint.status !== 'resolved' && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                onClick={() => updateTicketStatus(selectedComplaint.id, 'resolved')}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                Mark Ticket Resolved
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- ADMIN EXCLUSIVE EMERGENCY RED ALERT POPUP MODAL --- */}
      {activePersona === 'admin' && emergencyModalTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '3px solid var(--danger)',
            boxShadow: '0 0 40px rgba(224, 60, 49, 0.6)',
            maxWidth: '560px',
            width: '100%',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'breathing-pulse 1.2s infinite'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--danger)', pb: '12px', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px', animation: 'ping 1s infinite' }}>🚨</span>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.08em' }}>
                  ADMIN CRITICAL RED ALERT
                </span>
              </div>
              <span className="mono" style={{ fontSize: '12px', backgroundColor: 'var(--danger)', color: 'white', padding: '3px 8px', fontWeight: 700 }}>
                PRIORITY {emergencyModalTicket.priority_score}/100
              </span>
            </div>

            <div>
              <span className="mono" style={{ fontSize: '11px', opacity: 0.6 }}>TICKET #ORB-{emergencyModalTicket.id.slice(0, 6).toUpperCase()}</span>
              <h2 className="h2" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginTop: '4px', color: 'var(--primary-text)' }}>
                {emergencyModalTicket.title}
              </h2>
            </div>

            <div style={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              padding: '16px',
              borderLeft: '4px solid var(--danger)'
            }}>
              <span className="mono" style={{ fontSize: '10px', opacity: 0.6, display: 'block', marginBottom: '6px' }}>
                LIVE COMPLAINT SIGNAL DESCRIPTION
              </span>
              <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--primary-text)' }}>
                {emergencyModalTicket.description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div>
                <span className="label" style={{ opacity: 0.6 }}>ROUTED DEPARTMENT</span>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{emergencyModalTicket.assigned_dept || 'LESA Emergency Unit'}</div>
              </div>
              <div>
                <span className="label" style={{ opacity: 0.6 }}>CITY LOCATION</span>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{city} HQ (Ward {emergencyModalTicket.ward_id})</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  updateTicketStatus(emergencyModalTicket.id, 'in_progress', emergencyModalTicket.assigned_dept || 'Electricity Board (LESA)');
                  dismissEmergencyModal();
                }}
                style={{
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 0 15px rgba(224, 60, 49, 0.4)'
                }}
              >
                🚨 DISPATCH EMERGENCY UNITS IMMEDIATELY
              </button>

              <button
                onClick={dismissEmergencyModal}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--primary-text)',
                  border: '1px solid var(--border)',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                MUTE ALARM & ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

