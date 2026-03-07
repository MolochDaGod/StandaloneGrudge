import React from 'react';

const SPRITE = '/sprites/ui/pixel_ui_pack.png';
const SHEET_W = 1312;
const SHEET_H = 304;

export default function PixelSpinner({ size = 32, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: size,
        height: size,
        border: `3px solid ${color}22`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        boxShadow: `0 0 8px ${color}33`,
      }} />
      <div style={{
        position: 'absolute',
        width: size * 0.4,
        height: size * 0.4,
        backgroundImage: `url(${SPRITE})`,
        backgroundPosition: `-${440 * (size * 0.4 / 24)}px -${220 * (size * 0.4 / 24)}px`,
        backgroundSize: `${SHEET_W * (size * 0.4 / 24)}px ${SHEET_H * (size * 0.4 / 24)}px`,
        imageRendering: 'pixelated',
        opacity: 0.6,
        animation: 'spin 2s linear infinite reverse',
      }} />
    </div>
  );
}

export function PixelDivider({ width = '100%', color = 'var(--accent)', variant = 'gold' }) {
  const colors = {
    gold: { c1: '#FAAC47', c2: '#DB6331', c3: '#FAAC4744' },
    red: { c1: '#ef4444', c2: '#8B372E', c3: '#ef444433' },
    blue: { c1: '#3b82f6', c2: '#1d4ed8', c3: '#3b82f633' },
    purple: { c1: '#a855f7', c2: '#6b21a8', c3: '#a855f733' },
    grey: { c1: '#9ca3af', c2: '#4b5563', c3: '#9ca3af33' },
  };
  const c = colors[variant] || colors.gold;

  return (
    <div style={{
      width,
      height: 3,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        flex: 1,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${c.c1}88, ${c.c2}44, transparent)`,
      }} />
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${c.c1}, ${c.c2})`,
        boxShadow: `0 0 6px ${c.c3}`,
        margin: '0 4px',
      }} />
      <div style={{
        flex: 1,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${c.c2}44, ${c.c1}88, transparent)`,
      }} />
    </div>
  );
}

export function GlowOrb({ color = '#FAAC47', size = 16, animate = true }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}88 40%, ${color}33 70%, transparent 100%)`,
      boxShadow: `0 0 ${size * 0.6}px ${color}55, inset 0 0 ${size * 0.3}px ${color}44`,
      animation: animate ? 'pulse 2s ease-in-out infinite' : 'none',
    }} />
  );
}
