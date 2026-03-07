import React from 'react';

const SPRITE = '/sprites/ui/pixel_ui_pack.png';
const SHEET_W = 1312;
const SHEET_H = 304;

export const RANK_TIERS = [
  { id: 'bronze', name: 'Bronze', minWins: 0, color: '#cd7f32', glow: 'rgba(205,127,50,0.4)', starCount: 1, emblemIdx: 0, borderIdx: 0 },
  { id: 'silver', name: 'Silver', minWins: 5, color: '#c0c0c0', glow: 'rgba(192,192,192,0.4)', starCount: 2, emblemIdx: 1, borderIdx: 1 },
  { id: 'gold', name: 'Gold', minWins: 15, color: '#ffd700', glow: 'rgba(255,215,0,0.5)', starCount: 3, emblemIdx: 2, borderIdx: 2 },
  { id: 'platinum', name: 'Platinum', minWins: 30, color: '#e5e4e2', glow: 'rgba(229,228,226,0.5)', starCount: 4, emblemIdx: 3, borderIdx: 3 },
  { id: 'diamond', name: 'Diamond', minWins: 50, color: '#b9f2ff', glow: 'rgba(185,242,255,0.6)', starCount: 5, emblemIdx: 4, borderIdx: 4 },
  { id: 'legend', name: 'Legend', minWins: 100, color: '#ff6b35', glow: 'rgba(255,107,53,0.6)', starCount: 5, emblemIdx: 5, borderIdx: 5 },
];

export function getRankForWins(wins = 0) {
  let rank = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (wins >= tier.minWins) rank = tier;
  }
  return rank;
}

const STAR_REGIONS = [
  { x: 0, y: 160, w: 24, h: 24 },
  { x: 24, y: 160, w: 24, h: 24 },
  { x: 48, y: 160, w: 24, h: 24 },
  { x: 72, y: 160, w: 24, h: 24 },
  { x: 96, y: 160, w: 24, h: 24 },
  { x: 120, y: 160, w: 24, h: 24 },
];

const WING_REGIONS = [
  { x: 0, y: 232, w: 48, h: 32 },
  { x: 48, y: 232, w: 48, h: 32 },
  { x: 96, y: 232, w: 48, h: 32 },
  { x: 0, y: 264, w: 48, h: 32 },
  { x: 48, y: 264, w: 48, h: 32 },
  { x: 96, y: 264, w: 48, h: 32 },
];

const EMBLEM_COLORS = [
  '#cd7f32',
  '#c0c0c0',
  '#ffd700',
  '#e5e4e2',
  '#b9f2ff',
  '#ff6b35',
];

function PixelStar({ color = '#ffd700', size = 12, filled = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 2px ${color}66)` }}>
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? color : 'transparent'}
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function WingEmblem({ rank, size = 40 }) {
  const idx = Math.min(rank.emblemIdx, WING_REGIONS.length - 1);
  const wing = WING_REGIONS[idx];
  const scale = size / wing.w;
  return (
    <div style={{
      width: size,
      height: wing.h * scale,
      backgroundImage: `url(${SPRITE})`,
      backgroundPosition: `-${wing.x * scale}px -${wing.y * scale}px`,
      backgroundSize: `${SHEET_W * scale}px ${SHEET_H * scale}px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      filter: `drop-shadow(0 0 3px ${rank.glow})`,
    }} />
  );
}

export default function RankBadge({ wins = 0, size = 'md', showLabel = true, showStars = true, showWings = false, compact = false }) {
  const rank = getRankForWins(wins);

  const sizes = {
    xs: { badge: 20, star: 8, font: '0.5rem', wingSize: 24 },
    sm: { badge: 28, star: 10, font: '0.6rem', wingSize: 32 },
    md: { badge: 36, star: 12, font: '0.7rem', wingSize: 40 },
    lg: { badge: 48, star: 16, font: '0.85rem', wingSize: 56 },
    xl: { badge: 64, star: 20, font: '1rem', wingSize: 72 },
  };
  const s = sizes[size] || sizes.md;

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
      }}>
        <div style={{
          width: s.badge * 0.7,
          height: s.badge * 0.7,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rank.color}44 0%, ${rank.color}11 70%)`,
          border: `2px solid ${rank.color}`,
          boxShadow: `0 0 6px ${rank.glow}, inset 0 0 4px ${rank.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <PixelStar color={rank.color} size={s.star * 0.8} />
        </div>
        {showLabel && (
          <span style={{
            fontSize: s.font,
            fontWeight: 700,
            color: rank.color,
            fontFamily: "'Cinzel', serif",
            textShadow: `0 0 4px ${rank.glow}`,
          }}>
            {rank.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      position: 'relative',
    }}>
      {showWings && <WingEmblem rank={rank} size={s.wingSize} />}

      <div style={{
        width: s.badge,
        height: s.badge,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${rank.color}33 0%, ${rank.color}08 60%, transparent 100%)`,
        border: `2px solid ${rank.color}`,
        boxShadow: `0 0 8px ${rank.glow}, inset 0 0 6px ${rank.glow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          inset: 2,
          borderRadius: '50%',
          border: `1px solid ${rank.color}44`,
        }} />
        <PixelStar color={rank.color} size={s.star} />
      </div>

      {showStars && (
        <div style={{
          display: 'flex',
          gap: 1,
          marginTop: -2,
        }}>
          {Array.from({ length: rank.starCount }).map((_, i) => (
            <PixelStar key={i} color={rank.color} size={s.star * 0.7} />
          ))}
        </div>
      )}

      {showLabel && (
        <div style={{
          fontSize: s.font,
          fontWeight: 700,
          color: rank.color,
          fontFamily: "'Cinzel', serif",
          textShadow: `0 0 4px ${rank.glow}`,
          letterSpacing: 1,
        }}>
          {rank.name}
        </div>
      )}
    </div>
  );
}

export function RankBadgeInline({ wins = 0, size = 14 }) {
  const rank = getRankForWins(wins);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '1px 6px',
      borderRadius: 8,
      background: `${rank.color}15`,
      border: `1px solid ${rank.color}40`,
    }}>
      <PixelStar color={rank.color} size={size} />
      <span style={{
        fontSize: size * 0.75,
        fontWeight: 700,
        color: rank.color,
        fontFamily: "'Cinzel', serif",
      }}>
        {rank.name}
      </span>
    </span>
  );
}
