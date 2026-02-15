import React, { useState, useEffect, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getWorgTransformSprite } from '../data/spriteMap';
import { classes } from '../data/classes';

const worge = classes.worge;
const normalSkills = worge.abilities.filter(a =>
  worge.bearFormAbilities[a.id]
).map(a => ({ name: a.name, icon: a.icon }));

const formSkills = Object.values(worge.bearFormAbilities).map(a => ({
  name: a.name, icon: a.icon
}));

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
  const skills = transformed ? formSkills : normalSkills;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <SpriteAnimation
        spriteData={sprite}
        animation="idle"
        scale={scale}
        speed={speed}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        {skills.map(s => (
          <div key={s.name} style={{
            background: transformed ? 'rgba(220,38,38,0.25)' : 'rgba(34,197,94,0.2)',
            border: `1px solid ${transformed ? 'rgba(220,38,38,0.5)' : 'rgba(34,197,94,0.4)'}`,
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 9,
            color: '#e5e5e5',
            whiteSpace: 'nowrap',
          }}>
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}
