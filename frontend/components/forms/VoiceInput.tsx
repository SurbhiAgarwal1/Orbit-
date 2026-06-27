'use client';

import React, { useState, useEffect } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lang, setLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
      
    if (SpeechRecognition) {
      setSupported(true);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang; // 'hi-IN' for Hindi Devanagari script, 'en-IN' for English

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

    try {
      rec.start();
      setRecognition(rec);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const stopListening = () => {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const switchLanguage = (selectedLang: 'hi-IN' | 'en-IN') => {
    setLang(selectedLang);
    if (isListening) {
      stopListening();
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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      {/* MIC START / STOP BUTTON */}
      <button
        type="button"
        onClick={toggleListening}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isListening ? 'var(--danger)' : 'var(--surface)',
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
        {isListening ? `Listening (${lang === 'hi-IN' ? 'Hindi' : 'English'})...` : `Voice Input (${lang === 'hi-IN' ? 'Hindi' : 'English'})`}
      </button>

      {/* LANGUAGE SELECTOR BUTTONS */}
      <div style={{ display: 'inline-flex', border: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => switchLanguage('hi-IN')}
          style={{
            backgroundColor: lang === 'hi-IN' ? 'var(--primary-text)' : 'transparent',
            color: lang === 'hi-IN' ? 'var(--background)' : 'var(--primary-text)',
            border: 'none',
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          HINDI (हिंदी)
        </button>
        <button
          type="button"
          onClick={() => switchLanguage('en-IN')}
          style={{
            backgroundColor: lang === 'en-IN' ? 'var(--primary-text)' : 'transparent',
            color: lang === 'en-IN' ? 'var(--background)' : 'var(--primary-text)',
            border: 'none',
            borderLeft: '1px solid var(--border)',
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ENGLISH
        </button>
      </div>
    </div>
  );
};
