import React, { useRef, useEffect } from 'react';
import { createVideoElement } from '../utils/assetManager';
import { LOADING_SCREEN } from '../constants/layers';

export default function LoadingScreen({ progress = 0, total = 1, message = 'Loading...' }) {
  const holderRef = useRef(null);

  useEffect(() => {
    const holder = holderRef.current;
    const video = createVideoElement('/videos/loading.mp4');

    if (video && holder) {
      video.style.position = 'absolute';
      video.style.top = '50%';
      video.style.left = '50%';
      video.style.transform = 'translate(-50%, -50%)';
      video.style.minWidth = '100%';
      video.style.minHeight = '100%';
      video.style.width = 'auto';
      video.style.height = 'auto';
      video.style.objectFit = 'cover';
      video.style.opacity = '0.7';
      holder.appendChild(video);
      video.play().catch(() => {});

      return () => {
        if (holder.contains(video)) {
          video.pause();
          holder.removeChild(video);
        }
      };
    }
  }, []);

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: LOADING_SCREEN, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#050a15', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url(/images/loading-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />
      <div ref={holderRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        overflow: 'hidden'
      }} />
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
          fontSize: 'clamp(4.5rem, 12vw, 7.5rem)',
          background: 'linear-gradient(135deg, #6ee7b7, #ffd700, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 24
        }}>
          GRUDGE WARLORDS
        </h2>

        <div style={{
          width: 260, height: 6, background: 'rgba(255,255,255,0.1)',
          borderRadius: 3, overflow: 'hidden', margin: '0 auto 12px'
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #6ee7b7, #ffd700)',
            borderRadius: 3, transition: 'width 0.3s ease'
          }} />
        </div>

        <div style={{
          color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: 2,
          opacity: 0.8
        }}>
          {message} {pct}%
        </div>
      </div>
    </div>
  );
}
