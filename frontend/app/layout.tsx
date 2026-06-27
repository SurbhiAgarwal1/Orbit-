import type { Metadata } from 'next';
import '../styles/globals.css';
import { ThemeProvider, CityProvider } from '../components/ui/ThemeToggle';
import { Navbar } from '../components/ui/Navbar';

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
            <Navbar />
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
