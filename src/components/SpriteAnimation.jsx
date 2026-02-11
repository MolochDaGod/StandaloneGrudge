import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const EQUIPMENT_OVERLAY_REGIONS = {
  weapon: { top: '45%', left: '0%', width: '40%', height: '35%', label: 'Weapon' },
  helmet: { top: '0%', left: '15%', width: '70%', height: '28%', label: 'Helm' },
  armor: { top: '28%', left: '10%', width: '80%', height: '35%', label: 'Chest' },
  feet: { top: '75%', left: '10%', width: '80%', height: '25%', label: 'Feet' },
};

const TIER_OVERLAY_CONFIG = {
  1: { opacity: 0, pulse: false },
  2: { opacity: 0.12, pulse: false },
  3: { opacity: 0.18, pulse: false },
  4: { opacity: 0.22, pulse: true, pulseSpeed: '3s' },
  5: { opacity: 0.28, pulse: true, pulseSpeed: '2.5s' },
  6: { opacity: 0.32, pulse: true, pulseSpeed: '2s' },
  7: { opacity: 0.38, pulse: true, pulseSpeed: '1.5s' },
  8: { opacity: 0.44, pulse: true, pulseSpeed: '1.2s' },
};

let overlayStyleInjected = false;
function injectOverlayStyles() {
  if (overlayStyleInjected) return;
  overlayStyleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes equipOverlayPulse {
      0%, 100% { opacity: var(--overlay-base-opacity, 0.2); }
      50% { opacity: calc(var(--overlay-base-opacity, 0.2) + 0.15); }
    }
    @keyframes equipOverlayShimmer {
      0% { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}

function EquipmentOverlay({ slot, color, tier, displayWidth, displayHeight }) {
  const region = EQUIPMENT_OVERLAY_REGIONS[slot];
  const config = TIER_OVERLAY_CONFIG[tier] || TIER_OVERLAY_CONFIG[1];
  if (!region || config.opacity <= 0) return null;

  injectOverlayStyles();

  const baseStyle = {
    position: 'absolute',
    top: region.top,
    left: region.left,
    width: region.width,
    height: region.height,
    background: color,
    mixBlendMode: 'color',
    pointerEvents: 'none',
    borderRadius: '30%',
    '--overlay-base-opacity': config.opacity,
    opacity: config.opacity,
  };

  if (config.pulse) {
    baseStyle.animation = `equipOverlayPulse ${config.pulseSpeed} ease-in-out infinite`;
  }

  const shimmerStyle = tier >= 5 ? {
    position: 'absolute',
    top: region.top,
    left: region.left,
    width: region.width,
    height: region.height,
    background: `linear-gradient(90deg, transparent 0%, ${color}44 40%, ${color}88 50%, ${color}44 60%, transparent 100%)`,
    backgroundSize: '200% 100%',
    mixBlendMode: 'screen',
    pointerEvents: 'none',
    borderRadius: '30%',
    opacity: 0.3,
    animation: `equipOverlayShimmer ${tier >= 7 ? '1.5s' : '2.5s'} linear infinite`,
  } : null;

  return (
    <>
      <div style={baseStyle} />
      {shimmerStyle && <div style={shimmerStyle} />}
    </>
  );
}

export default function SpriteAnimation({
  spriteData,
  animation = 'idle',
  scale = 2,
  flip = false,
  onAnimationEnd = null,
  loop = true,
  speed = 120,
  equipmentOverlays = null,
}) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);
  const prevAnimRef = useRef(animation);
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;

  const anim = spriteData?.[animation] || spriteData?.idle;
  const totalFrames = anim?.frames || 1;

  useEffect(() => {
    if (prevAnimRef.current !== animation) {
      prevAnimRef.current = animation;
      setFrame(0);
    }
  }, [animation]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let f = 0;
    setFrame(0);
    intervalRef.current = setInterval(() => {
      f++;
      if (f >= totalFrames) {
        if (loop) {
          f = 0;
        } else {
          f = totalFrames - 1;
          clearInterval(intervalRef.current);
          if (onEndRef.current) onEndRef.current();
        }
      }
      setFrame(f);
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [animation, totalFrames, loop, speed]);

  if (!anim) return null;

  const frameWidth = spriteData?.frameWidth || anim?.frameWidth || 100;
  const frameHeight = spriteData?.frameHeight || anim?.frameHeight || 100;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  const cssFilter = spriteData?.filter || '';
  const tintColor = spriteData?.tint || '';
  const blendMode = spriteData?.blendMode || 'normal';

  const overlayElements = useMemo(() => {
    if (!equipmentOverlays || !Array.isArray(equipmentOverlays)) return null;
    return equipmentOverlays
      .filter(o => o && o.color && o.slot && EQUIPMENT_OVERLAY_REGIONS[o.slot])
      .map((overlay, i) => (
        <EquipmentOverlay
          key={overlay.slot}
          slot={overlay.slot}
          color={overlay.color}
          tier={overlay.tier || 1}
          displayWidth={displayWidth}
          displayHeight={displayHeight}
        />
      ));
  }, [equipmentOverlays, displayWidth, displayHeight]);

  return (
    <div style={{
      width: displayWidth,
      height: displayHeight,
      overflow: 'hidden',
      imageRendering: 'pixelated',
      transform: flip ? 'scaleX(-1)' : 'none',
      position: 'relative',
      mixBlendMode: blendMode,
      outline: 'none',
      border: 'none',
    }}>
      <div style={{
        width: displayWidth,
        height: displayHeight,
        backgroundImage: `url(${anim.src})`,
        backgroundSize: `${totalFrames * displayWidth}px ${displayHeight}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${frame * displayWidth}px 0`,
        imageRendering: 'pixelated',
        filter: cssFilter || 'none',
      }} />
      {tintColor && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: displayWidth,
          height: displayHeight,
          background: tintColor,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }} />
      )}
      {overlayElements}
    </div>
  );
}

export function buildEquipmentOverlays(hero, TIERS) {
  if (!hero?.equipment || !TIERS) return null;
  const overlays = [];
  const slotMapping = {
    weapon: 'weapon',
    helmet: 'helmet',
    armor: 'armor',
    feet: 'feet',
  };

  for (const [eqSlot, overlaySlot] of Object.entries(slotMapping)) {
    const item = hero.equipment[eqSlot];
    if (item && item.tier && item.tier >= 2) {
      const tierInfo = TIERS[item.tier];
      if (tierInfo) {
        overlays.push({
          slot: overlaySlot,
          color: tierInfo.color,
          tier: item.tier,
        });
      }
    }
  }

  return overlays.length > 0 ? overlays : null;
}
