'use client';

import React, { useEffect, useState, useRef } from 'react';
import { OmegaGauge } from '../../components/ui/OmegaGauge';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { gsap } from 'gsap';
import { useCity } from '../../components/ui/ThemeToggle';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export default function BrainPage() {
  const { city } = useCity();

  const [data, setData] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai', message: string }>>([
    { sender: 'ai', message: 'Namaste! Main ΩRBIT city assistant hoon. Lucknow, Delhi, Mumbai ya Bengaluru city stats ke baare me kuch bhi poohein.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Fetch metrics data based on active city context
  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/analytics/summary?city=${city}`);
      if (response.ok) {
        const res = await response.json();
        setData(res);
      }
    } catch (err) {
      console.warn('Backend connection failed. Using mock static data.');
      setData({
        health_score: city === 'Lucknow' ? 73 : city === 'Delhi' ? 68 : city === 'Mumbai' ? 82 : 79,
        open_count: city === 'Lucknow' ? 142 : city === 'Delhi' ? 195 : city === 'Mumbai' ? 120 : 96,
        resolved_today: 38,
        category_distribution: { road: 48, water: 32, electricity: 20, sanitation: 30, other: 12 },
        complaints_trend: [
          { day: "Jun 20", value: 12 },
          { day: "Jun 21", value: 15 },
          { day: "Jun 22", value: 18 },
          { day: "Jun 23", value: 14 },
          { day: "Jun 24", value: 22 },
          { day: "Jun 25", value: 29 },
          { day: "Jun 26", value: 16 }
        ],
        resolution_trend: [
          { day: "Jun 20", value: 8 },
          { day: "Jun 21", value: 12 },
          { day: "Jun 22", value: 9 },
          { day: "Jun 23", value: 15 },
          { day: "Jun 24", value: 14 },
          { day: "Jun 25", value: 20 },
          { day: "Jun 26", value: 38 }
        ],
        alerts: [`Ward ${city === 'Lucknow' ? 7 : city === 'Delhi' ? 10 : city === 'Mumbai' ? 18 : 27} showing road damage surge. Inspection recommended.`]
      });
    }
  };

  useEffect(() => {
    fetchData();
    
    // Clear chat log and print welcome when switching cities
    setChatHistory([
      { sender: 'ai', message: `Namaste! Main ΩRBIT AI Assistant hoon. Abhi hum ${city} city context me operations and AI logs analyze kar rahe hain. Kuch bhi poohein.` }
    ]);
  }, [city]);

  useEffect(() => {
    const handleUpdate = () => fetchData();
    window.addEventListener('complaintsubmit', handleUpdate);
    window.addEventListener('complaintupdate', handleUpdate);
    return () => {
      window.removeEventListener('complaintsubmit', handleUpdate);
      window.removeEventListener('complaintupdate', handleUpdate);
    };
  }, [city]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }
  }, []);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    const nextHistory: Array<{ sender: 'user' | 'ai'; message: string }> = [
      ...chatHistory,
      { sender: 'user', message: messageText }
    ];
    setChatHistory(nextHistory);
    setUserInput('');
    setChatLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_message: `In the context of ${city}: ${messageText}` 
        })
      });

      if (response.ok) {
        const res = await response.json();
        setChatHistory([...nextHistory, { sender: 'ai', message: res.reply }]);
      } else {
        throw new Error('API failed');
      }
    } catch (e) {
      // Local Hinglish chatbot offline responses tailored per city context
      let reply = `Mujhe ${city} operations details analyze karne me assistance lag rahi hai. `;
      if (messageText.includes('Worst ward') || messageText.includes('worst')) {
        reply = `Is hafte ${city} me central wards me sabse zyada load-shedding aur road damage tickets file hui hain. Operational details are mapped.`;
      } else if (messageText.includes('AQI')) {
        reply = `Average AQI in ${city} is currently around ${data?.aqi || 156}. Environment teams check points trigger are tracking.`;
      } else {
        reply = `Message received. We are routing this to ${city} administrative officers. Anything else you want to check?`;
      }
      setChatHistory([...nextHistory, { sender: 'ai', message: reply }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!data) {
    return <div style={{ padding: '32px', color: '#F0F0F0', backgroundColor: '#080808', height: '100%' }}>Loading Brain...</div>;
  }

  const themeText = '#A0A0A0';
  const themeBorder = '#222222';

  const lineChartData = {
    labels: data.complaints_trend.map((t: any) => t.day),
    datasets: [
      {
        label: 'Filed Signals',
        data: data.complaints_trend.map((t: any) => t.value),
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.05)',
        tension: 0.1,
        borderWidth: 2,
        pointBackgroundColor: '#FFFFFF',
      },
      {
        label: 'Resolved Signals',
        data: data.resolution_trend.map((t: any) => t.value),
        borderColor: '#22A060',
        backgroundColor: 'rgba(34,160,96,0.05)',
        tension: 0.1,
        borderWidth: 2,
        pointBackgroundColor: '#22A060',
      }
    ]
  };

  const donutChartData = {
    labels: Object.keys(data.category_distribution).map(k => k.toUpperCase()),
    datasets: [
      {
        data: Object.values(data.category_distribution),
        backgroundColor: [
          '#E05555',
          '#0088cc',
          '#E07A22',
          '#22A060',
          '#888888'
        ],
        borderWidth: 1,
        borderColor: '#080808'
      }
    ]
  };

  return (
    <div
      ref={pageRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#080808',
        color: '#F0F0F0',
        padding: '24px',
        overflow: 'hidden'
      }}
    >
      {/* PREDICTIVE ALERT BANNER */}
      {data.alerts && data.alerts.length > 0 && (
        <div
          style={{
            border: '1px solid #E05555',
            backgroundColor: 'rgba(224, 85, 85, 0.08)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              backgroundColor: '#E05555',
              borderRadius: '50%',
              animation: 'breathing-pulse 1s infinite'
            }}
          />
          <span className="mono" style={{ fontSize: '12px', letterSpacing: '0.05em', color: '#E05555', fontWeight: 'bold' }}>
            PREDICTIVE ANOMALY DETECTED ({city.toUpperCase()}):
          </span>
          <span className="body" style={{ fontSize: '13px', color: '#F0F0F0', opacity: 0.9 }}>
            {data.alerts[0]}
          </span>
        </div>
      )}

      {/* CORE 3-PANE LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', gap: '24px', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANEL */}
        <div style={{
          border: '1px solid #222222',
          backgroundColor: '#111111',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}>
          <h2 className="mono" style={{ fontSize: '12px', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Health Gauge
          </h2>
          <OmegaGauge score={data.health_score} />
          
          <div style={{ width: '100%', borderTop: '1px solid #222222', paddingTop: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ opacity: 0.5 }}>ACTIVE INCIDENTS:</span>
              <span style={{ color: '#E05555', fontWeight: 'bold' }}>{data.open_count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.5 }}>RESOLVED TODAY:</span>
              <span style={{ color: '#22A060', fontWeight: 'bold' }}>{data.resolved_today}</span>
            </div>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: '24px',
          overflow: 'hidden'
        }}>
          <div style={{ border: '1px solid #222222', backgroundColor: '#111111', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <span className="mono" style={{ fontSize: '11px', opacity: 0.5, marginBottom: '12px' }}>
              {city.toUpperCase()} SIGNAL TREND (7 DAYS)
            </span>
            <div style={{ flex: 1, position: 'relative', height: '150px' }}>
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { color: themeBorder }, ticks: { color: themeText, font: { family: 'JetBrains Mono', size: 10 } } },
                    y: { grid: { color: themeBorder }, ticks: { color: themeText, font: { family: 'JetBrains Mono', size: 10 } } }
                  },
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </div>

          <div style={{ border: '1px solid #222222', backgroundColor: '#111111', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <span className="mono" style={{ fontSize: '11px', opacity: 0.5, marginBottom: '12px' }}>
              INCIDENT CATEGORY SPREAD
            </span>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', height: '150px' }}>
              <div style={{ width: '160px' }}>
                <Doughnut
                  data={donutChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', marginLeft: '24px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#E05555' }} />
                  <span>ROAD: {data.category_distribution.road}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#0088cc' }} />
                  <span>WATER: {data.category_distribution.water}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#E07A22' }} />
                  <span>ELECTRICITY: {data.category_distribution.electricity}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#22A060' }} />
                  <span>SANITATION: {data.category_distribution.sanitation}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#888888' }} />
                  <span>OTHER: {data.category_distribution.other}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          border: '1px solid #222222',
          backgroundColor: '#111111',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #222222' }}>
            <span className="mono" style={{ fontSize: '11px', opacity: 0.5 }}>ΩRBIT VOICE & NLP CHAT</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginTop: '4px' }}>Central Intelligence ({city})</h3>
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatHistory.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: ch.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: ch.sender === 'user' ? '#FFFFFF' : '#222222',
                  color: ch.sender === 'user' ? '#0A0A0A' : '#F0F0F0',
                  padding: '10px 14px',
                  borderRadius: '0px',
                  maxWidth: '85%',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  fontFamily: 'var(--font-body)'
                }}
              >
                {ch.message}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                Typing response...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '8px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #222222' }}>
            {['Worst ward this week?', 'AQI status?'].map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                style={{
                  background: 'none',
                  border: '1px solid #333333',
                  color: '#A0A0A0',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333333'}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderTop: '1px solid #222222' }}>
            <input
              type="text"
              placeholder="Ask anything about the city..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(userInput)}
              style={{
                flex: 1,
                backgroundColor: '#1C1C1C',
                border: '1px solid #333333',
                padding: '10px',
                color: '#FFFFFF',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSend(userInput)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                border: 'none',
                padding: '0 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              SEND
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
