import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BATTLE } from '../constants/layers';

function Particle({ x, y, color, size, duration, type, delay = 0 }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!active) return null;

  const style = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    borderRadius: '50%',
    background: type === 'spark' 
      ? `radial-gradient(circle, ${color}, ${color}88, transparent)`
      : color,
    boxShadow: `0 0 ${size * 2}px ${color}88`,
    pointerEvents: 'none',
    animation: `particleFade ${duration}s ease-out forwards`,
    zIndex: BATTLE.VFX_LAYER,
    transform: 'translate(-50%, -50%)',
  };

  return <div style={style} />;
}

export function CastingParticles({ x, y, color = '#8b5cf6', count = 16 }) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 2 + Math.random() * 3;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * (radius * 0.6);
    particles.push(
      <Particle
        key={i}
        x={px}
        y={py}
        color={color}
        size={3 + Math.random() * 4}
        duration={0.6 + Math.random() * 0.4}
        type="spark"
        delay={i * 30}
      />
    );
  }
  // Spiral ring particles using spiralCast keyframe
  for (let i = 0; i < 6; i++) {
    const startAngle = (i / 6) * 360;
    particles.push(
      <div
        key={`spiral_${i}`}
        style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          width: 5, height: 5, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}, transparent)`,
          boxShadow: `0 0 8px ${color}`,
          pointerEvents: 'none',
          animation: `spiralCast 0.8s ease-out ${i * 60}ms forwards`,
          transform: `rotate(${startAngle}deg) translateX(0)`,
          zIndex: BATTLE.VFX_LAYER,
          opacity: 0,
        }}
      />
    );
  }
  return <>{particles}</>;
}

export function HitParticles({ x, y, color = '#ef4444', count = 10 }) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() - 0.5) * Math.PI;
    const dist = 1 + Math.random() * 5;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * (dist * 0.4) - Math.random() * 3;
    particles.push(
      <Particle
        key={i}
        x={px}
        y={py}
        color={color}
        size={2 + Math.random() * 4}
        duration={0.5 + Math.random() * 0.3}
        type="spark"
        delay={i * 15}
      />
    );
  }
  return <>{particles}</>;
}

export function HealParticles({ x, y, count = 10 }) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const px = x + (Math.random() - 0.5) * 6;
    const py = y + Math.random() * 4;
    particles.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${px}%`,
          top: `${py}%`,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: i % 2 === 0 ? '#22c55e' : '#6ee7b7',
          boxShadow: '0 0 6px #22c55e88',
          pointerEvents: 'none',
          animation: `healRise 1s ease-out ${i * 80}ms forwards`,
          zIndex: BATTLE.VFX_LAYER,
          opacity: 0,
        }}
      />
    );
  }
  return <>{particles}</>;
}

export function BuffAuraParticles({ x, y, color = '#38bdf8', count = 6 }) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const startAngle = (i / count) * 360;
    particles.push(
      <div
        key={i}
        style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          width: 4, height: 4, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}, transparent)`,
          boxShadow: `0 0 6px ${color}88`,
          pointerEvents: 'none',
          animation: `buffAuraOrbit 2s linear ${i * (2000 / count)}ms infinite`,
          transformOrigin: '0 0',
          zIndex: BATTLE.VFX_LAYER,
        }}
      />
    );
  }
  return <>{particles}</>;
}

export function LevelUpBurst({ x, y, color = '#fbbf24' }) {
  const rays = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 360;
    rays.push(
      <div
        key={i}
        style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          width: 3, height: 16, borderRadius: 2,
          background: `linear-gradient(180deg, ${color}, transparent)`,
          boxShadow: `0 0 8px ${color}88`,
          pointerEvents: 'none',
          transform: `translate(-50%, -100%) rotate(${angle}deg)`,
          transformOrigin: '50% 100%',
          animation: `levelUpBurst 0.8s ease-out forwards`,
          zIndex: BATTLE.VFX_LAYER,
          opacity: 0,
        }}
      />
    );
  }
  return <>{rays}</>;
}

export default function AmbientParticles() {
  const [particles, setParticles] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = idRef.current++;
      setParticles(prev => {
        const filtered = prev.filter(p => Date.now() - p.created < 6000);
        return [...filtered, {
          id,
          x: Math.random() * 100,
          y: 30 + Math.random() * 60,
          created: Date.now(),
        }];
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            boxShadow: '0 0 4px rgba(255,255,255,0.15)',
            pointerEvents: 'none',
            animation: 'ambientFloat 6s ease-in-out forwards',
            zIndex: BATTLE.PARTICLES,
          }}
        />
      ))}
    </>
  );
}
