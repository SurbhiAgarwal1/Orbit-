'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle, CitySelector } from './ThemeToggle';
import { LiveClock } from './LiveClock';

export const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', path: '/' },
    { name: 'Workspace', path: '/dashboard' },
    { name: 'File Issue', path: '/submit' },
    { name: 'Admin', path: '/admin' },
    { name: 'Brain', path: '/brain' },
    { name: 'Map', path: '/map' }
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        padding: '0 24px',
        backgroundColor: 'var(--background)',
        zIndex: 100
      }}
    >
      {/* Left: Ω logo (clickable) */}
      <Link href="/" style={{ textDecoration: 'none', color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)'
          }}
        >
          Ω
        </span>
        <span className="mono" style={{ fontSize: '14px', letterSpacing: '0.15em', fontWeight: 700 }}>
          ΩRBIT
        </span>
      </Link>

      {/* Center: City Selector + Live Clock */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
        <CitySelector />
        <span style={{ color: 'var(--border)' }}>|</span>
        <LiveClock />
      </div>

      {/* Right: Navigation Links + Toggle + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className="label"
                style={{
                  textDecoration: 'none',
                  color: active ? 'var(--background)' : 'var(--primary-text)',
                  backgroundColor: active ? 'var(--primary-text)' : 'transparent',
                  opacity: active ? 1.0 : 0.75,
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease-in-out',
                  borderRadius: '2px'
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <span style={{ color: 'var(--border)' }}>|</span>

        <ThemeToggle />

        {/* User Avatar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://api.dicebear.com/7.x/bottts/svg?seed=aditya"
          alt="User Profile"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid var(--border)'
          }}
        />
      </div>
    </header>
  );
};
