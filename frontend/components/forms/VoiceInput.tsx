'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lang, setLang] = useState<'en-US' | 'hi-IN'>('en-US');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser compatibility
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
      
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = lang;
      
      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [onTranscript, lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
    }
  };

  const toggleLanguage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLang = lang === 'en-US' ? 'hi-IN' : 'en-US';
    setLang(newLang);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  if (!supported) {
    return (
      <span className="label" style={{ opacity: 0.4 }}>
        [Mic not supported by browser]
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        onClick={toggleListening}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isListening ? 'var(--danger)' : 'none',
          border: '1px solid var(--border)',
          padding: '8px 16px',
          color: isListening ? '#FFFFFF' : 'var(--primary-text)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        {isListening && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              border: '2px solid var(--danger)',
              borderRadius: '0px',
              animation: 'breathing-pulse 1.5s infinite ease-in-out'
            }}
          />
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
        {isListening ? `Listening (${lang === 'en-US' ? 'English' : 'Hindi'})...` : `Voice Input (${lang === 'en-US' ? 'English' : 'Hindi'})`}
      </button>

      <button
        type="button"
        onClick={toggleLanguage}
        title="Click to switch speech recognition language"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '8px 12px',
          color: 'var(--primary-text)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          textTransform: 'uppercase'
        }}
      >
        LANG: {lang === 'en-US' ? 'EN' : 'HI'}
      </button>
    </div>
  );
};
