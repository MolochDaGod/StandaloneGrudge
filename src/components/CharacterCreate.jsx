import React, { useEffect, useState } from 'react';
import useGameStore from '../stores/gameStore';
import { openBuilder, BUILDER_URL } from '../utils/studioUrls';

/**
 * CharacterCreate — Redirect stub
 * Character creation has been consolidated into Grudge Builder.
 * This component shows a brief transition screen and redirects.
 *
 * Original preserved in CharacterCreate.LEGACY.jsx
 */
export default function CharacterCreate() {
  const setScreen = useGameStore(s => s.setScreen);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          openBuilder('/character');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, rgba(250,172,71,0.08), transparent 60%), #0a0a12',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/character_create.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.2, pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', padding: 40,
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(250,172,71,0.2)',
        borderRadius: 16,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.5s ease',
        maxWidth: 420,
      }}>
        <div style={{
          width: 48, height: 48, margin: '0 auto 20px',
          border: '3px solid rgba(250,172,71,0.2)',
          borderTop: '3px solid #FAAC47',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />

        <div className="font-cinzel" style={{
          fontSize: '1.3rem', color: '#FAAC47', marginBottom: 8,
          letterSpacing: 2,
        }}>
          Opening Character Builder
        </div>

        <div style={{
          fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: 20,
        }}>
          Character creation has moved to Grudge Builder.
          <br />Redirecting in {countdown}...
        </div>

        <button
          onClick={() => openBuilder('/character')}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #DB6331, #FAAC47)',
            border: 'none', borderRadius: 8,
            color: '#0a0a12', fontWeight: 700, fontSize: '0.9rem',
            fontFamily: "'Cinzel', serif", letterSpacing: 1,
            cursor: 'pointer', marginBottom: 12,
          }}
        >
          OPEN BUILDER NOW
        </button>

        <div>
          <button
            onClick={() => setScreen('lobby')}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Back to War Room
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
