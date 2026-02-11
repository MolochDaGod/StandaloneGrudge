import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation, { buildEquipmentOverlays } from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite, getWorgTransformSprite, warriorTransformSprite, getAbilityEffect, beamTrails, effectSprites } from '../data/spriteMap';
import AmbientParticles, { CastingParticles, HitParticles, HealParticles } from './BattleParticles';
import { UI_PANELS, UI_SLOTS, UI_ICONS, SpriteIcon, getItemSpriteIcon, InlineIcon } from '../data/uiSprites.jsx';
import { TIERS, EQUIPMENT_SLOTS } from '../data/equipment';
import { playSwordHit, playMagicCast, playHeal, playBuff, playHurt, playCrit, playDodge, playVictory, playDefeat, setBgm } from '../utils/audioManager';
import AbilityIcon from './AbilityIcon';

const locationBackgrounds = {
  verdant_plains: '/backgrounds/verdant_plains.png',
  dark_forest: '/backgrounds/dark_forest.png',
  cursed_ruins: '/backgrounds/cursed_ruins.png',
  blood_canyon: '/backgrounds/blood_canyon.png',
  dragon_peaks: '/backgrounds/dragon_peaks.png',
  shadow_citadel: '/backgrounds/shadow_citadel.png',
  demon_gate: '/backgrounds/demon_gate.png',
  void_throne: '/backgrounds/void_throne.png',
  molten_core: '/backgrounds/volcanic_field.png',
  obsidian_wastes: '/backgrounds/volcanic_field.png',
  ruins_of_ashenmoor: '/backgrounds/volcanic_field.png',
  infernal_forge: '/backgrounds/infernal_arena.png',
  dreadmaw_canyon: '/backgrounds/infernal_arena.png',
  mystic_grove: '/backgrounds/mystic_grove.png',
  whispering_caverns: '/backgrounds/whispering_caverns.png',
  haunted_marsh: '/backgrounds/haunted_marsh.png',
  crystal_caves: '/backgrounds/crystal_caves.png',
  thornwood_pass: '/backgrounds/thornwood_pass.png',
  sunken_temple: '/backgrounds/sunken_temple.png',
  iron_peaks: '/backgrounds/boss_mountain.png',
  shadow_forest: '/backgrounds/shadow_forest.png',
  frozen_tundra: '/backgrounds/winter_arena.png',
  blight_hollow: '/backgrounds/blight_hollow.png',
  stormspire_peak: '/backgrounds/storm_ruins.png',
  corrupted_spire: '/backgrounds/corrupted_spire.png',
  abyssal_depths: '/backgrounds/abyssal_depths.png',
  ashen_battlefield: '/backgrounds/storm_ruins.png',
  windswept_ridge: '/backgrounds/boss_mountain.png',
  void_threshold: '/backgrounds/void_threshold.png',
  crystal_lake: '/backgrounds/winter_arena.png',
  hall_of_odin: '/backgrounds/hall_of_odin.png',
  maw_of_madra: '/backgrounds/maw_of_madra.png',
  sanctum_of_omni: '/backgrounds/sanctum_of_omni.png',
};

const zoneGradients = {
  camp: 'linear-gradient(180deg, #1a2a1a 0%, #0d1a0d 30%, #0a140a 60%, #060e06 100%)',
  verdant_plains: 'linear-gradient(180deg, #1a2e1a 0%, #142614 30%, #0f1e0f 60%, #0a1a0a 100%)',
  whispering_woods: 'linear-gradient(180deg, #1a2818 0%, #0e1e0d 40%, #091409 70%, #050e05 100%)',
  ironhold: 'linear-gradient(180deg, #2a2020 0%, #1e1616 40%, #140e0e 70%, #0e0808 100%)',
  crystal_lake: 'linear-gradient(180deg, #1a2030 0%, #0e1620 40%, #0a1018 70%, #060a10 100%)',
  thornvale: 'linear-gradient(180deg, #2a1a2a 0%, #1e0e1e 40%, #140814 70%, #0e040e 100%)',
  shadow_marsh: 'linear-gradient(180deg, #1a1a2e 0%, #10102a 40%, #0a0a20 70%, #060618 100%)',
  dark_forest: 'linear-gradient(180deg, #0e1a0e 0%, #0a120a 40%, #060e06 70%, #040a04 100%)',
  cursed_ruins: 'linear-gradient(180deg, #201520 0%, #180e18 40%, #100810 70%, #0a040a 100%)',
  blood_canyon: 'linear-gradient(180deg, #2e1010 0%, #200a0a 40%, #180606 70%, #100404 100%)',
  dragon_peaks: 'linear-gradient(180deg, #1e1e28 0%, #141420 40%, #0e0e18 70%, #080810 100%)',
  shadow_citadel: 'linear-gradient(180deg, #18102e 0%, #100a22 40%, #0a0618 70%, #06040e 100%)',
  demon_gate: 'linear-gradient(180deg, #2e0a10 0%, #200610 40%, #180408 70%, #100206 100%)',
  void_throne: 'linear-gradient(180deg, #0a0a2e 0%, #060620 40%, #040418 70%, #020210 100%)',
  molten_core: 'linear-gradient(180deg, #2e1a08 0%, #201206 40%, #180e04 70%, #100a02 100%)',
  obsidian_wastes: 'linear-gradient(180deg, #1e1410 0%, #160e0a 40%, #100a06 70%, #0a0604 100%)',
  volcanic_field: 'linear-gradient(180deg, #2a1208 0%, #1e0e06 40%, #160a04 70%, #0e0604 100%)',
  infernal_forge: 'linear-gradient(180deg, #301008 0%, #220a06 40%, #1a0604 70%, #120402 100%)',
  dreadmaw_canyon: 'linear-gradient(180deg, #281410 0%, #1e100a 40%, #160a06 70%, #0e0604 100%)',
  frozen_pass: 'linear-gradient(180deg, #1a2030 0%, #141828 40%, #0e1220 70%, #0a0e18 100%)',
  frost_hollow: 'linear-gradient(180deg, #182838 0%, #101e2e 40%, #0a1624 70%, #06101c 100%)',
  glacial_tomb: 'linear-gradient(180deg, #142030 0%, #0e1828 40%, #0a1220 70%, #060e18 100%)',
  icewind_summit: 'linear-gradient(180deg, #1a2838 0%, #121e2e 40%, #0c1626 70%, #08101e 100%)',
  ruins_of_ashenmoor: 'linear-gradient(180deg, #201818 0%, #181010 40%, #100a0a 70%, #0a0606 100%)',
  ashenmoor_gate: 'linear-gradient(180deg, #1e1416 0%, #160e10 40%, #10080a 70%, #0a0406 100%)',
  citadel_of_ash: 'linear-gradient(180deg, #2a1a18 0%, #201210 40%, #180c0a 70%, #100806 100%)',
  default: 'linear-gradient(180deg, #141828 0%, #0e1220 40%, #0a0e18 70%, #060a10 100%)',
};

const critEffectPools = {
  spell: [
    { key: 'felSpell', filter: 'brightness(1.6) saturate(1.5)' },
    { key: 'sunburn', filter: 'brightness(1.5) saturate(1.8)' },
    { key: 'vortex', filter: 'brightness(1.4) hue-rotate(30deg) saturate(1.5)' },
    { key: 'nebula', filter: 'brightness(1.5) saturate(2)' },
    { key: 'midnight', filter: 'brightness(1.6) saturate(1.8)' },
  ],
  melee: [
    { key: 'flameLash', filter: 'brightness(1.5) saturate(1.8)' },
    { key: 'weaponHit', filter: 'brightness(1.6) saturate(1.5)' },
    { key: 'fireSpin', filter: 'brightness(1.5) saturate(2)' },
    { key: 'brightFire', filter: 'brightness(1.4) saturate(1.8)' },
    { key: 'fireExplosion', filter: 'brightness(1.5) saturate(1.5)' },
  ],
};

function getRandomCritEffect(type) {
  const pool = critEffectPools[type] || critEffectPools.melee;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { sprite: effectSprites[pick.key], filter: pick.filter };
}

const SLASH_COLORS = {
  red: { sm: 'slashRedSm', md: 'slashRedMd', lg: 'slashRedLg' },
  blue: { sm: 'slashBlueSm', md: 'slashBlueMd', lg: 'slashBlueLg' },
  green: { sm: 'slashGreenSm', md: 'slashGreenMd', lg: 'slashGreenLg' },
  purple: { sm: 'slashPurpleSm', md: 'slashPurpleMd', lg: 'slashPurpleLg' },
  orange: { sm: 'slashOrangeSm', md: 'slashOrangeMd', lg: 'slashOrangeLg' },
};

function getSlashColor(abilityType, abilityName, classId) {
  const n = (abilityName || '').toLowerCase();
  if (n.includes('fire') || n.includes('hellfire') || n.includes('ignite') || n.includes('flame')) return 'orange';
  if (n.includes('ice') || n.includes('frost') || n.includes('arcane') || n.includes('mana')) return 'blue';
  if (n.includes('lightning') || n.includes('thunder') || n.includes('storm') || n.includes('chain')) return 'blue';
  if (n.includes('poison') || n.includes('venom') || n.includes('nature') || n.includes('heal') || n.includes('rejuv')) return 'green';
  if (n.includes('shadow') || n.includes('dark') || n.includes('void') || n.includes('demon') || n.includes('chaos') || n.includes('curse') || n.includes('soul')) return 'purple';
  if (abilityType === 'magical') {
    if (classId === 'mage') return 'purple';
    if (classId === 'worge') return 'green';
    return 'blue';
  }
  if (classId === 'ranger') return 'green';
  return 'red';
}

function StackedSlashImpact({ x, y, level, color = 'red' }) {
  const [frame, setFrame] = React.useState(0);
  const rotRef = React.useRef(45 + Math.random() * 30);
  const colorSet = SLASH_COLORS[color] || SLASH_COLORS.red;
  const layers = level === 'large'
    ? [{ key: colorSet.lg, size: 140 }, { key: colorSet.md, size: 90 }]
    : [{ key: colorSet.md, size: 100 }, { key: colorSet.sm, size: 55 }];

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= 8) { clearInterval(interval); return; }
      setFrame(f);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', zIndex: 260, pointerEvents: 'none' }}>
      {layers.map((layer, i) => {
        const sprite = effectSprites[layer.key];
        if (!sprite) return null;
        const sz = layer.size;
        const scale = sz / sprite.frameW;
        const sheetW = sprite.cols * sprite.frameW * scale;
        const sheetH = sprite.frameH * scale;
        const rot = i === 0 ? 0 : rotRef.current;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            width: sz, height: sz,
            overflow: 'hidden',
            mixBlendMode: 'screen',
            opacity: i === 0 ? 1 : 0.85,
          }}>
            <div style={{
              width: sz, height: sz,
              backgroundImage: `url(${sprite.src})`,
              backgroundSize: `${sheetW}px ${sheetH}px`,
              backgroundPosition: `-${frame * sprite.frameW * scale}px 0px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }} />
          </div>
        );
      })}
    </div>
  );
}

function EffectSprite({ x, y, sprite, filter: filterProp }) {
  const [frame, setFrame] = React.useState(0);
  const totalFrames = sprite.frames;
  const displaySize = 120;

  const hasCustomLayout = sprite.cols !== undefined;
  const cols = hasCustomLayout ? sprite.cols : Math.round(Math.sqrt(sprite.frames));
  const frameW = hasCustomLayout ? sprite.frameW : (sprite.size / cols);
  const frameH = hasCustomLayout ? sprite.frameH : (sprite.size / cols);
  const scaleX = displaySize / frameW;
  const scaleY = displaySize / frameH;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= totalFrames) {
        clearInterval(interval);
        return;
      }
      setFrame(f);
    }, 35);
    return () => clearInterval(interval);
  }, [totalFrames]);

  const col = frame % cols;
  const row = Math.floor(frame / cols);

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      width: displaySize, height: displaySize,
      overflow: 'hidden',
      zIndex: 250,
      pointerEvents: 'none',
      mixBlendMode: 'screen',
    }}>
      <div style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${cols * frameW * scaleX}px ${(sprite.rows || Math.ceil(totalFrames / cols)) * frameH * scaleY}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        mixBlendMode: 'screen',
        ...(filterProp ? { filter: filterProp } : {}),
      }} />
    </div>
  );
}

function GrowingEffectSprite({ x, y, sprite, filter: filterProp, startScale = 0.5, endScale = 1.8 }) {
  const [frame, setFrame] = React.useState(0);
  if (!sprite) return null;
  const totalFrames = sprite.frames;
  const baseSize = 160;

  const cols = sprite.cols || Math.round(Math.sqrt(sprite.frames));
  const rows = sprite.rows || Math.ceil(totalFrames / cols);
  const frameW = sprite.frameW || (sprite.size ? sprite.size / cols : (sprite.width / cols));
  const frameH = sprite.frameH || (sprite.size ? sprite.size / cols : (sprite.height / rows));

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= totalFrames) {
        clearInterval(interval);
        return;
      }
      setFrame(f);
    }, 40);
    return () => clearInterval(interval);
  }, [totalFrames]);

  const progress = totalFrames > 1 ? frame / (totalFrames - 1) : 1;
  const currentScale = startScale + (endScale - startScale) * progress;
  const displaySize = baseSize * currentScale;
  const scaleX = displaySize / frameW;
  const scaleY = displaySize / frameH;
  const col = frame % cols;
  const row = Math.floor(frame / cols);

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      width: displaySize, height: displaySize,
      overflow: 'hidden',
      zIndex: 260,
      pointerEvents: 'none',
      mixBlendMode: 'screen',
      opacity: progress > 0.85 ? Math.max(0, 1 - (progress - 0.85) / 0.15) : 1,
    }}>
      <div style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${cols * frameW * scaleX}px ${rows * frameH * scaleY}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        mixBlendMode: 'screen',
        ...(filterProp ? { filter: filterProp } : {}),
      }} />
    </div>
  );
}

function ThunderProjectileSprite() {
  const [frame, setFrame] = React.useState(0);
  const sprite = effectSprites.thunderProjectile2;
  const displaySize = 48;
  const cols = sprite.cols;
  const frameW = sprite.frameW;
  const scaleX = displaySize / frameW;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f = (f + 1) % sprite.frames;
      setFrame(f);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const col = frame % cols;
  return (
    <div style={{ width: displaySize, height: displaySize, overflow: 'hidden', mixBlendMode: 'screen' }}>
      <div style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${cols * frameW * scaleX}px ${displaySize}px`,
        backgroundPosition: `-${col * displaySize}px 0px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 0 8px #facc15) drop-shadow(0 0 16px #f59e0b)',
        mixBlendMode: 'screen',
      }} />
    </div>
  );
}

function LoopingEffectSprite({ sprite, displaySize = 40, filter, offsetY = -30, opacity = 0.85 }) {
  const [frame, setFrame] = React.useState(0);
  const totalFrames = sprite.frames;
  const hasCustomLayout = sprite.cols !== undefined;
  const cols = hasCustomLayout ? sprite.cols : Math.round(Math.sqrt(totalFrames));
  const frameW = hasCustomLayout ? sprite.frameW : (sprite.size / cols);
  const frameH = hasCustomLayout ? sprite.frameH : (sprite.size / cols);
  const scaleX = displaySize / frameW;
  const scaleY = displaySize / frameH;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f = (f + 1) % totalFrames;
      setFrame(f);
    }, 50);
    return () => clearInterval(interval);
  }, [totalFrames]);

  const col = frame % cols;
  const row = Math.floor(frame / cols);
  return (
    <div style={{
      position: 'absolute', top: offsetY, left: '50%',
      transform: 'translateX(-50%)', pointerEvents: 'none',
      width: displaySize, height: displaySize, overflow: 'hidden', opacity,
      zIndex: 10, mixBlendMode: 'screen',
    }}>
      <div style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: hasCustomLayout
          ? `${cols * frameW * scaleX}px ${(sprite.rows || Math.ceil(totalFrames / cols)) * frameH * scaleY}px`
          : `${sprite.size * scaleX}px ${sprite.size * scaleY}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: filter || 'none',
        mixBlendMode: 'screen',
      }} />
    </div>
  );
}

function DodgeFlashSprite({ x, y }) {
  const [frame, setFrame] = React.useState(0);
  const sprite = effectSprites.thunderProjectile;
  const displaySize = 56;
  const cols = sprite.cols;
  const frameW = sprite.frameW;
  const scaleX = displaySize / frameW;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= sprite.frames * 2) { clearInterval(interval); return; }
      setFrame(f % sprite.frames);
    }, 35);
    return () => clearInterval(interval);
  }, []);

  const col = frame % cols;
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      width: displaySize, height: displaySize, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 210, opacity: 0.9,
      mixBlendMode: 'screen',
    }}>
      <div style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${cols * frameW * scaleX}px ${displaySize}px`,
        backgroundPosition: `-${col * displaySize}px 0px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: 'hue-rotate(180deg) brightness(2) drop-shadow(0 0 8px #38bdf8) drop-shadow(0 0 16px #6ee7b7)',
        mixBlendMode: 'screen',
      }} />
    </div>
  );
}

function CastingSpriteEffect({ x, y }) {
  const [frame, setFrame] = React.useState(0);
  const sprite = effectSprites.magicSpell;
  const displaySize = 80;
  const cols = Math.round(Math.sqrt(sprite.frames));
  const frameW = sprite.size / cols;
  const scaleX = displaySize / frameW;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= sprite.frames) { clearInterval(interval); return; }
      setFrame(f);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const col = frame % cols;
  const row = Math.floor(frame / cols);
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      width: displaySize, height: displaySize, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 205, opacity: 0.8,
      mixBlendMode: 'screen',
    }}>
      <div style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${sprite.size * scaleX}px ${sprite.size * scaleX}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 0 6px #c084fc) drop-shadow(0 0 12px #8b5cf6)',
        mixBlendMode: 'screen',
      }} />
    </div>
  );
}

function WeaponContactSprite({ x, y, playCount = 1 }) {
  const [frame, setFrame] = React.useState(0);
  const [cycle, setCycle] = React.useState(0);
  const sprite = effectSprites.weaponHit;
  const displaySize = 50;
  const cols = Math.round(Math.sqrt(sprite.frames));
  const frameW = sprite.size / cols;
  const scaleX = displaySize / frameW;
  const offsetX = (cycle % 3 - 1) * 8;
  const offsetY = (cycle % 2) * 6 - 3;

  React.useEffect(() => {
    let f = 0;
    let c = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= sprite.frames) {
        c++;
        if (c >= playCount) { clearInterval(interval); return; }
        f = 0;
        setCycle(c);
      }
      setFrame(f);
    }, 25);
    return () => clearInterval(interval);
  }, [playCount]);

  const col = frame % cols;
  const row = Math.floor(frame / cols);
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
      width: displaySize, height: displaySize, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 205, opacity: 0.9,
      mixBlendMode: 'screen',
    }}>
      <div style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${sprite.size * scaleX}px ${sprite.size * scaleX}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 0 4px #fbbf24) drop-shadow(0 0 8px #f59e0b)',
        mixBlendMode: 'screen',
      }} />
    </div>
  );
}

const FIREBALL_FRAMES = [
  '/icons/fireball_frame_01.png',
  '/icons/fireball_frame_02.png',
  '/icons/fireball_frame_03.png',
  '/icons/fireball_frame_04.png',
  '/icons/fireball_frame_05.png',
  '/icons/fireball_frame_06.png',
  '/icons/fireball_frame_07.png',
  '/icons/fireball_frame_08.png',
];

const WATER_ARROW_FRAMES = [
  '/icons/water_arrow_frame_01.png',
  '/icons/water_arrow_frame_02.png',
  '/icons/water_arrow_frame_03.png',
  '/icons/water_arrow_frame_04.png',
  '/icons/water_arrow_frame_05.png',
  '/icons/water_arrow_frame_06.png',
  '/icons/water_arrow_frame_07.png',
  '/icons/water_arrow_frame_08.png',
];

function FireballProjectile({ startX, startY, endX, endY, phase }) {
  const [frame, setFrame] = React.useState(0);
  const displaySize = 56;
  const riseY = startY - 14;
  const [rotation, setRotation] = React.useState(0);

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f = (f + 1) % FIREBALL_FRAMES.length;
      setFrame(f);
      setRotation(prev => prev + 45);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  let posX, posY;
  if (phase === 'rise') {
    posX = startX;
    posY = startY;
  } else if (phase === 'fly') {
    posX = endX;
    posY = endY;
  } else {
    posX = startX;
    posY = startY;
  }

  return (
    <div style={{
      position: 'absolute',
      left: `${posX}%`,
      top: `${phase === 'rise' ? riseY : posY}%`,
      transition: phase === 'rise'
        ? 'top 0.5s ease-out'
        : phase === 'fly'
          ? 'left 0.5s ease-in, top 0.5s ease-in'
          : 'none',
      transform: 'translate(-50%, -50%)',
      zIndex: 210, pointerEvents: 'none',
    }}>
      <div style={{
        width: displaySize, height: displaySize,
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.08s linear',
      }}>
        <img
          src={FIREBALL_FRAMES[frame]}
          alt=""
          style={{
            width: displaySize,
            height: displaySize,
            borderRadius: '50%',
            filter: 'drop-shadow(0 0 12px #f97316) drop-shadow(0 0 24px #ef4444) brightness(1.2)',
          }}
        />
      </div>
    </div>
  );
}

function FireScatterSprite({ x, y, angle, delay }) {
  const fireSprite = effectSprites.fireSpin || effectSprites.fire || effectSprites.sunburn;
  const [frame, setFrame] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [scattered, setScattered] = React.useState(false);
  const displaySize = 40;
  const totalFrames = fireSprite?.frames || 64;
  const spriteSize = fireSprite?.size || 800;
  const cols = Math.round(Math.sqrt(totalFrames));
  const frameW = spriteSize / cols;
  const scaleX = displaySize / frameW;
  const dist = 8;
  const targetX = x + Math.cos(angle * Math.PI / 180) * dist;
  const targetY = y + Math.sin(angle * Math.PI / 180) * dist;

  React.useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setScattered(true));
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  React.useEffect(() => {
    if (!visible) return;
    let f = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= totalFrames) { clearInterval(interval); return; }
      setFrame(f);
    }, 30);
    return () => clearInterval(interval);
  }, [visible, totalFrames]);

  if (!visible || !fireSprite) return null;
  const col = frame % cols;
  const row = Math.floor(frame / cols);

  return (
    <div style={{
      position: 'absolute',
      left: `${scattered ? targetX : x}%`,
      top: `${scattered ? targetY : y}%`,
      transform: 'translate(-50%, -50%)',
      transition: 'left 0.4s ease-out, top 0.4s ease-out, opacity 0.3s',
      zIndex: 215, pointerEvents: 'none',
      opacity: frame > totalFrames * 0.7 ? 0 : 1,
    }}>
      <div style={{
        width: displaySize, height: displaySize, overflow: 'hidden',
      }}>
        <div style={{
          width: displaySize,
          height: displaySize,
          backgroundImage: `url(${fireSprite.src})`,
          backgroundSize: `${spriteSize * scaleX}px ${spriteSize * scaleX}px`,
          backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 0 8px #f97316) brightness(1.4)',
        }} />
      </div>
    </div>
  );
}

function FireballExplosion({ x, y, angles }) {
  return (
    <>
      {angles.map((angle, i) => (
        <FireScatterSprite key={i} x={x} y={y} angle={angle} delay={i * 60} />
      ))}
    </>
  );
}

function ResurrectEffect({ x, y, onComplete }) {
  const [frame, setFrame] = React.useState(0);
  const displayW = 180;
  const displayH = 120;
  const totalFrames = 3;
  const frameW = 1024 / 3;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f++;
      if (f >= totalFrames * 3) {
        clearInterval(interval);
        if (onComplete) onComplete();
        return;
      }
      setFrame(f % totalFrames);
    }, 120);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -70%)',
      zIndex: 220, pointerEvents: 'none',
      animation: 'resurrectGlow 1.1s ease-out forwards',
    }}>
      <div style={{
        width: displayW, height: displayH, overflow: 'hidden',
      }}>
        <img
          src="/effects/resurrect_sprite.png"
          alt=""
          style={{
            width: displayW * totalFrames,
            height: displayH,
            marginLeft: -frame * displayW,
            imageRendering: 'auto',
            filter: 'drop-shadow(0 0 16px #22c55e) drop-shadow(0 0 32px #16a34a) brightness(1.3)',
          }}
        />
      </div>
    </div>
  );
}

function WaterArrowProjectile({ startX, startY, endX, endY, phase }) {
  const [frame, setFrame] = React.useState(0);
  const displaySize = 64;
  const riseY = startY - 10;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f = (f + 1) % WATER_ARROW_FRAMES.length;
      setFrame(f);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  let posX, posY;
  if (phase === 'rise') { posX = startX; posY = startY; }
  else if (phase === 'fly') { posX = endX; posY = endY; }
  else { posX = startX; posY = startY; }

  return (
    <div style={{
      position: 'absolute',
      left: `${posX}%`,
      top: `${phase === 'rise' ? riseY : posY}%`,
      transition: phase === 'rise'
        ? 'top 0.4s ease-out'
        : phase === 'fly'
          ? 'left 0.45s ease-in, top 0.45s ease-in'
          : 'none',
      transform: 'translate(-50%, -50%)',
      zIndex: 210, pointerEvents: 'none',
    }}>
      <div style={{
        width: displaySize, height: displaySize,
        transform: `rotate(${angle + 180}deg)`,
      }}>
        <img
          src={WATER_ARROW_FRAMES[frame]}
          alt=""
          style={{
            width: displaySize,
            height: displaySize,
            filter: 'drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 20px #0891b2) brightness(1.3)',
          }}
        />
      </div>
    </div>
  );
}

function WaterSplashSprite({ x, y, angle, delay }) {
  const [visible, setVisible] = React.useState(false);
  const [scattered, setScattered] = React.useState(false);
  const [opacity, setOpacity] = React.useState(1);
  const size = 16 + Math.random() * 12;
  const dist = 5 + Math.random() * 6;
  const targetX = x + Math.cos(angle * Math.PI / 180) * dist;
  const targetY = y + Math.sin(angle * Math.PI / 180) * dist;

  React.useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setScattered(true));
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setOpacity(0), 400);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      left: `${scattered ? targetX : x}%`,
      top: `${scattered ? targetY : y}%`,
      transform: 'translate(-50%, -50%)',
      transition: 'left 0.5s ease-out, top 0.5s ease-out, opacity 0.4s',
      zIndex: 215, pointerEvents: 'none',
      opacity,
    }}>
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #67e8f9 0%, #06b6d4 50%, #0e7490 100%)',
        boxShadow: '0 0 8px #22d3ee, 0 0 16px rgba(6,182,212,0.5)',
      }} />
    </div>
  );
}

function WaterSplashExplosion({ x, y, angles }) {
  return (
    <>
      {angles.map((angle, i) => (
        <WaterSplashSprite key={i} x={x} y={y} angle={angle} delay={i * 40} />
      ))}
    </>
  );
}

function IceStormProjectile({ startX, startY, endX, endY, phase }) {
  const freezingSprite = effectSprites.freezing;
  const [frame, setFrame] = React.useState(0);
  const displaySize = 48;
  const cols = Math.round(Math.sqrt(freezingSprite.frames));
  const frameW = freezingSprite.size / cols;
  const scaleX = displaySize / frameW;
  const riseY = startY - 14;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f = (f + 1) % freezingSprite.frames;
      setFrame(f);
    }, 35);
    return () => clearInterval(interval);
  }, []);

  const col = frame % cols;
  const row = Math.floor(frame / cols);

  let posX, posY;
  if (phase === 'rise') { posX = startX; posY = startY; }
  else if (phase === 'fly') { posX = endX; posY = endY; }
  else { posX = startX; posY = startY; }

  return (
    <div style={{
      position: 'absolute',
      left: `${posX}%`,
      top: `${phase === 'rise' ? riseY : posY}%`,
      transition: phase === 'rise'
        ? 'top 0.5s ease-out'
        : phase === 'fly'
          ? 'left 0.5s ease-in, top 0.5s ease-in'
          : 'none',
      transform: 'translate(-50%, -50%)',
      zIndex: 210, pointerEvents: 'none',
    }}>
      <div style={{
        width: displaySize, height: displaySize, overflow: 'hidden',
        animation: 'pulse 0.4s infinite',
      }}>
        <div style={{
          width: displaySize,
          height: displaySize,
          backgroundImage: `url(${freezingSprite.src})`,
          backgroundSize: `${freezingSprite.size * scaleX}px ${freezingSprite.size * scaleX}px`,
          backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 0 12px #60a5fa) drop-shadow(0 0 24px #3b82f6) brightness(1.4) hue-rotate(-10deg)',
        }} />
      </div>
    </div>
  );
}

function PoisonGustProjectile({ startX, startY, endX, endY, phase }) {
  const gustSprite = effectSprites.windBreath;
  const [frame, setFrame] = React.useState(0);
  const displaySize = 72;
  const cols = gustSprite.cols || 18;
  const frameW = gustSprite.frameW || 32;
  const frameH = gustSprite.frameH || 32;
  const scaleX = displaySize / frameW;
  const scaleY = displaySize / frameH;

  React.useEffect(() => {
    let f = 0;
    const interval = setInterval(() => {
      f = (f + 1) % (gustSprite.frames || 18);
      setFrame(f);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const col = frame % cols;
  const row = Math.floor(frame / cols);
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  let posX, posY;
  if (phase === 'fly') { posX = endX; posY = endY; }
  else { posX = startX; posY = startY; }

  return (
    <div style={{
      position: 'absolute',
      left: `${posX}%`,
      top: `${posY}%`,
      transition: phase === 'fly'
        ? 'left 0.55s ease-in, top 0.55s ease-in'
        : 'none',
      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      zIndex: 210, pointerEvents: 'none',
    }}>
      <div style={{
        width: displaySize, height: displaySize, overflow: 'hidden',
      }}>
        <div style={{
          width: displaySize,
          height: displaySize,
          backgroundImage: `url(${gustSprite.src})`,
          backgroundSize: `${cols * frameW * scaleX}px ${(gustSprite.rows || 1) * frameH * scaleY}px`,
          backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: 'hue-rotate(90deg) saturate(2.5) drop-shadow(0 0 10px #22c55e) drop-shadow(0 0 20px #16a34a) brightness(1.3)',
        }} />
      </div>
    </div>
  );
}

function MiniBar({ current, max, color, height = 5, width = 60 }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{
      height, width, background: 'rgba(0,0,0,0.6)', borderRadius: height / 2,
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        borderRadius: height / 2, transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

function getUnitSprite(unit) {
  if (unit.classId && unit.classId === 'worge' && unit.bearForm) {
    return getWorgTransformSprite(unit.raceId);
  }
  if (unit.classId && unit.classId === 'warrior' && unit.demonBlade) {
    return warriorTransformSprite;
  }
  if (unit.classId && unit.raceId) {
    const sprite = getPlayerSprite(unit.classId, unit.raceId);
    if (unit.team === 'enemy') {
      return { ...sprite, filter: sprite.filter ? sprite.filter + ' brightness(0.8)' : 'brightness(0.8)' };
    }
    return sprite;
  }
  if (unit.templateId) {
    const sprite = getEnemySprite(unit.templateId);
    if (unit.isBoss) {
      const bossFilters = {
        nature_elemental: 'hue-rotate(80deg) saturate(2.5) brightness(0.7) contrast(1.3)',
        water_elemental: 'hue-rotate(200deg) saturate(2.0) brightness(0.6) contrast(1.4)',
        lich: 'hue-rotate(270deg) saturate(2.5) brightness(0.5) contrast(1.5)',
        demon_lord: 'hue-rotate(340deg) saturate(3.0) brightness(0.5) contrast(1.6)',
        void_king: 'hue-rotate(280deg) saturate(2.0) brightness(0.4) contrast(1.8)',
        grand_shaman: 'hue-rotate(120deg) saturate(2.0) brightness(0.65) contrast(1.3)',
        canyon_warlord: 'hue-rotate(15deg) saturate(2.5) brightness(0.6) contrast(1.4)',
        frost_wyrm: 'hue-rotate(190deg) saturate(2.2) brightness(0.55) contrast(1.4)',
        shadow_beast: 'hue-rotate(260deg) saturate(2.0) brightness(0.45) contrast(1.5)',
        void_sentinel: 'hue-rotate(290deg) saturate(2.5) brightness(0.4) contrast(1.7)',
        corrupted_grove_keeper: 'hue-rotate(90deg) saturate(2.5) brightness(0.6) contrast(1.4)',
      };
      return { ...sprite, filter: bossFilters[unit.templateId] || 'hue-rotate(180deg) saturate(2) brightness(0.5)' };
    }
    return sprite;
  }
  return getPlayerSprite('warrior');
}

function isRangedUnit(unit) {
  if (unit.classId === 'ranger' || unit.classId === 'mage') return true;
  if (unit.templateId === 'dark_mage' || unit.templateId === 'lich') return true;
  if (unit.templateId === 'water_elemental' || unit.templateId === 'nature_elemental') return true;
  if (unit.templateId === 'corrupted_grove_keeper') return true;
  return false;
}

function isElectricAbility(abilityName) {
  if (!abilityName) return false;
  const n = abilityName.toLowerCase();
  return n.includes('lightning') || n.includes('thunder') || n.includes('chain light') || n.includes('storm') || n.includes('tempest');
}

function isFireballAbility(abilityName) {
  if (!abilityName) return false;
  const n = abilityName.toLowerCase();
  return n === 'fireball';
}

function isIceStormAbility(abilityName) {
  if (!abilityName) return false;
  return abilityName.toLowerCase() === 'ice storm';
}

function isWaterAbility(abilityName) {
  if (!abilityName) return false;
  const n = abilityName.toLowerCase();
  return n.includes('tidal') || n.includes('torrent') || n.includes('tsunami') || n.includes('water') || n.includes('deluge') || n.includes('aqua') || n.includes('splash');
}

function isPoisonGustAbility(abilityName) {
  if (!abilityName) return false;
  const n = abilityName.toLowerCase();
  return n.includes('poison arrow') || n.includes('poison spore') || n.includes('toxic spore') || n.includes('envenom');
}

function getProjectileColor(unit, abilityName) {
  if (!abilityName) return '#e2e8f0';
  const n = abilityName.toLowerCase();
  if (n.includes('fire') || n.includes('hellfire') || n.includes('meteor')) return '#f97316';
  if (n.includes('shadow') || n.includes('dark') || n.includes('void') || n.includes('death') || n.includes('soul')) return '#7c3aed';
  if (n.includes('ice') || n.includes('frost')) return '#38bdf8';
  if (n.includes('drain')) return '#a855f7';
  if (n.includes('arcane')) return '#8b5cf6';
  if (n.includes('arrow') || n.includes('shot') || n.includes('poison')) return '#22c55e';
  if (unit.classId === 'mage') return '#8b5cf6';
  if (unit.classId === 'ranger') return '#22c55e';
  return '#e2e8f0';
}

function getBeamTrail(unit, abilityName) {
  const classId = unit.classId || '';
  if (unit.demonBlade && classId === 'warrior') return beamTrails.blue;
  const fx = getAbilityEffect(classId, abilityName || '');
  if (fx.beam) return beamTrails[fx.beam];
  const n = (abilityName || '').toLowerCase();
  if (n.includes('fire') || n.includes('hellfire')) return beamTrails.orange;
  if (n.includes('shadow') || n.includes('dark') || n.includes('void')) return beamTrails.purple;
  if (n.includes('ice') || n.includes('frost')) return beamTrails.purple;
  if (n.includes('arrow') || n.includes('shot') || n.includes('poison')) return beamTrails.green;
  if (classId === 'mage') return beamTrails.purple;
  if (classId === 'ranger') return beamTrails.green;
  return beamTrails.red;
}

function getHitEffectByColor(color) {
  if (!color) return effectSprites.hitEffect1;
  const c = color.toLowerCase();
  if (c.includes('22c55e') || c === '#22c55e' || c === 'green') return effectSprites.hitEffect3;
  if (c.includes('38bdf8') || c === '#38bdf8' || c.includes('3b82f6') || c === 'blue') return effectSprites.hitEffect2;
  return effectSprites.hitEffect1;
}

function getHitEffect(unit, abilityName, isRanged, abilityId) {
  const classId = unit.classId || '';
  const fx = getAbilityEffect(classId, abilityName || '', abilityId);
  if (unit.demonBlade && classId === 'warrior') {
    const demonSlashes = ['demonSlash1', 'demonSlash2', 'demonSlash3'];
    const demonFx = fx.effect && fx.effect.startsWith('demonSlash') ? fx.effect : demonSlashes[Math.floor(Math.random() * demonSlashes.length)];
    return { sprite: effectSprites[demonFx], filter: null, postHeal: null };
  }
  if (fx.effect) return { sprite: effectSprites[fx.effect], filter: fx.effectFilter || null, postHeal: fx.postHealEffect ? effectSprites[fx.postHealEffect] : null, followUp: fx.followUp || null };
  if (isRanged) {
    const color = getProjectileColor(unit, abilityName);
    return { sprite: getHitEffectByColor(color), filter: null, postHeal: null, followUp: null };
  }
  return { sprite: effectSprites.hitEffect1, filter: null, postHeal: null, followUp: null };
}

export default function BattleScreen() {
  const {
    battleState, battleUnits, battleTurnOrder, battleCurrentTurn,
    selectedTargetId, lastAction, battleLog, playerClass, playerName,
    level, cooldowns, currentLocation,
    useAbility, processAIAction, advanceTurn, setSelectedTarget,
    returnToWorld, startBattle, returnFromTraining,
    skipTurn, defendTurn, autoAttack,
    playerHealth, playerMana, playerStamina,
    playerMaxHealth, playerMaxMana, playerMaxStamina,
    inventory, useConsumable, useGrudge,
    autoBattleEnabled, toggleAutoBattle,
    heroRoster,
  } = useGameStore();

  const [unitAnims, setUnitAnims] = useState({});
  const [dashPositions, setDashPositions] = useState({});
  const [projectiles, setProjectiles] = useState([]);
  const [floatingDmg, setFloatingDmg] = useState([]);
  const [introComplete, setIntroComplete] = useState(false);
  const [activeParticles, setActiveParticles] = useState([]);
  const [hitEffects, setHitEffects] = useState([]);
  const [critFx, setCritFx] = useState([]);
  const [slashImpactFx, setSlashImpactFx] = useState([]);
  const [dodgeFlashes, setDodgeFlashes] = useState([]);
  const [castingFx, setCastingFx] = useState([]);
  const [weaponContactFx, setWeaponContactFx] = useState([]);
  const [fireballFx, setFireballFx] = useState([]);
  const [fireExplosionFx, setFireExplosionFx] = useState([]);
  const [iceStormFx, setIceStormFx] = useState([]);
  const [waterArrowFx, setWaterArrowFx] = useState([]);
  const [waterSplashFx, setWaterSplashFx] = useState([]);
  const [poisonGustFx, setPoisonGustFx] = useState([]);
  const [resurrectFx, setResurrectFx] = useState([]);
  const [showItemsPanel, setShowItemsPanel] = useState(false);
  const [healTargetMode, setHealTargetMode] = useState(null);
  const [hoveredGearUnitId, setHoveredGearUnitId] = useState(null);
  const logRef = useRef(null);
  const actionProcessed = useRef(null);
  const introStarted = useRef(false);
  const aiProcessing = useRef(false);

  const [adminMode, setAdminMode] = useState(false);
  const [adminPaused, setAdminPaused] = useState(false);
  const [adminOverrides, setAdminOverrides] = useState({
    stun: { offsetY: -40, size: 30, opacity: 0.75 },
    poison: { offsetY: -36, size: 28, opacity: 0.7 },
    dot: { offsetY: -36, size: 30, opacity: 0.7 },
    buff: { offsetY: -44, size: 24, opacity: 0.6 },
    nameplate: { offsetY: -30 },
  });
  const [adminDragging, setAdminDragging] = useState(null);
  const adminDragStart = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '`' || e.key === '~') {
        setAdminMode(prev => {
          if (!prev) setAdminPaused(true);
          else setAdminPaused(false);
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAdminDragStart = useCallback((effectKey, e) => {
    e.stopPropagation();
    setAdminDragging(effectKey);
    adminDragStart.current = { y: e.clientY, startOffset: adminOverrides[effectKey].offsetY };
  }, [adminOverrides]);

  const handleAdminDragMove = useCallback((e) => {
    if (!adminDragging || !adminDragStart.current) return;
    const dy = e.clientY - adminDragStart.current.y;
    setAdminOverrides(prev => ({
      ...prev,
      [adminDragging]: { ...prev[adminDragging], offsetY: adminDragStart.current.startOffset + dy },
    }));
  }, [adminDragging]);

  const handleAdminDragEnd = useCallback(() => {
    setAdminDragging(null);
    adminDragStart.current = null;
  }, []);

  useEffect(() => {
    if (!adminDragging) return;
    window.addEventListener('mousemove', handleAdminDragMove);
    window.addEventListener('mouseup', handleAdminDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleAdminDragMove);
      window.removeEventListener('mouseup', handleAdminDragEnd);
    };
  }, [adminDragging, handleAdminDragMove, handleAdminDragEnd]);

  const phase = battleState?.phase;
  const spd = autoBattleEnabled ? 1 : 1.25;
  useEffect(() => { if (phase !== 'player_turn') { setShowItemsPanel(false); setHealTargetMode(null); } }, [phase]);
  const isBoss = battleState?.isBoss;
  const isTraining = battleState?.isTraining;
  const isArena = battleState?.isArena;
  const dungeonProgress = useGameStore(s => s.dungeonProgress);
  const isDungeon = dungeonProgress !== null;
  const dungeonTheme = dungeonProgress?.theme || 'default';
  const dungeonNode = dungeonProgress?.currentNode;
  const dungeonTotal = dungeonProgress?.totalNodes;
  const isDungeonBoss = isDungeon && dungeonNode === (dungeonTotal || 5) - 1;
  const getDungeonBg = () => {
    if (dungeonTheme === 'lava') return isDungeonBoss ? '/backgrounds/lava_boss_walkup.png' : '/backgrounds/lava_dungeon_path.png';
    if (dungeonTheme === 'void') return isDungeonBoss ? '/backgrounds/portal_arena.png' : '/backgrounds/purple_dungeon.png';
    return isDungeonBoss ? '/backgrounds/scene_field.png' : '/backgrounds/scene_dungeon.png';
  };
  const bgImage = isArena ? '/backgrounds/arena.png' : isDungeon ? getDungeonBg() : (locationBackgrounds[currentLocation] || (isTraining ? '/backgrounds/verdant_plains.png' : null));
  const bgGradient = !bgImage ? (zoneGradients[currentLocation] || zoneGradients.default) : null;

  const currentUnitId = battleTurnOrder[battleCurrentTurn];
  const currentUnit = battleUnits.find(u => u.id === currentUnitId);
  const playerUnit = battleUnits.find(u => u.id === 'player');

  const playerTeam = useMemo(() => battleUnits.filter(u => u.team === 'player'), [battleUnits]);
  const enemyTeam = useMemo(() => battleUnits.filter(u => u.team === 'enemy'), [battleUnits]);

  const isPlayerTurn = phase === 'player_turn' && !adminPaused;
  const currentCls = currentUnit?.classId ? classDefinitions[currentUnit.classId] : null;

  const displayedAbilities = useMemo(() => {
    if (!currentCls || !currentUnit) return [];
    const loadout = currentUnit.abilityLoadout;
    const allAbilities = currentUnit.abilities || currentCls.abilities;
    const abilityMap = {};
    for (const ab of allAbilities) {
      abilityMap[ab.id] = ab;
    }

    let resolved;
    if (loadout && loadout.length > 0) {
      resolved = loadout.map(id => abilityMap[id]).filter(Boolean);
    } else {
      resolved = allAbilities.slice(0, 5);
    }

    if (!currentUnit.bearForm || !currentCls.bearFormAbilities) return resolved;

    const raceDef = currentUnit.raceId ? raceDefinitions[currentUnit.raceId] : null;
    const raceName = raceDef?.name || 'Beast';
    return resolved.map(ability => {
      if (currentCls.bearFormAbilities[ability.id]) {
        return currentCls.bearFormAbilities[ability.id];
      }
      if (ability.isBearForm) {
        const revertAbility = allAbilities.find(a => a.id === 'revert_form');
        if (revertAbility) {
          return { ...revertAbility, name: `${raceName} Form` };
        }
      }
      return ability;
    });
  }, [currentCls, currentUnit?.bearForm, currentUnit?.raceId, currentUnit?.abilities, currentUnit?.abilityLoadout]);

  useEffect(() => {
    setBgm('battle');
    return () => setBgm('ambient');
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleLog]);

  useEffect(() => {
    if (phase === 'intro' && !introStarted.current) {
      introStarted.current = true;
      setTimeout(() => {
        setIntroComplete(true);
        setTimeout(() => advanceTurn(), 300);
      }, 1000);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'ai_turn' && introComplete && !aiProcessing.current && !adminPaused) {
      aiProcessing.current = true;
      const timer = setTimeout(() => {
        processAIAction();
        aiProcessing.current = false;
      }, autoBattleEnabled ? 400 : 600);
      return () => { clearTimeout(timer); aiProcessing.current = false; };
    }
  }, [phase, battleCurrentTurn, introComplete, adminPaused]);

  useEffect(() => {
    if (autoBattleEnabled && phase === 'player_turn' && introComplete && !adminPaused) {
      const timer = setTimeout(() => {
        autoAttack();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoBattleEnabled, phase, battleCurrentTurn, introComplete, adminPaused]);

  useEffect(() => {
    if (phase === 'victory') playVictory();
    if (phase === 'defeat') playDefeat();
  }, [phase]);

  const addParticle = useCallback((type, x, y, color) => {
    const id = Date.now() + Math.random();
    setActiveParticles(prev => [...prev, { id, type, x, y, color }]);
    setTimeout(() => setActiveParticles(prev => prev.filter(p => p.id !== id)), 1200);
  }, []);

  const spawnDodgeFlash = useCallback((x, y) => {
    const id = Date.now() + Math.random();
    setDodgeFlashes(prev => [...prev, { id, x, y }]);
    setTimeout(() => setDodgeFlashes(prev => prev.filter(d => d.id !== id)), 700);
  }, []);

  const spawnCastingFx = useCallback((x, y) => {
    const id = Date.now() + Math.random();
    setCastingFx(prev => [...prev, { id, x, y }]);
    setTimeout(() => setCastingFx(prev => prev.filter(c => c.id !== id)), 2500);
  }, []);

  const spawnWeaponContact = useCallback((x, y, playCount = 1) => {
    const id = Date.now() + Math.random();
    setWeaponContactFx(prev => [...prev, { id, x, y, playCount }]);
    setTimeout(() => setWeaponContactFx(prev => prev.filter(w => w.id !== id)), playCount * 900 + 200);
  }, []);

  const spawnSlashImpact = useCallback((x, y, level, color) => {
    if (x == null || y == null) return;
    const id = Date.now() + Math.random();
    setSlashImpactFx(prev => [...prev, { id, x, y, level, color }]);
    setTimeout(() => setSlashImpactFx(prev => prev.filter(s => s.id !== id)), 500);
  }, []);

  const spawnFollowUpEffects = useCallback((followUp, x, y, filterOverride) => {
    if (!followUp || !Array.isArray(followUp)) return;
    followUp.forEach(fu => {
      const sprite = effectSprites[fu.effect];
      if (!sprite) return;
      setTimeout(() => {
        const fid = Date.now() + Math.random();
        setHitEffects(prev => [...prev, { id: fid, x, y, sprite, filter: fu.filter || filterOverride || null }]);
        const dur = (sprite.frames || 6) * 50 + 200;
        setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== fid)), dur);
      }, fu.delay || 0);
    });
  }, []);

  useEffect(() => {
    if (!lastAction || lastAction === actionProcessed.current) return;
    actionProcessed.current = lastAction;

    const { attackerId, targetId, abilityType, abilityName, abilityId, totalDmg, evaded, blocked, isCrit, healAmt, type, consumableType } = lastAction;

    if (type === 'stunned' || type === 'skip') {
      setTimeout(() => advanceTurn(), 500 * spd);
      return;
    }

    if (type === 'defend') {
      const defender = battleUnits.find(u => u.id === attackerId);
      if (defender) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: 'block' }));
        spawnParticle('heal', defender.position?.x || 30, defender.position?.y || 50, '#60a5fa');
        setTimeout(() => {
          setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
          advanceTurn();
        }, 700 * spd);
      } else {
        setTimeout(() => advanceTurn(), 300 * spd);
      }
      return;
    }

    const attacker = battleUnits.find(u => u.id === attackerId);
    const target = battleUnits.find(u => u.id === targetId);
    if (!attacker) { setTimeout(() => advanceTurn(), 200); return; }

    const spriteData = getUnitSprite(attacker);
    const getAttackAnim = () => {
      const effectMapping = getAbilityEffect(attacker.classId, abilityName, abilityId);
      if (effectMapping && effectMapping.anim) {
        const desired = effectMapping.anim;
        if (desired === 'heal' && spriteData.heal) return 'heal';
        if (desired === 'block' && spriteData.block) return 'block';
        if (spriteData[desired]) return desired;
      }
      if (abilityType === 'heal' || abilityType === 'heal_over_time') return spriteData.heal ? 'heal' : spriteData.cast ? 'cast' : 'attack1';
      if (abilityType === 'buff') return spriteData.cast ? 'cast' : spriteData.block ? 'block' : 'attack1';
      if (abilityType === 'item' || abilityType === 'stance') return spriteData.cast ? 'cast' : spriteData.block ? 'block' : 'attack1';
      const anims = ['attack1', 'attack2', 'attack3'].filter(a => spriteData[a]);
      if (anims.length > 2 && (abilityType === 'physical' || abilityType === 'magical')) return anims[Math.floor(Math.random() * anims.length)];
      if (anims.length > 1) return anims[1];
      return 'attack1';
    };

    const getComboAnims = () => {
      const effectMapping = getAbilityEffect(attacker.classId, abilityName, abilityId);
      if (effectMapping?.comboAnims) {
        return effectMapping.comboAnims.filter(a => spriteData[a]);
      }
      return null;
    };

    if (abilityType === 'physical' || abilityType === 'magical') {
      if (!target) { setTimeout(() => advanceTurn(), 200); return; }

      const isDaggerToss = abilityId === 'dagger_toss' || abilityId === 'ws_dagger_stab' || abilityId === 'ws_dagger_slash' || abilityId === 'ws_backstab' || abilityId === 'ws_envenom' || abilityId === 'ws_fan_of_knives';

      if (isDaggerToss && attacker.position && target.position) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        playSwordHit();
        const projId = Date.now();
        const dx = target.position.x - attacker.position.x;
        const dy = target.position.y - attacker.position.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        setProjectiles(prev => [...prev, {
          id: projId,
          startX: attacker.position.x + (attacker.team === 'player' ? 4 : -4),
          startY: attacker.position.y,
          endX: target.position.x,
          endY: target.position.y,
          color: '#94a3b8',
          angle,
          phase: 'start',
          isDagger: true,
        }]);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setProjectiles(prev => prev.map(p => p.id === projId ? { ...p, phase: 'fly' } : p));
          });
        });
        setTimeout(() => {
          setProjectiles(prev => prev.filter(p => p.id !== projId));
          showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
          if (!evaded) {
            setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
            addParticle('hit', target.position.x, target.position.y, '#94a3b8');
            const hfxR = getHitEffect(attacker, abilityName, false);
            if (hfxR.sprite && target.position) {
              const hid = Date.now() + Math.random();
              setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxR.sprite, filter: hfxR.filter }]);
              setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), 800);
              if (hfxR.followUp) spawnFollowUpEffects(hfxR.followUp, target.position.x, target.position.y, hfxR.filter);
            }
            if (isCrit) { playCrit(); spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId)); } else { playHurt(); spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId)); }
            spawnWeaponContact(target.position.x, target.position.y, 1);
          } else {
            playDodge();
            if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
          }
          addParticle('cast', attacker.position.x, attacker.position.y, '#7c3aed');
          setTimeout(() => {
            const blinkX = target.position.x + (attacker.team === 'player' ? -6 : 6);
            const blinkY = target.position.y;
            setDashPositions(prev => ({ ...prev, [attackerId]: { x: blinkX, y: blinkY } }));
            addParticle('cast', blinkX, blinkY, '#7c3aed');
            const teleId1 = Date.now() + Math.random();
            setHitEffects(prev => [...prev, { id: teleId1, x: blinkX, y: blinkY, sprite: effectSprites.magickaHit }]);
            setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== teleId1)), 1200);
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'attack1' }));
            playSwordHit();
            addParticle('hit', target.position.x, target.position.y, '#c084fc');
          }, 350 * spd);
          setTimeout(() => {
            addParticle('cast', attacker.position.x, attacker.position.y, '#7c3aed');
            const teleId2 = Date.now() + Math.random();
            setHitEffects(prev => [...prev, { id: teleId2, x: attacker.position.x, y: attacker.position.y, sprite: effectSprites.magickaHit }]);
            setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== teleId2)), 1200);
            setDashPositions(prev => { const n = { ...prev }; delete n[attackerId]; return n; });
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
            setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' }));
          }, 700 * spd);
        }, 450 * spd);
        setTimeout(() => advanceTurn(), 1400 * spd);
        return;
      }

      const ranged = isRangedUnit(attacker) || abilityType === 'magical';

      if (abilityType === 'magical' && attacker.position) {
        addParticle('cast', attacker.position.x, attacker.position.y, getProjectileColor(attacker, abilityName));
        spawnCastingFx(attacker.position.x, attacker.position.y - 12);
        playMagicCast();
      }

      if (ranged && isFireballAbility(abilityName) && attacker.position && target.position) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        const fbId = Date.now() + Math.random();
        const startX = attacker.position.x + (attacker.team === 'player' ? 4 : -4);
        const startY = attacker.position.y;
        setFireballFx(prev => [...prev, { id: fbId, startX, startY, endX: target.position.x, endY: target.position.y, phase: 'start' }]);
        setTimeout(() => {
          setFireballFx(prev => prev.map(f => f.id === fbId ? { ...f, phase: 'rise' } : f));
        }, 50);
        setTimeout(() => {
          setFireballFx(prev => prev.map(f => f.id === fbId ? { ...f, phase: 'fly' } : f));
        }, 500 * spd);
        setTimeout(() => {
          setFireballFx(prev => prev.filter(f => f.id !== fbId));
          showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
          if (!evaded) {
            setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
            addParticle('hit', target.position.x, target.position.y, '#f97316');
            const exId = Date.now() + Math.random();
            const scatterAngles = [
              Math.random() * 40 - 20,
              120 + Math.random() * 40 - 20,
              240 + Math.random() * 40 - 20,
            ];
            setFireExplosionFx(prev => [...prev, { id: exId, x: target.position.x, y: target.position.y, angles: scatterAngles }]);
            setTimeout(() => setFireExplosionFx(prev => prev.filter(e => e.id !== exId)), 2500);
            const hfxR2 = getHitEffect(attacker, abilityName, true);
            if (hfxR2.sprite && target.position) {
              const hid = Date.now() + Math.random();
              setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxR2.sprite, filter: hfxR2.filter }]);
              const effectDur = (hfxR2.sprite.frames || 36) * 30 + 100;
              setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
              if (hfxR2.followUp) spawnFollowUpEffects(hfxR2.followUp, target.position.x, target.position.y, hfxR2.filter);
            }
            if (isCrit) {
              playCrit();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId));
              if (target.position) {
                const critId = Date.now() + Math.random();
                setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect('spell') }]);
                setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
              }
            } else {
              playHurt();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
            }
          } else {
            playDodge();
            if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400 * spd);
        }, 1000 * spd);
        setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 700 * spd);
        setTimeout(() => advanceTurn(), 1500 * spd);
      } else if (ranged && isIceStormAbility(abilityName) && attacker.position && target.position) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        const iceId = Date.now() + Math.random();
        const startX = attacker.position.x + (attacker.team === 'player' ? 4 : -4);
        const startY = attacker.position.y;
        setIceStormFx(prev => [...prev, { id: iceId, startX, startY, endX: target.position.x, endY: target.position.y, phase: 'start' }]);
        setTimeout(() => {
          setIceStormFx(prev => prev.map(f => f.id === iceId ? { ...f, phase: 'rise' } : f));
        }, 50);
        setTimeout(() => {
          setIceStormFx(prev => prev.map(f => f.id === iceId ? { ...f, phase: 'fly' } : f));
        }, 550 * spd);
        setTimeout(() => {
          setIceStormFx(prev => prev.filter(f => f.id !== iceId));
          showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
          if (!evaded) {
            setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
            addParticle('hit', target.position.x, target.position.y, '#60a5fa');
            addParticle('cast', target.position.x, target.position.y, '#93c5fd');
            addParticle('cast', target.position.x + 2, target.position.y - 1, '#bfdbfe');
            const hfxIce = getHitEffect(attacker, abilityName, true);
            if (hfxIce.sprite && target.position) {
              const hid = Date.now() + Math.random();
              setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxIce.sprite, filter: hfxIce.filter || 'hue-rotate(180deg) brightness(1.3)' }]);
              const effectDur = (hfxIce.sprite.frames || 36) * 30 + 100;
              setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
              if (hfxIce.followUp) spawnFollowUpEffects(hfxIce.followUp, target.position.x, target.position.y, hfxIce.filter);
            }
            if (isCrit) {
              playCrit();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId));
              if (target.position) {
                const critId = Date.now() + Math.random();
                setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect('spell') }]);
                setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
              }
            } else {
              playHurt();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
            }
          } else {
            playDodge();
            if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400 * spd);
        }, 1100 * spd);
        setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 700 * spd);
        setTimeout(() => advanceTurn(), 1600 * spd);
      } else if (ranged && isWaterAbility(abilityName) && attacker.position && target.position) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        const wId = Date.now() + Math.random();
        const startX = attacker.position.x + (attacker.team === 'player' ? 4 : -4);
        const startY = attacker.position.y;
        setWaterArrowFx(prev => [...prev, { id: wId, startX, startY, endX: target.position.x, endY: target.position.y, phase: 'start' }]);
        setTimeout(() => {
          setWaterArrowFx(prev => prev.map(f => f.id === wId ? { ...f, phase: 'rise' } : f));
        }, 50);
        setTimeout(() => {
          setWaterArrowFx(prev => prev.map(f => f.id === wId ? { ...f, phase: 'fly' } : f));
        }, 450 * spd);
        setTimeout(() => {
          setWaterArrowFx(prev => prev.filter(f => f.id !== wId));
          showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
          if (!evaded) {
            setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
            addParticle('hit', target.position.x, target.position.y, '#22d3ee');
            const splashAngles = Array.from({ length: 5 }, () => Math.random() * 360);
            const splId = Date.now() + Math.random();
            setWaterSplashFx(prev => [...prev, { id: splId, x: target.position.x, y: target.position.y, angles: splashAngles }]);
            setTimeout(() => setWaterSplashFx(prev => prev.filter(e => e.id !== splId)), 2000);
            addParticle('cast', target.position.x, target.position.y, '#06b6d4');
            const hfxW = getHitEffect(attacker, abilityName, true);
            if (hfxW.sprite && target.position) {
              const hid = Date.now() + Math.random();
              setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxW.sprite, filter: hfxW.filter || 'hue-rotate(160deg) brightness(1.3)' }]);
              const effectDur = (hfxW.sprite.frames || 36) * 30 + 100;
              setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
              if (hfxW.followUp) spawnFollowUpEffects(hfxW.followUp, target.position.x, target.position.y, hfxW.filter);
            }
            if (isCrit) {
              playCrit();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId));
              if (target.position) {
                const critId = Date.now() + Math.random();
                setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect('spell') }]);
                setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
              }
            } else {
              playHurt();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
            }
          } else {
            playDodge();
            if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400 * spd);
        }, 950 * spd);
        setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 700 * spd);
        setTimeout(() => advanceTurn(), 1500 * spd);
      } else if (ranged && isPoisonGustAbility(abilityName) && attacker.position && target.position) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        const pgId = Date.now() + Math.random();
        const startX = attacker.position.x + (attacker.team === 'player' ? 4 : -4);
        const startY = attacker.position.y;
        setPoisonGustFx(prev => [...prev, { id: pgId, startX, startY, endX: target.position.x, endY: target.position.y, phase: 'start' }]);
        setTimeout(() => {
          setPoisonGustFx(prev => prev.map(f => f.id === pgId ? { ...f, phase: 'fly' } : f));
        }, 50);
        setTimeout(() => {
          setPoisonGustFx(prev => prev.filter(f => f.id !== pgId));
          showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
          if (!evaded) {
            setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
            addParticle('hit', target.position.x, target.position.y, '#22c55e');
            if (target.position && effectSprites.windProjectile) {
              const wpId = Date.now() + Math.random();
              setHitEffects(prev => [...prev, { id: wpId, x: target.position.x, y: target.position.y, sprite: effectSprites.windProjectile, filter: 'hue-rotate(90deg) saturate(2)' }]);
              setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== wpId)), 500);
            }
            const hfxP = getHitEffect(attacker, abilityName, true);
            if (hfxP.sprite && target.position) {
              const hid = Date.now() + Math.random();
              setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxP.sprite, filter: hfxP.filter || 'hue-rotate(90deg) saturate(2)' }]);
              const effectDur = (hfxP.sprite.frames || 18) * 35 + 100;
              setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
              if (hfxP.followUp) spawnFollowUpEffects(hfxP.followUp, target.position.x, target.position.y, hfxP.filter || 'hue-rotate(90deg) saturate(2)');
            }
            if (isCrit) {
              playCrit();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId));
              if (target.position) {
                const critId = Date.now() + Math.random();
                setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect('spell') }]);
                setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
              }
            } else {
              playHurt();
              spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
            }
          } else {
            playDodge();
            if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400 * spd);
        }, 600 * spd);
        setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 700 * spd);
        setTimeout(() => advanceTurn(), 1200 * spd);
      } else if (ranged) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
        setTimeout(() => {
          if (attacker.position && target.position) {
            const projId = Date.now();
            const color = getProjectileColor(attacker, abilityName);
            const beamSrc = getBeamTrail(attacker, abilityName);
            const dx = target.position.x - attacker.position.x;
            const dy = target.position.y - attacker.position.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            setProjectiles(prev => [...prev, {
              id: projId,
              startX: attacker.position.x + (attacker.team === 'player' ? 4 : -4),
              startY: attacker.position.y,
              endX: target.position.x,
              endY: target.position.y,
              color,
              beamSrc,
              angle,
              phase: 'start',
              isElectric: isElectricAbility(abilityName),
            }]);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setProjectiles(prev => prev.map(p => p.id === projId ? { ...p, phase: 'fly' } : p));
              });
            });
            setTimeout(() => {
              setProjectiles(prev => prev.filter(p => p.id !== projId));
              showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
              if (!evaded) {
                setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
                addParticle('hit', target.position.x, target.position.y, '#ef4444');
                const hfxR3 = getHitEffect(attacker, abilityName, true);
                if (hfxR3.sprite && target.position) {
                  const hid = Date.now() + Math.random();
                  setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxR3.sprite, filter: hfxR3.filter }]);
                  const effectDur = (hfxR3.sprite.frames || 36) * 30 + 100;
                  setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
                  if (hfxR3.followUp) spawnFollowUpEffects(hfxR3.followUp, target.position.x, target.position.y, hfxR3.filter);
                }
                if (isCrit) {
                  playCrit();
                  spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId));
                  if (target.position) {
                    const critType = abilityType === 'magical' ? 'spell' : 'melee';
                    const critId = Date.now() + Math.random();
                    setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect(critType) }]);
                    setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
                  }
                } else {
                  playHurt();
                  spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
                }
              } else {
                playDodge();
                if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
              }
              setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400 * spd);
            }, 500 * spd);
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 600 * spd);
        }, 250 * spd);
        setTimeout(() => advanceTurn(), 1300 * spd);
      } else {
        const effectMapping = getAbilityEffect(attacker.classId, abilityName, abilityId);
        const isLeap = effectMapping?.moveType === 'leap';

        if (isLeap && attacker.position && target.position) {
          const frontX = target.position.x + (attacker.team === 'player' ? -8 : 8);
          const frontY = target.position.y;
          setDashPositions(prev => ({ ...prev, [attackerId]: { x: frontX, y: frontY } }));

          setTimeout(() => {
            const arcX = (frontX + target.position.x) / 2;
            const arcY = target.position.y - 18;
            setDashPositions(prev => ({ ...prev, [attackerId]: { x: arcX, y: arcY } }));
          }, 250 * spd);

          setTimeout(() => {
            setDashPositions(prev => ({ ...prev, [attackerId]: { x: target.position.x, y: target.position.y } }));
            setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
            playSwordHit();
            if (target.position) {
              addParticle('hit', target.position.x - 3, target.position.y + 2, '#8B4513');
              addParticle('hit', target.position.x + 3, target.position.y + 2, '#8B4513');
              addParticle('hit', target.position.x, target.position.y + 4, '#a0522d');
            }
          }, 450 * spd);

          setTimeout(() => {
            showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
            if (!evaded) {
              setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
              if (target.position) addParticle('hit', target.position.x, target.position.y, '#ef4444');
              const hfxLeap = getHitEffect(attacker, abilityName, false);
              if (hfxLeap.sprite && target.position) {
                const hid = Date.now() + Math.random();
                setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y + 2, sprite: hfxLeap.sprite, filter: hfxLeap.filter }]);
                const effectDur = (hfxLeap.sprite.frames || 36) * 30 + 100;
                setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
                if (hfxLeap.followUp) spawnFollowUpEffects(hfxLeap.followUp, target.position.x, target.position.y + 2, hfxLeap.filter);
              }
              if (isCrit) {
                playCrit();
                spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId));
                if (target.position) {
                  const critId = Date.now() + Math.random();
                  setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect('melee') }]);
                  setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
                }
              } else {
                playHurt();
                spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
              }
              if (target.position) spawnWeaponContact(target.position.x, target.position.y, 2);
            } else {
              playDodge();
              if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
            }
            setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400 * spd);
          }, 650 * spd);

          setTimeout(() => {
            setDashPositions(prev => { const n = { ...prev }; delete n[attackerId]; return n; });
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
          }, 1000 * spd);
          setTimeout(() => advanceTurn(), 1400 * spd);
          return;
        }

        if (abilityType === 'physical') playSwordHit();
        if (attacker.position && target.position) {
          const dashX = target.position.x + (attacker.team === 'player' ? -8 : 8);
          const dashY = target.position.y;
          setDashPositions(prev => ({ ...prev, [attackerId]: { x: dashX, y: dashY } }));
        }
        const combo = getComboAnims();
        if (combo && combo.length > 1) {
          combo.forEach((anim, i) => {
            setTimeout(() => {
              setUnitAnims(prev => ({ ...prev, [attackerId]: anim }));
              if (i > 0 && target.position) {
                addParticle('hit', target.position.x + (Math.random() - 0.5) * 4, target.position.y, '#ef4444');
                playSwordHit();
              }
            }, 300 + i * 250);
          });
          const comboEnd = 300 + combo.length * 250;
          setTimeout(() => {
            showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
            if (!evaded) {
              setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
              if (target.position) addParticle('hit', target.position.x, target.position.y, '#ef4444');
              const hfxR4 = getHitEffect(attacker, abilityName, false);
              if (hfxR4.sprite && target.position) {
                const hid = Date.now() + Math.random();
                setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxR4.sprite, filter: hfxR4.filter }]);
                const effectDur = (hfxR4.sprite.frames || 36) * 30 + 100;
                setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
                if (hfxR4.followUp) spawnFollowUpEffects(hfxR4.followUp, target.position.x, target.position.y, hfxR4.filter);
              }
              if (isCrit) {
                playCrit();
                spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
                if (target.position) {
                  const critType = abilityType === 'magical' ? 'spell' : 'melee';
                  const critId = Date.now() + Math.random();
                  setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect(critType) }]);
                  setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
                }
              } else {
                playHurt();
                spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
              }
              if (target.position) spawnWeaponContact(target.position.x, target.position.y, combo.length);
            } else {
              playDodge();
              if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
            }
            setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400);
          }, comboEnd);
          setTimeout(() => {
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
            setDashPositions(prev => { const n = { ...prev }; delete n[attackerId]; return n; });
          }, comboEnd + 300);
          setTimeout(() => advanceTurn(), comboEnd + 600);
        } else {
          setTimeout(() => {
            setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
          }, 300);
          setTimeout(() => {
            showDamageFloat(target, totalDmg, evaded, blocked, isCrit);
            if (!evaded) {
              setUnitAnims(prev => ({ ...prev, [targetId]: 'hurt' }));
              if (target.position) addParticle('hit', target.position.x, target.position.y, '#ef4444');
              const hfxR5 = getHitEffect(attacker, abilityName, false);
              if (hfxR5.sprite && target.position) {
                const hid = Date.now() + Math.random();
                setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxR5.sprite, filter: hfxR5.filter }]);
                const effectDur = (hfxR5.sprite.frames || 36) * 30 + 100;
                setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), effectDur);
                if (hfxR5.followUp) spawnFollowUpEffects(hfxR5.followUp, target.position.x, target.position.y, hfxR5.filter);
              }
              if (isCrit) {
                playCrit();
                spawnSlashImpact(target?.position?.x, target?.position?.y, 'large', getSlashColor(abilityType, abilityName, attacker.classId));
                if (target.position) {
                  const critType = abilityType === 'magical' ? 'spell' : 'melee';
                  const critId = Date.now() + Math.random();
                  setCritFx(prev => [...prev, { id: critId, x: target.position.x, y: target.position.y, ...getRandomCritEffect(critType) }]);
                  setTimeout(() => setCritFx(prev => prev.filter(c => c.id !== critId)), 1500);
                }
              } else {
                playHurt();
                spawnSlashImpact(target?.position?.x, target?.position?.y, 'small', getSlashColor(abilityType, abilityName, attacker.classId));
              }
              if (target.position) spawnWeaponContact(target.position.x, target.position.y, 1);
            } else {
            playDodge();
            if (target.position) spawnDodgeFlash(target.position.x, target.position.y);
          }
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [targetId]: target.health > 0 ? 'idle' : 'death' })), 400);
        }, 500);
        setTimeout(() => {
          setDashPositions(prev => ({ ...prev, [attackerId]: null }));
          setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
        }, 800);
        setTimeout(() => advanceTurn(), 1300);
        }
      }
    } else {
      setUnitAnims(prev => ({ ...prev, [attackerId]: getAttackAnim() }));
      const hfxR6 = getHitEffect(attacker, abilityName, false);
      if ((consumableType === 'resurrect' || abilityType === 'resurrect') && target && target.position) {
        const rezId = Date.now() + Math.random();
        setResurrectFx(prev => [...prev, { id: rezId, x: target.position.x, y: target.position.y }]);
        setTimeout(() => {
          setUnitAnims(prev => ({ ...prev, [targetId]: 'idle' }));
        }, 400);
        setTimeout(() => {
          setResurrectFx(prev => prev.filter(r => r.id !== rezId));
        }, 1200);
        if (healAmt) showHealFloat(target, healAmt);
        addParticle('heal', target.position.x, target.position.y);
        addParticle('cast', target.position.x, target.position.y, '#22c55e');
        playHeal();
      } else if (healAmt && target) {
        showHealFloat(target, healAmt);
        if (target.position) addParticle('heal', target.position.x, target.position.y);
        if (hfxR6.sprite && target.position) {
          const hid = Date.now() + Math.random();
          setHitEffects(prev => [...prev, { id: hid, x: target.position.x, y: target.position.y, sprite: hfxR6.sprite, filter: hfxR6.filter }]);
          setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), (hfxR6.sprite.frames || 16) * 35 + 100);
          if (hfxR6.followUp) spawnFollowUpEffects(hfxR6.followUp, target.position.x, target.position.y, hfxR6.filter);
          if (hfxR6.postHeal && target.position) {
            setTimeout(() => {
              const phid = Date.now() + Math.random();
              setHitEffects(prev => [...prev, { id: phid, x: target.position.x, y: target.position.y, sprite: hfxR6.postHeal }]);
              setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== phid)), (hfxR6.postHeal.frames || 7) * 60 + 100);
            }, 400);
          }
        }
        playHeal();
      } else if (abilityType === 'heal_over_time') {
        playHeal();
        if (attacker.position) {
          addParticle('heal', attacker.position.x, attacker.position.y);
          if (hfxR6.sprite) {
            const hid = Date.now() + Math.random();
            setHitEffects(prev => [...prev, { id: hid, x: attacker.position.x, y: attacker.position.y, sprite: hfxR6.sprite, filter: hfxR6.filter }]);
            setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), (hfxR6.sprite.frames || 16) * 35 + 100);
            if (hfxR6.followUp) spawnFollowUpEffects(hfxR6.followUp, attacker.position.x, attacker.position.y, hfxR6.filter);
            if (hfxR6.postHeal && attacker.position) {
              setTimeout(() => {
                const phid = Date.now() + Math.random();
                setHitEffects(prev => [...prev, { id: phid, x: attacker.position.x, y: attacker.position.y, sprite: hfxR6.postHeal }]);
                setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== phid)), (hfxR6.postHeal.frames || 7) * 60 + 100);
              }, 400);
            }
          }
        }
      } else {
        playBuff();
        if (attacker.position) {
          addParticle('cast', attacker.position.x, attacker.position.y, '#6ee7b7');
          if (hfxR6.sprite) {
            const hid = Date.now() + Math.random();
            setHitEffects(prev => [...prev, { id: hid, x: attacker.position.x, y: attacker.position.y, sprite: hfxR6.sprite, filter: hfxR6.filter }]);
            setTimeout(() => setHitEffects(prev => prev.filter(e => e.id !== hid)), (hfxR6.sprite.frames || 16) * 35 + 100);
            if (hfxR6.followUp) spawnFollowUpEffects(hfxR6.followUp, attacker.position.x, attacker.position.y, hfxR6.filter);
          }
        }
      }
      setTimeout(() => setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' })), 600);
      setTimeout(() => advanceTurn(), 900);
    }
  }, [lastAction]);

  const showDamageFloat = useCallback((target, totalDmg, evaded, blocked, isCrit) => {
    if (!target?.position) return;
    const id = Date.now() + Math.random();
    let text, color;
    if (evaded) { text = 'DODGE!'; color = '#6ee7b7'; }
    else if (blocked) { text = `BLOCK ${totalDmg}`; color = '#3b82f6'; }
    else if (isCrit) { text = `CRIT ${totalDmg}`; color = '#fbbf24'; }
    else { text = `-${totalDmg}`; color = '#ef4444'; }
    setFloatingDmg(prev => [...prev, { id, text, color, x: target.position.x, y: target.position.y - 8 }]);
    setTimeout(() => setFloatingDmg(prev => prev.filter(f => f.id !== id)), 1500);
  }, []);

  const showHealFloat = useCallback((target, healAmt) => {
    if (!target?.position) return;
    const id = Date.now() + Math.random();
    setFloatingDmg(prev => [...prev, { id, text: `+${healAmt}`, color: '#22c55e', x: target.position.x, y: target.position.y - 8 }]);
    setTimeout(() => setFloatingDmg(prev => prev.filter(f => f.id !== id)), 1500);
  }, []);

  const handleAbility = useCallback((abilityId) => {
    if (phase !== 'player_turn') return;
    const allAbilities = currentUnit?.abilities || (currentUnit?.classId ? classDefinitions[currentUnit.classId]?.abilities : []) || [];
    const ability = allAbilities.find(a => a.id === abilityId);
    if (ability && ability.type === 'heal' && playerTeam.filter(u => u.alive).length > 1) {
      setHealTargetMode(abilityId);
      return;
    }
    useAbility(abilityId);
  }, [phase, useAbility, currentUnit, playerTeam]);

  const handleHealTarget = useCallback((targetId) => {
    if (!healTargetMode) return;
    useAbility(healTargetMode, targetId);
    setHealTargetMode(null);
  }, [healTargetMode, useAbility]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        const loot = useGameStore.getState().pendingLoot;
        if (loot && loot.length > 0) {
          e.preventDefault();
          useGameStore.getState().clearPendingLoot();
          return;
        }
        if (phase === 'victory' || phase === 'defeat') {
          e.preventDefault();
          if (battleState?.isTraining) returnFromTraining(battleState.trainingRound);
          else returnToWorld();
          return;
        }
        if (phase === 'missionRoundComplete') {
          e.preventDefault();
          useGameStore.getState().advanceMissionRound();
          return;
        }
        return;
      }
      if (phase !== 'player_turn') return;
      const num = parseInt(e.key);
      if (healTargetMode) {
        const aliveAllies = playerTeam.filter(u => u.alive);
        if (num >= 1 && num <= aliveAllies.length) {
          handleHealTarget(aliveAllies[num - 1].id);
        }
        if (e.key === 'Escape') setHealTargetMode(null);
        return;
      }
      if (!displayedAbilities.length) return;
      if (num >= 1 && num <= displayedAbilities.length) {
        const ability = displayedAbilities[num - 1];
        if (!currentUnit) return;
        const onCd = (currentUnit.cooldowns[ability.id] || 0) > 0;
        const noMana = (ability.manaCost || 0) > currentUnit.mana;
        const noStamina = (ability.staminaCost || 0) > currentUnit.stamina;
        if (!onCd && !noMana && !noStamina) handleAbility(ability.id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, displayedAbilities, currentUnit, handleAbility, healTargetMode, handleHealTarget, playerTeam, battleState, returnToWorld, returnFromTraining]);

  if (!battleState || battleUnits.length === 0) return null;

  const isVictory = phase === 'victory';
  const isDefeat = phase === 'defeat';
  const isMissionRoundComplete = phase === 'missionRoundComplete';

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {bgImage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: '120%', backgroundPosition: 'center 75%',
          opacity: 0.7, zIndex: 0,
        }} />
      )}
      {!bgImage && bgGradient && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: bgGradient,
          zIndex: 0,
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
          }} />
          <div style={{
            position: 'absolute', top: '60%', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 80%, transparent 100%)',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.02) 0%, transparent 60%)',
          }} />
        </div>
      )}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(11,16,32,0.3) 0%, rgba(11,16,32,0.15) 40%, rgba(11,16,32,0.4) 100%)',
        zIndex: 0,
      }} />

      <div style={{
        flex: '0 0 auto', background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid var(--border)', zIndex: 10, backdropFilter: 'blur(4px)',
      }}>
        <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-cinzel" style={{ color: isBoss ? 'var(--gold)' : battleState?.isMission ? '#c084fc' : battleState?.isArena ? '#f97316' : 'var(--accent)', fontSize: '0.7rem' }}>
              {isBoss ? 'BOSS BATTLE' : battleState?.isMission ? `MISSION (${battleState.missionRound}/${battleState.missionTotalRounds})` : battleState?.isArena ? 'ARENA' : 'BATTLE'}
            </span>
            <span style={{ color: 'var(--muted)', fontSize: '0.6rem' }}>Turn {battleState?.turnCount || 1}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentUnit && !isVictory && !isDefeat && (
              <div style={{
                color: currentUnit.team === 'player' ? 'var(--accent)' : 'var(--danger)',
                fontSize: '0.6rem', fontWeight: 600,
                padding: '2px 8px',
                background: currentUnit.team === 'player' ? 'rgba(110,231,183,0.15)' : 'rgba(239,68,68,0.15)',
                borderRadius: 6,
                border: `1px solid ${currentUnit.team === 'player' ? 'var(--accent)' : 'var(--danger)'}`,
              }}>
                {currentUnit.isPlayerControlled ? `${currentUnit.name}'s TURN` : `${currentUnit.name}'s turn`}
              </div>
            )}
            {isMissionRoundComplete && (
              <button onClick={() => {
                useGameStore.getState().advanceMissionRound();
              }} style={{
                background: 'linear-gradient(135deg, rgba(192,132,252,0.3), rgba(192,132,252,0.1))',
                border: '1px solid #c084fc', borderRadius: 8,
                padding: '3px 10px', color: '#c084fc', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                animation: 'glow 2s infinite',
              }}>Next Round <span style={{ opacity: 0.5, fontSize: '0.5rem' }}>[Space]</span></button>
            )}
            {(isVictory || isDefeat) && (
              <button onClick={() => {
                if (battleState?.isTraining) returnFromTraining(battleState.trainingRound);
                else returnToWorld();
              }} style={{
                background: 'var(--border)', border: 'none', borderRadius: 8,
                padding: '3px 10px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.65rem'
              }}>Return <span style={{ opacity: 0.5, fontSize: '0.5rem' }}>[Space]</span></button>
            )}
          </div>
        </div>
        <div ref={logRef} style={{
          padding: '0 16px 4px', maxHeight: 36, overflow: 'hidden',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          {battleLog.slice(-3).map((msg, i, arr) => (
            <div key={i} style={{
              color: i === arr.length - 1 ? 'var(--text)' : 'var(--muted)',
              padding: '0.5px 0', opacity: i === arr.length - 1 ? 1 : 0.5,
              fontSize: '0.55rem',
            }}>{msg}</div>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1, position: 'relative', zIndex: 1, minHeight: 0, overflow: 'hidden',
      }}>
        <AmbientParticles />

        {battleUnits.map((unit, idx) => {
          if (!unit.position) return null;
          const dash = dashPositions[unit.id];
          const posX = dash ? dash.x : unit.position.x;
          const posY = dash ? dash.y : unit.position.y;
          const spriteData = getUnitSprite(unit);
          const anim = unitAnims[unit.id] || 'idle';
          const isCurrentTurnUnit = currentUnit?.id === unit.id;
          const isSelected = selectedTargetId === unit.id;
          const isEnemyClickable = unit.team === 'enemy' && unit.alive && isPlayerTurn;
          const flipSprite = spriteData?.facesLeft ? unit.team === 'player' : unit.team === 'enemy';
          const introDelay = introComplete ? 0 : (idx * 100);
          const baseFrameSize = spriteData?.frameWidth || spriteData?.frameHeight || 100;
          const targetDisplaySize = 200;
          const isBearForm = unit.classId === 'worge' && unit.bearForm;
          const isBossUnit = unit.team === 'enemy' && unit.isBoss;
          const bossScaleVal = isBossUnit ? (unit.bossScale || 1.6) : 1;
          const spriteScale = (targetDisplaySize / baseFrameSize) * (isBearForm ? 1.25 : 1) * bossScaleVal;

          const spriteSize = Math.round(baseFrameSize * spriteScale);
          const footCrop = 0.82;
          const visibleHeight = Math.round(spriteSize * footCrop);
          const footY = visibleHeight;

          return (
            <div
              key={unit.id}
              onClick={() => isEnemyClickable && setSelectedTarget(unit.id)}
              style={{
                position: 'absolute',
                left: `${posX}%`,
                top: `${posY}%`,
                transform: 'translate(-50%, -100%)',
                transition: dash ? 'left 0.3s ease-out, top 0.3s ease-out' : 'left 0.5s ease, top 0.5s ease',
                cursor: isEnemyClickable ? 'pointer' : 'default',
                opacity: introComplete ? (anim === 'death' ? 0 : 1) : 0,
                animation: introComplete ? 'none' : `unitSlideIn 0.6s ease ${introDelay}ms forwards`,
                zIndex: Math.floor(posY),
                pointerEvents: (unit.alive && anim !== 'death') ? 'auto' : 'none',
                width: spriteSize,
                height: footY,
                overflow: 'visible',
                outline: 'none',
                border: 'none',
              }}
            >
              {isCurrentTurnUnit && unit.alive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                  borderTop: `8px solid ${unit.team === 'player' ? 'var(--accent)' : 'var(--danger)'}`,
                  animation: 'pulse 1s infinite',
                  filter: `drop-shadow(0 0 4px ${unit.team === 'player' ? 'var(--accent)' : 'var(--danger)'})`,
                  zIndex: 15,
                }} />
              )}

              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: spriteSize, height: spriteSize,
                filter: anim === 'hurt'
                  ? 'brightness(2) sepia(1) saturate(10) hue-rotate(-10deg) drop-shadow(0 0 12px rgba(255,0,0,0.8))'
                  : isCurrentTurnUnit && unit.alive
                    ? `drop-shadow(0 0 8px ${unit.team === 'player' ? 'rgba(110,231,183,0.6)' : 'rgba(239,68,68,0.6)'})`
                    : 'none',
                transition: 'filter 0.15s',
                animation: anim === 'hurt' ? 'hurtBlink 0.15s ease-in-out 3' : 'none',
              }}>
                <SpriteAnimation
                  spriteData={spriteData}
                  animation={anim}
                  scale={spriteScale}
                  flip={flipSprite}
                  speed={autoBattleEnabled ? 150 : 188}
                  loop={anim === 'idle' || anim === 'walk'}
                  equipmentOverlays={unit.team === 'player' ? buildEquipmentOverlays(heroRoster.find(h => h.id === unit.id), TIERS) : null}
                />
              </div>

              {unit.alive && unit.stunned && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: spriteSize, height: spriteSize, pointerEvents: adminMode ? 'auto' : 'none' }}
                  onMouseDown={adminMode ? (e) => handleAdminDragStart('stun', e) : undefined}
                  title={adminMode ? `Stun: offsetY=${adminOverrides.stun.offsetY}, size=${adminOverrides.stun.size}` : undefined}
                >
                  <LoopingEffectSprite
                    sprite={effectSprites.nebula}
                    displaySize={adminOverrides.stun.size}
                    offsetY={adminOverrides.stun.offsetY}
                    opacity={adminOverrides.stun.opacity}
                    filter="drop-shadow(0 0 6px #67e8f9) drop-shadow(0 0 12px #06b6d4)"
                  />
                  {adminMode && <div style={{ position: 'absolute', top: adminOverrides.stun.offsetY - 8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.4rem', color: '#67e8f9', background: 'rgba(0,0,0,0.8)', padding: '1px 3px', borderRadius: 2, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>STUN y:{adminOverrides.stun.offsetY} s:{adminOverrides.stun.size}</div>}
                </div>
              )}

              {unit.alive && (unit.dots || []).some(d => !d.heal && ['Dagger Toss', 'Poison Arrow', 'Envenom', 'Fan of Knives'].includes(d.source)) && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: spriteSize, height: spriteSize, pointerEvents: adminMode ? 'auto' : 'none' }}
                  onMouseDown={adminMode ? (e) => handleAdminDragStart('poison', e) : undefined}
                  title={adminMode ? `Poison: offsetY=${adminOverrides.poison.offsetY}, size=${adminOverrides.poison.size}` : undefined}
                >
                  <LoopingEffectSprite
                    sprite={effectSprites.magicBubbles}
                    displaySize={adminOverrides.poison.size}
                    offsetY={adminOverrides.poison.offsetY}
                    opacity={adminOverrides.poison.opacity}
                    filter="drop-shadow(0 0 6px #a3e635) drop-shadow(0 0 10px #65a30d)"
                  />
                  {adminMode && <div style={{ position: 'absolute', top: adminOverrides.poison.offsetY - 8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.4rem', color: '#a3e635', background: 'rgba(0,0,0,0.8)', padding: '1px 3px', borderRadius: 2, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>POISON y:{adminOverrides.poison.offsetY} s:{adminOverrides.poison.size}</div>}
                </div>
              )}

              {unit.alive && (unit.dots || []).some(d => !d.heal && !['Dagger Toss', 'Poison Arrow', 'Envenom', 'Fan of Knives'].includes(d.source)) && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: spriteSize, height: spriteSize, pointerEvents: adminMode ? 'auto' : 'none' }}
                  onMouseDown={adminMode ? (e) => handleAdminDragStart('dot', e) : undefined}
                  title={adminMode ? `DoT: offsetY=${adminOverrides.dot.offsetY}, size=${adminOverrides.dot.size}` : undefined}
                >
                  <LoopingEffectSprite
                    sprite={effectSprites.fire}
                    displaySize={adminOverrides.dot.size}
                    offsetY={adminOverrides.dot.offsetY}
                    opacity={adminOverrides.dot.opacity}
                    filter="drop-shadow(0 0 6px #f97316) drop-shadow(0 0 10px #ef4444)"
                  />
                  {adminMode && <div style={{ position: 'absolute', top: adminOverrides.dot.offsetY - 8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.4rem', color: '#f97316', background: 'rgba(0,0,0,0.8)', padding: '1px 3px', borderRadius: 2, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>DOT y:{adminOverrides.dot.offsetY} s:{adminOverrides.dot.size}</div>}
                </div>
              )}

              {unit.alive && (unit.buffs || []).length > 0 && !unit.stunned && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: spriteSize, height: spriteSize, pointerEvents: adminMode ? 'auto' : 'none' }}
                  onMouseDown={adminMode ? (e) => handleAdminDragStart('buff', e) : undefined}
                  title={adminMode ? `Buff: offsetY=${adminOverrides.buff.offsetY}, size=${adminOverrides.buff.size}` : undefined}
                >
                  <LoopingEffectSprite
                    sprite={effectSprites.blueFire}
                    displaySize={adminOverrides.buff.size}
                    offsetY={adminOverrides.buff.offsetY}
                    opacity={adminOverrides.buff.opacity}
                    filter="drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 8px #06b6d4)"
                  />
                  {adminMode && <div style={{ position: 'absolute', top: adminOverrides.buff.offsetY - 8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.4rem', color: '#38bdf8', background: 'rgba(0,0,0,0.8)', padding: '1px 3px', borderRadius: 2, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>BUFF y:{adminOverrides.buff.offsetY} s:{adminOverrides.buff.size}</div>}
                </div>
              )}

              {isSelected && unit.alive && (
                <div style={{
                  position: 'absolute', top: footY - 8, left: '50%', transform: 'translateX(-50%)',
                  width: 50, height: 12, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.35)',
                  border: '2px solid var(--danger)',
                  animation: 'pulse 1s infinite',
                  zIndex: 15,
                }} />
              )}

              <div style={{
                position: 'absolute', top: footY - 2, left: '50%', transform: 'translateX(-50%)',
                width: 40, height: 8, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
                zIndex: 1,
              }} />

              <div
                onMouseDown={adminMode ? (e) => handleAdminDragStart('nameplate', e) : undefined}
                style={{
                position: 'absolute', top: footY + 2, left: '50%', transform: 'translateX(-50%)',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '2px 5px',
                minWidth: 55, zIndex: 20,
              }}>
                <div style={{
                  fontSize: '0.5rem', fontWeight: 600,
                  color: unit.id === 'player' ? 'var(--accent)' : (unit.team === 'player' ? '#93c5fd' : '#fca5a5'),
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 65,
                  marginBottom: 1,
                }}>
                  {unit.name}
                </div>
                <MiniBar current={unit.health} max={unit.maxHealth} color={unit.team === 'player' ? '#22c55e' : '#ef4444'} height={4} width={50} />
                <div style={{ display: 'flex', gap: 2, marginTop: 1, justifyContent: 'center' }}>
                  <MiniBar current={unit.mana} max={unit.maxMana} color="#3b82f6" height={2} width={23} />
                  <MiniBar current={unit.stamina} max={unit.maxStamina} color="#f59e0b" height={2} width={23} />
                </div>
                {unit.team === 'player' && (
                  <div style={{ marginTop: 1 }}>
                    <MiniBar 
                      current={unit.grudge || 0} 
                      max={100} 
                      color="#dc2626" 
                      height={3} 
                      width={50} 
                    />
                    {(unit.grudge || 0) >= 100 && (
                      <div style={{
                        fontSize: '0.35rem', color: '#ef4444', fontWeight: 800,
                        textAlign: 'center', animation: 'pulse 1s infinite',
                        textShadow: '0 0 4px #ef4444',
                      }}>GRUDGE!</div>
                    )}
                  </div>
                )}
                {(unit.buffs?.length > 0 || unit.focusStacks > 0) && (
                  <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginTop: 1, flexWrap: 'wrap' }}>
                    {unit.focusStacks > 0 && (
                      <span style={{
                        fontSize: '0.4rem', padding: '0 2px', borderRadius: 2,
                        background: 'rgba(239,68,68,0.3)', color: '#ef4444',
                      }}><InlineIcon name="target" size={10} />{unit.focusStacks}</span>
                    )}
                    {(unit.buffs || []).slice(0, 3).map((b, i) => (
                      <span key={i} style={{
                        fontSize: '0.4rem', padding: '0 2px', borderRadius: 2,
                        background: 'rgba(110,231,183,0.3)', color: 'var(--accent)',
                      }}>{b.source?.slice(0, 4)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeParticles.map(p => {
          if (p.type === 'cast') return <CastingParticles key={p.id} x={p.x} y={p.y} color={p.color} />;
          if (p.type === 'hit') return <HitParticles key={p.id} x={p.x} y={p.y} color={p.color} />;
          if (p.type === 'heal') return <HealParticles key={p.id} x={p.x} y={p.y} />;
          return null;
        })}

        {projectiles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.phase === 'fly' ? p.endX : p.startX}%`,
            top: `${p.phase === 'fly' ? p.endY : p.startY}%`,
            transition: 'left 0.45s ease-in, top 0.45s ease-in',
            transform: `translate(-50%, -50%) rotate(${p.angle || 0}deg)`,
            zIndex: 200,
            pointerEvents: 'none',
          }}>
            {p.isDagger ? (
              <div style={{ position: 'relative', width: 24, height: 10 }}>
                <div style={{
                  position: 'absolute', top: 1, left: 0,
                  width: 16, height: 3,
                  background: 'linear-gradient(90deg, #64748b, #cbd5e1, #e2e8f0)',
                  borderRadius: 1,
                  boxShadow: '0 0 6px rgba(148,163,184,0.8), 0 0 12px rgba(148,163,184,0.4)',
                }} />
                <div style={{
                  position: 'absolute', top: -1, left: 12,
                  width: 0, height: 0,
                  borderLeft: '8px solid #e2e8f0',
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  filter: 'drop-shadow(0 0 4px rgba(226,232,240,0.6))',
                }} />
                <div style={{
                  position: 'absolute', top: -2, left: 5,
                  width: 2, height: 9,
                  background: '#94a3b8',
                  borderRadius: 1,
                }} />
                <div style={{
                  position: 'absolute', top: -1, left: -4,
                  width: 6, height: 2,
                  background: 'linear-gradient(90deg, #475569, #64748b)',
                  borderRadius: 1,
                  transform: 'rotate(-10deg)',
                }} />
                <div style={{
                  position: 'absolute', top: 3, left: -4,
                  width: 6, height: 2,
                  background: 'linear-gradient(90deg, #475569, #64748b)',
                  borderRadius: 1,
                  transform: 'rotate(10deg)',
                }} />
              </div>
            ) : p.isElectric ? (
              <ThunderProjectileSprite />
            ) : p.beamSrc ? (
              <img src={p.beamSrc} alt="" style={{
                width: 120, height: 20,
                filter: `drop-shadow(0 0 8px ${p.color})`,
                opacity: 0.9,
              }} />
            ) : (
              <div style={{
                width: 14, height: 14,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${p.color}, ${p.color}88, transparent)`,
                boxShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color}66, 0 0 4px #fff`,
              }} />
            )}
          </div>
        ))}

        {hitEffects.map(e => (
          <EffectSprite key={e.id} x={e.x} y={e.y} sprite={e.sprite} filter={e.filter} />
        ))}

        {critFx.map(c => (
          <GrowingEffectSprite key={c.id} x={c.x} y={c.y} sprite={c.sprite} filter={c.filter} />
        ))}

        {slashImpactFx.map(s => (
          <StackedSlashImpact key={s.id} x={s.x} y={s.y} level={s.level} color={s.color} />
        ))}

        {dodgeFlashes.map(d => (
          <DodgeFlashSprite key={d.id} x={d.x} y={d.y} />
        ))}

        {castingFx.map(c => (
          <CastingSpriteEffect key={c.id} x={c.x} y={c.y} />
        ))}

        {weaponContactFx.map(w => (
          <WeaponContactSprite key={w.id} x={w.x} y={w.y} playCount={w.playCount} />
        ))}

        {fireballFx.map(fb => (
          <FireballProjectile key={fb.id} startX={fb.startX} startY={fb.startY} endX={fb.endX} endY={fb.endY} phase={fb.phase} />
        ))}

        {fireExplosionFx.map(ex => (
          <FireballExplosion key={ex.id} x={ex.x} y={ex.y} angles={ex.angles} />
        ))}

        {iceStormFx.map(ice => (
          <IceStormProjectile key={ice.id} startX={ice.startX} startY={ice.startY} endX={ice.endX} endY={ice.endY} phase={ice.phase} />
        ))}

        {waterArrowFx.map(w => (
          <WaterArrowProjectile key={w.id} startX={w.startX} startY={w.startY} endX={w.endX} endY={w.endY} phase={w.phase} />
        ))}

        {waterSplashFx.map(s => (
          <WaterSplashExplosion key={s.id} x={s.x} y={s.y} angles={s.angles} />
        ))}

        {poisonGustFx.map(pg => (
          <PoisonGustProjectile key={pg.id} startX={pg.startX} startY={pg.startY} endX={pg.endX} endY={pg.endY} phase={pg.phase} />
        ))}

        {resurrectFx.map(r => (
          <ResurrectEffect key={r.id} x={r.x} y={r.y} />
        ))}

        {floatingDmg.map(f => (
          <div key={f.id} style={{
            position: 'absolute',
            left: `${f.x}%`, top: `${f.y}%`,
            transform: 'translate(-50%, 0)',
            color: f.color, fontWeight: 800, fontSize: '1rem',
            textShadow: `0 0 8px ${f.color}, 0 2px 4px rgba(0,0,0,0.8)`,
            animation: 'floatUp 1.5s ease forwards',
            pointerEvents: 'none', zIndex: 300,
            fontFamily: "'Cinzel', serif",
          }}>
            {f.text}
          </div>
        ))}

        {(isVictory || isDefeat) && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', animation: 'slideUp 0.5s ease', zIndex: 100,
            backgroundImage: isDefeat ? 'linear-gradient(135deg, rgba(11,16,32,0.85), rgba(30,0,0,0.8)), url(/backgrounds/wc_gold.png)' : undefined,
            background: isDefeat ? undefined : 'rgba(11,16,32,0.9)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            padding: '24px 40px', borderRadius: 16,
            border: `2px solid ${isVictory ? 'var(--gold)' : 'var(--danger)'}`,
            backdropFilter: 'blur(8px)',
          }}>
            <div className="font-cinzel" style={{
              fontSize: '1.8rem',
              color: isVictory ? 'var(--gold)' : 'var(--danger)',
              textShadow: `0 0 20px ${isVictory ? 'rgba(255,215,0,0.4)' : 'rgba(239,68,68,0.4)'}`
            }}>
              {isVictory ? 'VICTORY!' : 'DEFEAT'}
            </div>
            {isVictory && (
              <div style={{ color: 'var(--accent)', marginTop: 8, fontSize: '0.8rem' }}>
                +{battleUnits.filter(u => u.team === 'enemy').reduce((s, e) => s + (e.xpReward || 0), 0)} XP |
                +{Math.floor(battleUnits.filter(u => u.team === 'enemy').reduce((s, e) => s + (e.goldReward || 0), 0) * 0.1)} Gold
              </div>
            )}
            {isDefeat && (
              <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: '0.75rem' }}>
                Recover at 50% HP, lose 10% gold.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              {isVictory && currentLocation && !battleState?.isTraining && (
                <button onClick={() => startBattle(currentLocation)} style={{
                  background: 'linear-gradient(135deg, var(--accent), #10b981)',
                  border: 'none', borderRadius: 10, padding: '8px 16px',
                  color: '#0b1020', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                }}>Fight Again</button>
              )}
              <button onClick={() => {
                if (battleState?.isTraining) returnFromTraining(battleState.trainingRound);
                else returnToWorld();
              }} style={{
                background: isDefeat ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))' : 'var(--border)',
                border: isDefeat ? '2px solid var(--danger)' : 'none',
                borderRadius: 10, padding: '8px 16px',
                color: isDefeat ? 'var(--danger)' : 'var(--text)',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'
              }}>
                {battleState?.isTraining ? 'Continue' : (isDefeat ? 'Retreat & Recover' : 'Return to World')}
                <span style={{ fontSize: '0.55rem', opacity: 0.5, marginLeft: 6 }}>[Space]</span>
              </button>
            </div>
          </div>
        )}

      </div>


      <div style={{
        position: 'absolute', bottom: 210, right: 16, zIndex: 50,
      }}>
        <button onClick={toggleAutoBattle} style={{
          background: autoBattleEnabled
            ? 'linear-gradient(135deg, rgba(251,191,36,0.4), rgba(245,158,11,0.2))'
            : 'rgba(0,0,0,0.5)',
          border: `2px solid ${autoBattleEnabled ? '#f59e0b' : '#4a4a5a'}`,
          borderRadius: 10, padding: '8px 14px',
          color: autoBattleEnabled ? '#fbbf24' : '#888',
          cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800,
          letterSpacing: '0.08em',
          backdropFilter: 'blur(4px)',
          boxShadow: autoBattleEnabled ? '0 0 16px rgba(251,191,36,0.3), 0 0 32px rgba(251,191,36,0.1)' : 'none',
          transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', gap: 6,
          animation: autoBattleEnabled ? 'pulse 2s infinite' : 'none',
        }}>
          <span style={{ fontSize: '1rem' }}>{autoBattleEnabled ? <InlineIcon name="battle" size={14} /> : <InlineIcon name="target" size={14} />}</span>
          AUTO {autoBattleEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {adminMode && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 500,
          background: 'rgba(0,0,0,0.92)', border: '2px solid #f59e0b',
          borderRadius: 10, padding: '10px 14px', width: 220,
          backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>ADMIN MODE</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setAdminPaused(p => !p)} style={{
                background: adminPaused ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
                border: `1px solid ${adminPaused ? '#ef4444' : '#22c55e'}`,
                color: adminPaused ? '#ef4444' : '#22c55e',
                borderRadius: 4, padding: '2px 6px', fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer',
              }}>{adminPaused ? '⏸ PAUSED' : '▶ PLAYING'}</button>
              <button onClick={() => { setAdminMode(false); setAdminPaused(false); }} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#ccc', borderRadius: 4, padding: '2px 6px', fontSize: '0.5rem', cursor: 'pointer',
              }}>✕</button>
            </div>
          </div>
          <div style={{ fontSize: '0.45rem', color: '#888', marginBottom: 6 }}>Drag effects on characters to reposition. Use sliders to resize.</div>
          {Object.entries(adminOverrides).map(([key, val]) => (
            <div key={key} style={{ marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ddd', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>{key}</span>
                <span style={{ color: '#888', fontSize: '0.45rem' }}>Y:{val.offsetY}{val.size !== undefined ? ` S:${val.size}` : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 2, alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '0.4rem', width: 8 }}>Y</span>
                <input type="range" min={-80} max={20} value={val.offsetY}
                  onChange={(e) => setAdminOverrides(prev => ({ ...prev, [key]: { ...prev[key], offsetY: parseInt(e.target.value) } }))}
                  style={{ flex: 1, height: 8, accentColor: '#f59e0b' }}
                />
              </div>
              {val.size !== undefined && (
                <div style={{ display: 'flex', gap: 4, marginTop: 2, alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: '0.4rem', width: 8 }}>S</span>
                  <input type="range" min={8} max={80} value={val.size}
                    onChange={(e) => setAdminOverrides(prev => ({ ...prev, [key]: { ...prev[key], size: parseInt(e.target.value) } }))}
                    style={{ flex: 1, height: 8, accentColor: '#3b82f6' }}
                  />
                </div>
              )}
              {val.opacity !== undefined && (
                <div style={{ display: 'flex', gap: 4, marginTop: 2, alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: '0.4rem', width: 8 }}>O</span>
                  <input type="range" min={10} max={100} value={Math.round(val.opacity * 100)}
                    onChange={(e) => setAdminOverrides(prev => ({ ...prev, [key]: { ...prev[key], opacity: parseInt(e.target.value) / 100 } }))}
                    style={{ flex: 1, height: 8, accentColor: '#a78bfa' }}
                  />
                </div>
              )}
            </div>
          ))}
          <button onClick={() => {
            const json = JSON.stringify(adminOverrides, null, 2);
            navigator.clipboard.writeText(json).then(() => alert('Copied to clipboard!')).catch(() => {});
          }} style={{
            width: '100%', background: 'rgba(251,191,36,0.15)', border: '1px solid #f59e0b',
            color: '#f59e0b', borderRadius: 4, padding: '3px 0', fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer', marginTop: 4,
          }}><InlineIcon name="scroll" size={12} /> Copy Values</button>
          <div style={{ fontSize: '0.4rem', color: '#666', marginTop: 4, textAlign: 'center' }}>Press ~ to toggle admin mode</div>
        </div>
      )}

      <div style={{
          flex: '0 0 140px', height: 140, minHeight: 140, maxHeight: 140,
          borderTop: `2px solid ${(!isVictory && !isDefeat && isPlayerTurn) ? '#8b7355' : (currentUnit?.team === 'enemy' ? '#6b3030' : '#4a5a7a')}`,
          zIndex: 10,
          display: 'flex', flexDirection: 'row',
          transition: 'border-color 0.3s',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(8,12,24,0.95)',
        }}>
          <div style={{
            flex: '0 0 140px', width: 140,
            padding: '6px 6px',
            display: 'flex', flexDirection: 'column', gap: 3,
            justifyContent: 'center',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {playerTeam.map(unit => {
              const hpPct = Math.round((unit.health / unit.maxHealth) * 100);
              const hpColor = !unit.alive ? '#555' : hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
              const grudgePct = Math.min(100, unit.grudge || 0);
              return (
                <div key={unit.id} style={{ opacity: unit.alive ? 1 : 0.4 }}>
                  <div style={{
                    fontSize: '0.5rem', fontWeight: 700,
                    color: unit.id === currentUnitId ? 'var(--accent)' : '#93c5fd',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 1,
                  }}>{unit.name}</div>
                  <MiniBar current={unit.health} max={unit.maxHealth} color={hpColor} height={5} width={128} />
                  <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                    <MiniBar current={unit.mana} max={unit.maxMana} color="#3b82f6" height={3} width={62} />
                    <MiniBar current={unit.stamina} max={unit.maxStamina} color="#f59e0b" height={3} width={62} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                    <MiniBar current={grudgePct} max={100} color="#dc2626" height={3} width={grudgePct >= 100 ? 96 : 128} />
                    {grudgePct >= 100 && (
                      <span style={{ fontSize: '0.4rem', color: '#ef4444', fontWeight: 800, animation: 'pulse 1s infinite', whiteSpace: 'nowrap' }}>MAX</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            flex: '0 0 auto', width: 44,
            padding: '4px 2px',
            display: 'flex', flexDirection: 'column', gap: 2,
            justifyContent: 'center', alignItems: 'center',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}>
            {playerTeam.map(unit => {
              const hero = heroRoster.find(h => h.id === unit.id);
              const eq = hero?.equipment || {};
              const weapon = eq.weapon;
              const weaponSprite = weapon ? getItemSpriteIcon(weapon) : null;
              const tierDef = weapon ? (TIERS[weapon.tier] || TIERS[1]) : null;
              const equippedCount = Object.values(eq).filter(Boolean).length;
              return (
                <div key={unit.id}
                  onMouseEnter={() => setHoveredGearUnitId(unit.id)}
                  onMouseLeave={() => setHoveredGearUnitId(null)}
                  style={{
                    width: 36, height: 36,
                    background: hoveredGearUnitId === unit.id ? 'rgba(139,115,85,0.35)' : 'rgba(0,0,0,0.35)',
                    border: `1px solid ${tierDef ? tierDef.color + '88' : 'rgba(139,115,85,0.25)'}`,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    opacity: unit.alive ? 1 : 0.35,
                    position: 'relative',
                  }}
                >
                  {weaponSprite ? (
                    <img src={weaponSprite} alt="" style={{ width: 24, height: 24, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />
                  ) : (
                    <span style={{ fontSize: '0.9rem' }}><InlineIcon name={weapon?.icon || 'battle'} size={14} /></span>
                  )}
                  {equippedCount > 0 && (
                    <div style={{
                      position: 'absolute', bottom: -1, right: -1,
                      background: '#1a1a2e', border: '1px solid rgba(139,115,85,0.4)',
                      borderRadius: '50%', width: 12, height: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.4rem', fontWeight: 700, color: '#d4a96a',
                    }}>{equippedCount}</div>
                  )}
                  {hoveredGearUnitId === unit.id && hero && (() => {
                    const ps = 1.6;
                    const pW = 96 * ps;
                    const pH = 128 * ps;
                    const sPx = 20 * ps;
                    const sPos = {
                      helmet:  { left: 35 * ps, top: 8 * ps },
                      weapon:  { left: 11 * ps, top: 32 * ps },
                      armor:   { left: 35 * ps, top: 32 * ps },
                      offhand: { left: 59 * ps, top: 32 * ps },
                      feet:    { left: 35 * ps, top: 56 * ps },
                      ring:    { left: 17 * ps, top: 85 * ps },
                      relic:   { left: 52 * ps, top: 85 * ps },
                    };
                    return (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                        marginBottom: 6, zIndex: 100,
                        background: 'rgba(12,10,8,0.96)',
                        border: '2px solid #8b7355',
                        borderRadius: 8,
                        padding: '8px 10px 10px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 12px rgba(139,115,85,0.2)',
                        pointerEvents: 'none',
                        minWidth: pW + 20,
                      }}>
                        <div style={{
                          textAlign: 'center', fontSize: '0.55rem', fontWeight: 700,
                          color: '#d4a96a', letterSpacing: 1, marginBottom: 5,
                          textTransform: 'uppercase', fontFamily: 'var(--font-heading)',
                        }}>{unit.name}</div>
                        <div style={{
                          width: pW, height: pH, margin: '0 auto',
                          backgroundImage: `url(${UI_PANELS.equipPanelSmall})`,
                          backgroundSize: `${pW}px ${pH}px`,
                          imageRendering: 'pixelated',
                          position: 'relative',
                        }}>
                          {Object.entries(sPos).map(([slot, pos]) => {
                            const item = eq[slot];
                            const itemSprite = item ? getItemSpriteIcon(item) : null;
                            const tDef = item ? (TIERS[item.tier] || TIERS[1]) : null;
                            return (
                              <div key={slot} style={{
                                position: 'absolute', left: pos.left, top: pos.top,
                                width: sPx, height: sPx,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {item ? (
                                  <>
                                    {itemSprite ? (
                                      <img src={itemSprite} alt={item.name} style={{
                                        width: '75%', height: '75%', objectFit: 'contain',
                                        imageRendering: 'pixelated',
                                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))',
                                      }} />
                                    ) : (
                                      <InlineIcon name={item.icon} size={14} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))' }} />
                                    )}
                                    {tDef && <div style={{ position: 'absolute', bottom: 1, left: 2, right: 2, height: 2, background: tDef.color, borderRadius: 1, boxShadow: `0 0 4px ${tDef.color}` }} />}
                                  </>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{
                          marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: '2px 6px',
                          justifyContent: 'center',
                        }}>
                          {EQUIPMENT_SLOTS.map(slot => {
                            const item = eq[slot];
                            if (!item) return null;
                            const tDef = TIERS[item.tier] || TIERS[1];
                            return (
                              <div key={slot} style={{
                                fontSize: '0.45rem', color: tDef.color,
                                whiteSpace: 'nowrap',
                              }}>
                                {item.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          <div style={{
            flex: 1, minWidth: 0,
            padding: '6px 8px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative',
          }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
          {isVictory || isDefeat ? (
            <div style={{
              textAlign: 'center', padding: '8px 0',
              color: isVictory ? 'var(--gold)' : 'var(--danger)',
              fontSize: '0.85rem', fontWeight: 700,
            }}>
              {isVictory ? 'Victory!' : 'Defeated...'}
            </div>
          ) : isPlayerTurn && currentUnit ? (
            <>
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 5,
              }}>
                <button onClick={autoAttack} style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '2px solid #8b4444', borderRadius: 4,
                  padding: '4px 12px', color: '#ef4444', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,68,68,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}
                ><SpriteIcon src={UI_ICONS.actionAttack} size={16} scale={2} /> Attack</button>
                <button onClick={defendTurn} style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '2px solid #445a8b', borderRadius: 4,
                  padding: '4px 12px', color: '#60a5fa', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(68,90,139,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}
                ><SpriteIcon src={UI_ICONS.actionDefend} size={16} scale={2} /> Defend</button>
                <button onClick={skipTurn} style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '2px solid #5c5c6a', borderRadius: 4,
                  padding: '4px 12px', color: 'rgba(180,180,200,0.8)', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(80,80,100,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
                >Skip</button>
                {(() => {
                  const consumables = inventory.filter(i => i.slot === 'consumable');
                  if (consumables.length === 0) return null;
                  return (
                    <button onClick={() => setShowItemsPanel(!showItemsPanel)} style={{
                      background: showItemsPanel ? 'rgba(74,222,128,0.3)' : 'rgba(0,0,0,0.3)',
                      border: `2px solid ${showItemsPanel ? '#4ade80' : '#4a7a5a'}`, borderRadius: 4,
                      padding: '4px 12px', color: showItemsPanel ? '#4ade80' : '#86efac', cursor: 'pointer',
                      fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={e => { if (!showItemsPanel) e.currentTarget.style.background = 'rgba(74,222,128,0.15)'; }}
                    onMouseLeave={e => { if (!showItemsPanel) e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
                    ><InlineIcon name="crystal" size={12} /> Items ({consumables.length})</button>
                  );
                })()}
                {(currentUnit.grudge || 0) >= 100 && (
                  <button onClick={useGrudge} style={{
                    background: 'linear-gradient(135deg, rgba(220,38,38,0.5), rgba(239,68,68,0.3))',
                    border: '2px solid #ef4444', borderRadius: 4,
                    padding: '4px 12px', color: '#fca5a5', cursor: 'pointer',
                    fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.15s',
                    animation: 'pulse 1s infinite',
                    textShadow: '0 0 8px #ef4444',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220,38,38,0.7), rgba(239,68,68,0.5))'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220,38,38,0.5), rgba(239,68,68,0.3))'; }}
                  ><InlineIcon name="fire" size={12} /> REVENGE</button>
                )}
              </div>
              {showItemsPanel && (() => {
                const consumables = inventory.filter(i => i.slot === 'consumable');
                const grouped = {};
                consumables.forEach(c => {
                  const key = c.templateId || c.consumableType;
                  if (!grouped[key]) grouped[key] = { ...c, count: 0, items: [] };
                  grouped[key].count++;
                  grouped[key].items.push(c);
                });
                return (
                  <div style={{
                    background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(74,222,128,0.3)',
                    borderRadius: 8, padding: 6, marginBottom: 4,
                    display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center',
                  }}>
                    {Object.values(grouped).map(group => {
                      const isRezzy = group.consumableType === 'resurrect';
                      const deadAlly = isRezzy ? battleUnits.find(u => u.team === 'player' && !u.alive) : null;
                      const disabled = isRezzy && !deadAlly;
                      return (
                      <button key={group.templateId || group.consumableType} onClick={() => {
                        if (disabled) return;
                        const item = group.items[0];
                        if (isRezzy) {
                          useConsumable(item.id, deadAlly.id);
                          setShowItemsPanel(false);
                        } else {
                          const allyTarget = battleUnits.find(u => u.id === selectedTargetId && u.team === 'player' && u.alive);
                          useConsumable(item.id, allyTarget ? allyTarget.id : currentUnitId);
                          setShowItemsPanel(false);
                        }
                      }}
                      title={disabled ? 'No fallen allies to revive' : group.description}
                      style={{
                        background: disabled ? 'rgba(100,100,100,0.2)' : 'rgba(74,222,128,0.1)',
                        border: `1px solid ${disabled ? 'rgba(100,100,100,0.2)' : 'rgba(74,222,128,0.25)'}`,
                        borderRadius: 6, padding: '4px 8px', cursor: disabled ? 'not-allowed' : 'pointer',
                        color: disabled ? 'rgba(150,150,150,0.5)' : '#86efac',
                        fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
                      }}
                      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(74,222,128,0.25)'; }}
                      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; }}
                      >
                        <InlineIcon name={group.icon} size={14} />
                        <span>{group.name}</span>
                        <span style={{ color: '#4ade80', fontSize: '0.55rem' }}>x{group.count}</span>
                      </button>
                      );
                    })}
                  </div>
                );
              })()}
              {healTargetMode && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{
                    textAlign: 'center', marginBottom: 6, color: '#22c55e',
                    fontSize: '0.65rem', letterSpacing: 1, fontWeight: 700,
                  }}>
                    <InlineIcon name="heart" size={12} /> Choose ally to heal <span style={{ color: '#86efac', fontWeight: 400 }}>(Press 1-{playerTeam.filter(u => u.alive).length} or Esc to cancel)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {playerTeam.filter(u => u.alive).map((ally, idx) => {
                      const hpPct = Math.round((ally.health / ally.maxHealth) * 100);
                      const hpColor = hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
                      const spriteData = getPlayerSprite(ally.classId, ally.raceId);
                      const idleAnim = spriteData?.idle;
                      return (
                        <button key={ally.id} onClick={() => handleHealTarget(ally.id)}
                          style={{
                            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,95,70,0.25))',
                            border: '2px solid #22c55e', borderRadius: 8, padding: '6px 14px',
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                            minWidth: 100, position: 'relative',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(6,95,70,0.4))'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,95,70,0.25))'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <div style={{
                            position: 'absolute', top: -6, left: -6,
                            background: '#22c55e', borderRadius: '50%',
                            width: 18, height: 18, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800,
                            color: '#052e16', border: '1px solid rgba(0,0,0,0.3)',
                          }}>{idx + 1}</div>
                          <div style={{ width: 48, height: 48, margin: '0 auto 4px', overflow: 'hidden', position: 'relative' }}>
                            {idleAnim && (
                              <div style={{
                                width: 48, height: 48,
                                backgroundImage: `url(${idleAnim.src})`,
                                backgroundSize: `${(idleAnim.frames || 6) * 48}px 48px`,
                                backgroundPosition: '0 0',
                                imageRendering: 'pixelated',
                                ...(spriteData.filter ? { filter: spriteData.filter } : {}),
                              }} />
                            )}
                          </div>
                          <div style={{ color: '#e8dcc8', fontSize: '0.65rem', fontWeight: 700, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{ally.name}</div>
                          <div style={{
                            background: 'rgba(0,0,0,0.5)', borderRadius: 3, height: 8, width: '100%', overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}>
                            <div style={{
                              height: '100%', width: `${hpPct}%`,
                              background: `linear-gradient(90deg, ${hpColor}, ${hpColor}cc)`,
                              borderRadius: 2, transition: 'width 0.3s',
                            }} />
                          </div>
                          <div style={{ color: hpColor, fontSize: '0.55rem', fontWeight: 600, marginTop: 2 }}>
                            {ally.health}/{ally.maxHealth} HP
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {!healTargetMode && (<div style={{
                textAlign: 'center', marginBottom: 4, color: '#a08b6d',
                fontSize: '0.6rem', letterSpacing: 1
              }}>
                <span style={{ color: '#d4a96a', fontWeight: 700 }}>{currentUnit.name}</span>
                {' — '}Choose action <span style={{ color: '#d4a96a' }}>(1-{displayedAbilities.length})</span>
                {selectedTargetId && (
                  <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                    Target: {battleUnits.find(u => u.id === selectedTargetId)?.name || '—'}
                  </span>
                )}
              </div>)}
              {!healTargetMode && (<div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                {displayedAbilities.map((ability, idx) => {
                  const onCd = (currentUnit.cooldowns[ability.id] || 0) > 0;
                  const noMana = (ability.manaCost || 0) > currentUnit.mana;
                  const noStamina = (ability.staminaCost || 0) > currentUnit.stamina;
                  const alreadyTransformed = (ability.isDemonBlade && currentUnit.demonBlade);
                  const disabled = onCd || noMana || noStamina || alreadyTransformed;
                  return (
                    <button key={ability.id} onClick={() => !disabled && handleAbility(ability.id)}
                      title={`${ability.description}\n${ability.manaCost ? `MP: ${ability.manaCost}` : ''}${ability.staminaCost ? `SP: ${ability.staminaCost}` : ''}${ability.manaGain ? `+${ability.manaGain} MP` : ''}${ability.staminaGain ? ` +${ability.staminaGain} SP` : ''}`}
                      style={{
                        backgroundImage: disabled ? 'none' : `url(${UI_SLOTS.hotbar})`,
                        backgroundSize: 'cover', imageRendering: 'pixelated',
                        background: disabled ? 'rgba(30,30,40,0.5)' : undefined,
                        backgroundColor: disabled ? 'rgba(30,30,40,0.5)' : 'rgba(60,45,25,0.6)',
                        border: `2px solid ${disabled ? '#3a3a4a' : '#8b7355'}`,
                        borderRadius: 4, padding: '5px 10px', minWidth: 90,
                        color: disabled ? '#555' : '#e8dcc8',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', textAlign: 'center', opacity: disabled ? 0.5 : 1,
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#d4a96a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = '#8b7355'; e.currentTarget.style.transform = 'none'; }}}
                    >
                      <div style={{
                        position: 'absolute', top: -5, left: -5,
                        background: disabled ? '#333' : '#d4a96a', borderRadius: '50%',
                        width: 16, height: 16, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700,
                        color: disabled ? '#666' : '#2a1a0a', border: '1px solid rgba(0,0,0,0.3)'
                      }}>{idx + 1}</div>
                      <div style={{ marginBottom: 0, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' }}><AbilityIcon ability={ability} size={28} /></div>
                      <div style={{ fontWeight: 600, fontSize: '0.65rem', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{ability.name}</div>
                      <div style={{ fontSize: '0.5rem', color: '#a08b6d', marginTop: 0 }}>
                        {ability.manaCost > 0 && <span style={{ color: '#6b9bd2' }}>{ability.manaCost}MP </span>}
                        {ability.staminaCost > 0 && <span style={{ color: '#d4a96a' }}>{ability.staminaCost}SP</span>}
                        {ability.manaGain > 0 && <span style={{ color: '#7bb8e8' }}>+{ability.manaGain}MP </span>}
                        {ability.staminaGain > 0 && <span style={{ color: '#e8c86a' }}>+{ability.staminaGain}SP</span>}
                      </div>
                      {onCd && (
                        <div style={{
                          position: 'absolute', top: 2, right: 2,
                          background: '#8b3030', borderRadius: '50%', border: '1px solid #4a1515',
                          width: 14, height: 14, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: '#e8c8c8'
                        }}>{currentUnit.cooldowns[ability.id]}</div>
                      )}
                    </button>
                  );
                })}
              </div>)}
            </>
          ) : (
            <div style={{
              color: currentUnit?.team === 'enemy' ? '#c45050' : '#93c5fd',
              fontSize: '0.8rem', fontWeight: 600,
              animation: 'pulse 1s infinite', textAlign: 'center'
            }}>
              {currentUnit?.name || 'Processing'}{phase === 'animating' ? ' attacks...' : ' is acting...'}
            </div>
          )}
          </div>
          </div>

          <div style={{
            flex: '0 0 140px', width: 140,
            padding: '6px 6px',
            display: 'flex', flexDirection: 'column', gap: 3,
            justifyContent: 'center',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {enemyTeam.map(unit => {
              const hpPct = Math.round((unit.health / unit.maxHealth) * 100);
              const hpColor = !unit.alive ? '#555' : hpPct > 60 ? '#ef4444' : hpPct > 30 ? '#f59e0b' : '#22c55e';
              return (
                <div key={unit.id} style={{ opacity: unit.alive ? 1 : 0.4 }}>
                  <div style={{
                    fontSize: '0.5rem', fontWeight: 700,
                    color: unit.id === currentUnitId ? 'var(--danger)' : '#fca5a5',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 1, textAlign: 'right',
                  }}>{unit.name}</div>
                  <MiniBar current={unit.health} max={unit.maxHealth} color={hpColor} height={5} width={128} />
                  <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                    <MiniBar current={unit.mana} max={unit.maxMana} color="#3b82f6" height={3} width={62} />
                    <MiniBar current={unit.stamina} max={unit.maxStamina} color="#f59e0b" height={3} width={62} />
                  </div>
                  {unit.isBoss && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                      <MiniBar current={unit.grudge || 0} max={100} color="#dc2626" height={3} width={128} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
