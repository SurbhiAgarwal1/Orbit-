'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type City = 'Lucknow' | 'Delhi' | 'Mumbai' | 'Bengaluru';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

interface CityContextType {
  city: City;
  setCity: (city: City) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const CityContext = createContext<CityContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('orbit-theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme: Theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'dark' === theme ? 'light' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('orbit-theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {mounted ? children : <div style={{ visibility: 'hidden', display: 'contents' }}>{children}</div>}
    </ThemeContext.Provider>
  );
};

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [city, setCityState] = useState<City>('Lucknow');

  useEffect(() => {
    const savedCity = localStorage.getItem('orbit-city') as City | null;
    if (savedCity) {
      setCityState(savedCity);
    }
  }, []);

  const setCity = (newCity: City) => {
    setCityState(newCity);
    localStorage.setItem('orbit-city', newCity);
    window.dispatchEvent(new CustomEvent('citychange', { detail: { city: newCity } }));
  };

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        padding: '6px 12px',
        color: 'var(--primary-text)',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        transition: 'all 0.15s ease-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--primary-text)';
        e.currentTarget.style.color = 'var(--background)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--primary-text)';
      }}
    >
      {theme === 'light' ? 'Go Dark' : 'Go Light'}
    </button>
  );
};

export const CitySelector: React.FC = () => {
  const { city, setCity } = useCity();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value as City)}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--primary-text)',
          border: '1px solid var(--border)',
          padding: '6px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          outline: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
          borderRadius: '0px'
        }}
      >
        <option value="Lucknow">Lucknow HQ</option>
        <option value="Delhi">Delhi Capital</option>
        <option value="Mumbai">Mumbai Coast</option>
        <option value="Bengaluru">Bengaluru Tech</option>
      </select>
    </div>
  );
};
