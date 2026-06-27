'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { PulseRing } from './PulseRing';

interface KPICardProps {
  title: string;
  value: number;
  label?: string;
  hasPulse?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, label, hasPulse = false }) => {
  const valueRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const currentVal = useRef(0);

  useEffect(() => {
    if (valueRef.current) {
      const obj = { val: currentVal.current };
      gsap.to(obj, {
        val: value,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          if (valueRef.current) {
            valueRef.current.innerText = Math.round(obj.val).toString();
          }
        }
      });
      currentVal.current = value;
    }
  }, [value]);

  return (
    <div
      ref={cardRef}
      style={{
        border: '1px solid var(--border)',
        padding: '24px',
        backgroundColor: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        height: '120px',
        textAlign: 'center',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.borderColor = 'var(--primary-text)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1.0)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {hasPulse && <PulseRing />}
      <span
        className="label"
        style={{
          color: 'var(--primary-text)',
          opacity: 0.6,
          textTransform: 'uppercase',
          marginBottom: '8px',
          letterSpacing: '0.1em'
        }}
      >
        {title}
      </span>
      <div
        ref={valueRef}
        className="h1"
        style={{
          fontSize: '32px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--primary-text)',
          marginBottom: '4px'
        }}
      >
        0
      </div>
      {label && (
        <span
          className="label"
          style={{
            fontSize: '11px',
            color: 'var(--primary-text)',
            opacity: 0.5
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
