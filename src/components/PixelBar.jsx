import React from 'react';

const SPRITE = '/sprites/ui/pixel_ui_pack.png';
const SHEET_W = 1312;
const SHEET_H = 304;

const BAR_PRESETS = {
  hp: {
    frameX: 780, frameY: 0, frameW: 130, frameH: 14,
    fillX: 780, fillY: 16, fillW: 126, fillH: 10,
    fillOffsetX: 2, fillOffsetY: 2,
    glowColor: 'rgba(239,68,68,0.4)',
  },
  hpGreen: {
    frameX: 780, frameY: 0, frameW: 130, frameH: 14,
    fillX: 780, fillY: 32, fillW: 126, fillH: 10,
    fillOffsetX: 2, fillOffsetY: 2,
    glowColor: 'rgba(34,197,94,0.3)',
  },
  mana: {
    frameX: 780, frameY: 48, frameW: 130, frameH: 14,
    fillX: 780, fillY: 64, fillW: 126, fillH: 10,
    fillOffsetX: 2, fillOffsetY: 2,
    glowColor: 'rgba(59,130,246,0.3)',
  },
  actionTimer: {
    frameX: 780, frameY: 96, frameW: 130, frameH: 14,
    fillX: 780, fillY: 112, fillW: 126, fillH: 10,
    fillOffsetX: 2, fillOffsetY: 2,
    glowColor: 'rgba(180,180,200,0.2)',
  },
  stamina: {
    frameX: 780, frameY: 128, frameW: 130, frameH: 14,
    fillX: 780, fillY: 144, fillW: 126, fillH: 10,
    fillOffsetX: 2, fillOffsetY: 2,
    glowColor: 'rgba(245,158,11,0.3)',
  },
  grudge: {
    frameX: 780, frameY: 160, frameW: 130, frameH: 14,
    fillX: 780, fillY: 176, fillW: 126, fillH: 10,
    fillOffsetX: 2, fillOffsetY: 2,
    glowColor: 'rgba(168,85,247,0.4)',
  },
  xp: {
    frameX: 780, frameY: 192, frameW: 130, frameH: 14,
    fillX: 780, fillY: 208, fillW: 126, fillH: 10,
    fillOffsetX: 2, fillOffsetY: 2,
    glowColor: 'rgba(6,182,212,0.3)',
  },
};

const COLOR_TO_PRESET = {
  '#22c55e': 'hpGreen',
  '#ef4444': 'hp',
  '#dc2626': 'grudge',
  '#3b82f6': 'mana',
  '#f59e0b': 'stamina',
  '#a855f7': 'grudge',
  '#06b6d4': 'xp',
  '#555': 'actionTimer',
};

export default function PixelBar({
  current,
  max,
  color,
  preset,
  height = 12,
  width = 120,
  showLabel = false,
  label = '',
  animate = true,
  isCritical = false,
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = pct < 25;
  const isCrit = pct < 10 && pct > 0;

  const presetKey = preset || COLOR_TO_PRESET[color] || 'hp';
  const bar = BAR_PRESETS[presetKey] || BAR_PRESETS.hp;

  const scaleX = width / bar.frameW;
  const scaleY = height / bar.frameH;

  const fillWidth = Math.round((pct / 100) * (bar.fillW * scaleX));

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      imageRendering: 'pixelated',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${SPRITE})`,
        backgroundPosition: `-${bar.frameX * scaleX}px -${bar.frameY * scaleY}px`,
        backgroundSize: `${SHEET_W * scaleX}px ${SHEET_H * scaleY}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }} />

      <div style={{
        position: 'absolute',
        top: bar.fillOffsetY * scaleY,
        left: bar.fillOffsetX * scaleX,
        height: bar.fillH * scaleY,
        width: fillWidth,
        overflow: 'hidden',
        transition: animate ? 'width 0.4s ease' : 'none',
      }}>
        <div style={{
          width: bar.fillW * scaleX,
          height: bar.fillH * scaleY,
          backgroundImage: `url(${SPRITE})`,
          backgroundPosition: `-${bar.fillX * scaleX}px -${bar.fillY * scaleY}px`,
          backgroundSize: `${SHEET_W * scaleX}px ${SHEET_H * scaleY}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: (isCrit || isCritical) ? 'brightness(1.4) saturate(1.5)' : 'none',
        }} />
      </div>

      {(isCrit || isCritical) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          boxShadow: `inset 0 0 4px rgba(255,60,60,0.6)`,
          animation: 'pulse 0.8s infinite',
          pointerEvents: 'none',
        }} />
      )}

      {isLow && pct > 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          boxShadow: `0 0 6px ${bar.glowColor}`,
          animation: 'pulse 1.2s infinite',
          pointerEvents: 'none',
        }} />
      )}

      {showLabel && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(7, height * 0.6),
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          pointerEvents: 'none',
          fontFamily: "'Cinzel', serif",
          letterSpacing: 0.5,
        }}>
          {label || `${current}/${max}`}
        </div>
      )}
    </div>
  );
}

export function ActionTimerBar({ progress, width = 120, height = 8, isActive = false }) {
  return (
    <div style={{
      position: 'relative',
      width,
      height,
      imageRendering: 'pixelated',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%)',
        border: '1px solid #3a3a4e',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${Math.max(0, Math.min(100, progress))}%`,
          background: isActive
            ? 'linear-gradient(180deg, #ffd700 0%, #ffaa00 40%, #cc8800 100%)'
            : 'linear-gradient(180deg, #8a8a9e 0%, #6a6a7e 40%, #4a4a5e 100%)',
          transition: 'width 0.3s ease',
          boxShadow: isActive ? '0 0 8px rgba(255,215,0,0.6)' : 'none',
        }} />
        {isActive && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${progress}%`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }} />
        )}
      </div>
      {isActive && (
        <div style={{
          position: 'absolute',
          right: -2,
          top: -1,
          bottom: -1,
          width: 3,
          background: '#ffd700',
          boxShadow: '0 0 4px rgba(255,215,0,0.8)',
          animation: 'pulse 0.6s infinite',
        }} />
      )}
    </div>
  );
}
