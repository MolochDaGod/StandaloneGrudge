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

export function CastingParticles({ x, y, color = '#8b5cf6', count = 8 }) {
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
        delay={i * 40}
      />
    );
  }
  return <>{particles}</>;
}

export function HitParticles({ x, y, color = '#ef4444', count = 6 }) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() - 0.5) * Math.PI;
    const dist = 1 + Math.random() * 4;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * (dist * 0.5) - Math.random() * 2;
    particles.push(
      <Particle
        key={i}
        x={px}
        y={py}
        color={color}
        size={2 + Math.random() * 3}
        duration={0.4 + Math.random() * 0.3}
        type="spark"
        delay={i * 20}
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
