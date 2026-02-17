import React, { useState, useEffect, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getWorgTransformSprite, getRaceHeightScale } from '../data/spriteMap';

export default function WorgeMorphPreview({ raceId, namedHeroId, scale = 3, speed = 150 }) {
  const [transformed, setTransformed] = useState(false);

  const normalSprite = getPlayerSprite('worge', raceId, namedHeroId);
  const formSprite = getWorgTransformSprite(raceId, namedHeroId);

  const toggle = useCallback(() => setTransformed(prev => !prev), []);

  useEffect(() => {
    const id = setInterval(toggle, 4000);
    return () => clearInterval(id);
  }, [toggle]);

  const sprite = transformed ? formSprite : normalSprite;
  const label = transformed ? 'Beast Form' : 'Normal';
  const color = transformed ? '#d97706' : '#22c55e';
  const heightScale = getRaceHeightScale(raceId, transformed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <SpriteAnimation
        spriteData={sprite}
        animation="idle"
        scale={scale * heightScale}
        speed={speed}
      />
      <div style={{
        background: `${color}33`,
        border: `1px solid ${color}88`,
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 9,
        color: '#e5e5e5',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
    </div>
  );
}
