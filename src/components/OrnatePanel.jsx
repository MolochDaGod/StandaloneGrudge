import React from 'react';

const GOLD = '#b8963e';
const GOLD_LIGHT = '#d4af5a';
const GOLD_DARK = '#7a6328';
const GOLD_HIGHLIGHT = '#e8d48a';
const GEM_RED = '#a83232';
const GEM_HIGHLIGHT = '#e85454';
const LEATHER_BG = '#1a1a1f';
const LEATHER_LIGHT = '#222228';
const BORDER_OUTER = '#3d3220';
const BORDER_INNER = '#5a4a2e';

const cornerBase = {
  position: 'absolute',
  width: 28,
  height: 28,
  pointerEvents: 'none',
  zIndex: 2,
};

function Corner({ position }) {
  const pos = {};
  const filigreeDir = {};

  if (position === 'tl') { pos.top = -1; pos.left = -1; filigreeDir.scaleX = 1; filigreeDir.scaleY = 1; }
  if (position === 'tr') { pos.top = -1; pos.right = -1; filigreeDir.scaleX = -1; filigreeDir.scaleY = 1; }
  if (position === 'bl') { pos.bottom = -1; pos.left = -1; filigreeDir.scaleX = 1; filigreeDir.scaleY = -1; }
  if (position === 'br') { pos.bottom = -1; pos.right = -1; filigreeDir.scaleX = -1; filigreeDir.scaleY = -1; }

  return (
    <div style={{ ...cornerBase, ...pos }}>
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: `scaleX(${filigreeDir.scaleX}) scaleY(${filigreeDir.scaleY})`, display: 'block' }}>
        <path d="M2 2 Q2 14 8 18 Q4 12 4 4 Z" fill={GOLD_DARK} opacity="0.9" />
        <path d="M2 2 Q14 2 18 8 Q12 4 4 4 Z" fill={GOLD_DARK} opacity="0.9" />

        <path d="M3 3 Q3 12 7 16 Q5 10 5 5 Z" fill={GOLD} />
        <path d="M3 3 Q12 3 16 7 Q10 5 5 5 Z" fill={GOLD} />

        <path d="M4 4 Q4 10 6 13" stroke={GOLD_HIGHLIGHT} strokeWidth="0.5" fill="none" opacity="0.6" />
        <path d="M4 4 Q10 4 13 6" stroke={GOLD_HIGHLIGHT} strokeWidth="0.5" fill="none" opacity="0.6" />

        <ellipse cx="5" cy="5" rx="3.5" ry="3.5" fill={GEM_RED} />
        <ellipse cx="5" cy="5" rx="3" ry="3" fill="url(#gemGrad)" />
        <ellipse cx="4" cy="4" rx="1.2" ry="0.8" fill={GEM_HIGHLIGHT} opacity="0.7" />

        <path d="M7 16 Q9 20 6 24" stroke={GOLD_DARK} strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M16 7 Q20 9 24 6" stroke={GOLD_DARK} strokeWidth="1" fill="none" opacity="0.5" />

        <defs>
          <radialGradient id="gemGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor={GEM_HIGHLIGHT} />
            <stop offset="50%" stopColor={GEM_RED} />
            <stop offset="100%" stopColor="#5a1a1a" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export function OrnatePanel({ children, style, corners = true, className, borderWidth = 2, ...props }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: `
          radial-gradient(ellipse at 30% 20%, ${LEATHER_LIGHT} 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, ${LEATHER_LIGHT} 0%, transparent 50%),
          linear-gradient(135deg, #1e1e24 0%, ${LEATHER_BG} 40%, #16161b 100%)
        `,
        border: `${borderWidth}px solid ${GOLD_DARK}`,
        boxShadow: `
          inset 0 0 0 1px ${BORDER_INNER}40,
          inset 0 1px 0 ${GOLD_HIGHLIGHT}15,
          0 0 8px rgba(0,0,0,0.6),
          0 2px 12px rgba(0,0,0,0.4)
        `,
        overflow: 'visible',
        ...style,
      }}
      {...props}
    >
      {corners && (
        <>
          <Corner position="tl" />
          <Corner position="tr" />
          <Corner position="bl" />
          <Corner position="br" />
        </>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        border: `1px solid ${GOLD}30`,
        pointerEvents: 'none',
        zIndex: 1,
        margin: 2,
      }} />

      {children}
    </div>
  );
}

export function OrnateSlot({ children, active, empty, size = 40, style, ...props }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: empty
          ? `linear-gradient(145deg, #0f0f13 0%, #181820 50%, #0d0d12 100%)`
          : `linear-gradient(145deg, #15151c 0%, #1c1c26 50%, #121218 100%)`,
        border: `1.5px solid ${active ? GOLD_LIGHT : GOLD_DARK}`,
        boxShadow: active
          ? `inset 0 0 6px rgba(255,215,0,0.15), 0 0 4px rgba(255,215,0,0.2)`
          : `inset 0 1px 3px rgba(0,0,0,0.5), inset 0 -1px 0 ${GOLD_DARK}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function OrnateHotbar({ children, slotCount = 8, style }) {
  return (
    <OrnatePanel
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        ...style,
      }}
    >
      <div style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 3,
        width: '100%',
      }}>
        {children}
      </div>
    </OrnatePanel>
  );
}

export default OrnatePanel;
