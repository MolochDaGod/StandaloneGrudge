import React, { useState, useEffect } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getWorgTransformSprite } from '../data/spriteMap';

export default function WorgeMorphPreview({ raceId, scale = 3, speed = 150 }) {
  const [isBearForm, setIsBearForm] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setIsBearForm(prev => !prev);
        setOpacity(1);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const normalSprite = getPlayerSprite('worge', raceId);
  const bearSprite = getWorgTransformSprite(raceId);
  const currentSprite = isBearForm ? bearSprite : normalSprite;
  const currentScale = isBearForm ? scale * 1.25 : scale;
  const containerSize = 100 * scale * 1.25;

  return (
    <div style={{
      width: containerSize,
      height: containerSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'opacity 0.4s ease',
      opacity,
    }}>
      <SpriteAnimation
        spriteData={currentSprite}
        animation="idle"
        scale={currentScale}
        speed={speed}
      />
    </div>
  );
}
