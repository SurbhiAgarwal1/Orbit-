import type { Metadata } from 'next';
import '../styles/globals.css';
import { ThemeProvider, ThemeToggle, CityProvider, CitySelector } from '../components/ui/ThemeToggle';
import { LiveClock } from '../components/ui/LiveClock';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ΩRBIT — Smart City Operating System',
  description: 'A classified intelligence and automated management suite for civic operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', color: 'var(--primary-text)' }}>
        <CityProvider>
          <ThemeProvider>
            {/* TOP NAV: Full Viewport Width, Clean Border Layout */}
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
              {/* Left: Ω logo (28px, bold) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    cursor: 'default'
                  }}
                >
                  Ω
                </span>
                <span className="mono" style={{ fontSize: '14px', letterSpacing: '0.15em', fontWeight: 700 }}>
                  ΩRBIT
                </span>
              </div>

              {/* Center: City Selector + Live Clock (JetBrains Mono) */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
                <CitySelector />
                <span style={{ color: 'var(--border)' }}>|</span>
                <LiveClock />
              </div>

              {/* Right: Navigation Links + Toggle + Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <nav style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/" className="label" style={{ textDecoration: 'none', color: 'var(--primary-text)', opacity: 0.7, padding: '4px 6px' }}>
                    Overview
                  </Link>
                  <Link href="/dashboard" className="label" style={{ textDecoration: 'none', color: 'var(--primary-text)', opacity: 0.7, padding: '4px 6px' }}>
                    Workspace
                  </Link>
                  <Link href="/submit" className="label" style={{ textDecoration: 'none', color: 'var(--primary-text)', opacity: 0.7, padding: '4px 6px' }}>
                    File Issue
                  </Link>
                  <Link href="/dashboard?persona=admin" className="label" style={{ textDecoration: 'none', color: 'var(--primary-text)', opacity: 0.7, padding: '4px 6px' }}>
                    Admin
                  </Link>
                  <Link href="/brain" className="label" style={{ textDecoration: 'none', color: 'var(--primary-text)', opacity: 0.7, padding: '4px 6px' }}>
                    Brain
                  </Link>
                  <Link href="/map" className="label" style={{ textDecoration: 'none', color: 'var(--primary-text)', opacity: 0.7, padding: '4px 6px' }}>
                    Map
                  </Link>
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

            {/* Main App Container */}
            <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {children}
            </main>
          </ThemeProvider>
        </CityProvider>
      </body>
    </html>
  );
}
