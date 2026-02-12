import React, { useState, useRef, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import { INTRO_CINEMATIC } from '../constants/layers';

export default function IntroCinematic() {
  const setScreen = useGameStore(s => s.setScreen);
  const [fadeOut, setFadeOut] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const videoRef = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 1500);

    const fallbackTimer = setTimeout(() => {
      if (!endedRef.current) handleEnd();
    }, 30000);

    const vid = videoRef.current;
    if (vid) {
      const playPromise = vid.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          vid.muted = true;
          vid.play().catch(() => {
            handleEnd();
          });
        });
      }
    }

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setFadeOut(true);
    setTimeout(() => setScreen('lobby'), 800);
  };

  const handleSkip = () => {
    if (videoRef.current) videoRef.current.pause();
    handleEnd();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#000', zIndex: INTRO_CINEMATIC,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease',
    }}>
      <video
        ref={videoRef}
        src="/videos/intro_cinematic.mp4"
        playsInline
        muted
        onEnded={handleEnd}
        onError={handleEnd}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
        }}
      />

      {showSkip && (
        <button onClick={handleSkip} style={{
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
