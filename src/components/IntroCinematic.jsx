import React, { useState, useRef, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import { INTRO_CINEMATIC } from '../constants/layers';

export default function IntroCinematic() {
  const setScreen = useGameStore(s => s.setScreen);
  const [showSkip, setShowSkip] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [holdFrame, setHoldFrame] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 1500);
    const titleTimer = setTimeout(() => setShowTitle(true), 800);
    const autoEnd = setTimeout(() => {
      if (!endedRef.current) handleEnd();
    }, 6000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(titleTimer);
      clearTimeout(autoEnd);
    };
  }, []);

  const handleEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setHoldFrame(true);
    setShowSkip(false);
    setShowTitle(false);
    setTimeout(() => setScreen('lobby'), 800);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#000', zIndex: INTRO_CINEMATIC,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img
        src={holdFrame ? '/backgrounds/tavern_bg.png' : '/backgrounds/tavern_entrance.gif'}
        alt="Entering the tavern"
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
        }}
        onError={handleEnd}
      />

      {showTitle && (
        <div style={{
          position: 'absolute', top: '15%', left: 0, right: 0,
          textAlign: 'center', pointerEvents: 'none',
          animation: 'fadeIn 1.5s ease forwards',
        }}>
          <h1 className="font-warcraft" style={{
            fontSize: '2.8rem', letterSpacing: 6,
            background: 'linear-gradient(90deg, #8B372E 0%, #DB6331 20%, #FAAC47 40%, #FFE0A0 50%, #FAAC47 60%, #DB6331 80%, #8B372E 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            WebkitTextStroke: '2px #000',
            paintOrder: 'stroke fill',
            textShadow: 'none',
            animation: 'titleShimmer 6s linear infinite',
            filter: 'drop-shadow(0 0 20px rgba(250,172,71,0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.8)) drop-shadow(1px 1px 0 rgba(0,0,0,1)) drop-shadow(-1px -1px 0 rgba(0,0,0,1))',
            margin: 0,
          }}>
            GRUDGE WARLORDS
          </h1>
          <p style={{
            color: 'rgba(255,215,0,0.6)', fontSize: '0.8rem', letterSpacing: 4,
            fontFamily: "'Cinzel', serif", marginTop: 8,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            ENTER THE TAVERN
          </p>
        </div>
      )}

      {showSkip && (
        <button onClick={handleEnd} style={{
          position: 'absolute', bottom: 30, right: 30,
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8, padding: '8px 20px',
          color: '#ccc', fontSize: '0.8rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: "'Cinzel', serif",
          letterSpacing: 2, backdropFilter: 'blur(4px)',
          transition: 'all 0.3s',
          zIndex: 10,
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(250,172,71,0.2)'; e.target.style.borderColor = '#FAAC47'; e.target.style.color = '#FAAC47'; }}
        onMouseLeave={e => { e.target.style.background = 'rgba(0,0,0,0.6)'; e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = '#ccc'; }}
        >
          SKIP
        </button>
      )}
    </div>
  );
}
