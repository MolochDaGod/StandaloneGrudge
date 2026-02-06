import React, { useRef, useEffect } from 'react';

export default function LoadingScreen({ message = 'Loading...' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 9998, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#050a15', overflow: 'hidden'
    }}>
      <video
        ref={videoRef}
        src="/videos/loading.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '100%', minHeight: '100%',
          width: 'auto', height: 'auto',
          objectFit: 'cover',
          opacity: 0.7
        }}
      />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(5,10,21,0.4)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        animation: 'fadeIn 0.5s ease'
      }}>
        <h2 className="font-cinzel" style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          background: 'linear-gradient(135deg, #6ee7b7, #ffd700, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 16
        }}>
          GRUDGE WARLORDS
        </h2>
        <div style={{
          color: 'var(--accent)', fontSize: '1rem', letterSpacing: 2,
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          {message}
        </div>
      </div>
    </div>
  );
}
