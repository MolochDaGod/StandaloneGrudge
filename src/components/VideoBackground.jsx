import React, { useRef, useEffect } from 'react';

export default function VideoBackground({ blurred = false }) {
  const clearRef = useRef(null);
  const blurRef = useRef(null);

  useEffect(() => {
    [clearRef, blurRef].forEach(ref => {
      if (ref.current) {
        ref.current.play().catch(() => {});
      }
    });
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 0, overflow: 'hidden', background: '#050a15'
    }}>
      <video
        ref={clearRef}
        src="/videos/bg-clear.mp4"
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
          opacity: blurred ? 0 : 1,
          transition: 'opacity 0.8s ease'
        }}
      />
      <video
        ref={blurRef}
        src="/videos/bg-blur.mp4"
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
          opacity: blurred ? 1 : 0,
          transition: 'opacity 0.8s ease'
        }}
      />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(5,10,21,0.55)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}
