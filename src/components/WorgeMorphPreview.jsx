import React, { useState, useEffect } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getWorgTransformSprite } from '../data/spriteMap';

export default function WorgeMorphPreview({ raceId, namedHeroId, scale = 3, speed = 150 }) {
  const [isBearForm, setIsBearForm] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsMorphing(true);
      setTimeout(() => {
        setIsBearForm(prev => !prev);
      }, 500);
      setTimeout(() => {
        setIsMorphing(false);
      }, 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const normalSprite = getPlayerSprite('worge', raceId, namedHeroId);
  const bearSprite = getWorgTransformSprite(raceId, namedHeroId);
  const currentSprite = isBearForm ? bearSprite : normalSprite;
  const frameSize = currentSprite?.frameWidth || currentSprite?.frameHeight || 48;
  const displaySize = frameSize * scale;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      position: 'relative',
      width: displaySize,
      height: displaySize,
    }}>
      {isMorphing && (
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          width: displaySize * 0.5,
          height: displaySize * 1.6,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(to top, rgba(34,197,94,0.9) 0%, rgba(34,197,94,0.5) 30%, rgba(74,222,128,0.3) 60%, rgba(134,239,172,0.1) 85%, transparent 100%)',
          borderRadius: '50% 50% 0 0',
          animation: 'morphColumnPulse 0.4s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3)',
          mixBlendMode: 'screen',
        }} />
      )}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <SpriteAnimation
          spriteData={currentSprite}
          animation="idle"
          scale={scale}
          speed={speed}
        />
      </div>
    </div>
  );
}
