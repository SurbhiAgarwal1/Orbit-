'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface OmegaGaugeProps {
  score: number;
}

export const OmegaGauge: React.FC<OmegaGaugeProps> = ({ score }) => {
  const scoreRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const currentScore = useRef(0);

  // Circular gauge parameters
  const radius = 90;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Animate score text
    const obj = { val: currentScore.current };
    gsap.to(obj, {
      val: score,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: () => {
        if (scoreRef.current) {
          scoreRef.current.innerText = Math.round(obj.val).toString();
        }
      }
    });

    // Animate radial ring stroke
    if (circleRef.current) {
      const strokeDashoffset = circumference - (score / 100) * circumference;
      gsap.to(circleRef.current, {
        strokeDashoffset: strokeDashoffset,
        duration: 1.0,
        ease: 'power2.out'
      });
    }

    currentScore.current = score;
  }, [score, circumference]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '240px',
        height: '240px'
      }}
    >
      {/* SVG Radial Gauge */}
      <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          style={{ opacity: 0.15 }}
        />
        {/* Animated Progress Ring */}
        <circle
          ref={circleRef}
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          style={{
            transition: 'stroke 0.3s'
          }}
        />
      </svg>

      {/* Central Content */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <span
          style={{
            fontSize: '48px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--primary-text)',
            lineHeight: 1
          }}
        >
          Ω
        </span>
        <div
          ref={scoreRef}
          style={{
            fontSize: '36px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--primary-text)',
            lineHeight: 1.1,
            marginTop: '4px'
          }}
        >
          0
        </div>
        <span
          className="label"
          style={{
            fontSize: '10px',
            color: 'var(--primary-text)',
            opacity: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: '2px'
          }}
        >
          ΩRBIT Score
        </span>
      </div>
    </div>
  );
};
