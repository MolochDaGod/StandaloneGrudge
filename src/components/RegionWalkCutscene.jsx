import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { REGIONS, markRegionWalkSeen, getRegionForZone } from '../data/regionWalkData';
import { getPlayerSprite } from '../data/spriteMap';
import useGameStore from '../stores/gameStore';

const PHASE_TIMINGS = {
  fadeIn: 1000,
  walkIn: 2200,
  pause: 1800,
  walkOut: 3200,
  fadeOut: 800,
};

function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function HeroWalker({ sprite, index, phase, region, containerSize, totalHeroes }) {
  const heroSize = 80;
  const spacing = 45;

  const offsetX = index * spacing;
  const offsetY = index * 12;

  const walkFrames = sprite?.walk?.frames || sprite?.run?.frames || 6;
  const walkSrc = sprite?.walk?.src || sprite?.run?.src || sprite?.idle?.src;
  const idleFrames = sprite?.idle?.frames || 6;
  const idleSrc = sprite?.idle?.src;
  const fw = sprite?.frameWidth || 128;
  const fh = sprite?.frameHeight || 128;
  const facesLeft = sprite?.facesLeft || false;

  const entryX = region.entryFrom.x;
  const entryY = region.entryFrom.y;
  const pauseX = region.pauseAt.x + (offsetX / containerSize.w * 100);
  const pauseY = region.pauseAt.y + (offsetY / containerSize.h * 100);
  const destX = region.walkTo.x + (offsetX * 0.3 / containerSize.w * 100);
  const destY = region.walkTo.y + (offsetY * 0.3 / containerSize.h * 100);

  const [pos, setPos] = useState({ x: entryX, y: entryY });
  const [scale, setScale] = useState(region.pauseScale);
  const [isWalking, setIsWalking] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const animRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (phase === 'walkIn') {
      setIsWalking(true);
      startRef.current = performance.now();
      const dur = PHASE_TIMINGS.walkIn;
      const animate = (now) => {
        const t = Math.min(1, (now - startRef.current) / dur);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setPos({
          x: lerp(entryX, pauseX, eased),
          y: lerp(entryY, pauseY, eased),
        });
        if (t < 1) animRef.current = requestAnimationFrame(animate);
        else setIsWalking(false);
      };
      animRef.current = requestAnimationFrame(animate);
    } else if (phase === 'pause') {
      setPos({ x: pauseX, y: pauseY });
      setIsWalking(false);
    } else if (phase === 'walkOut') {
      setIsWalking(true);
      startRef.current = performance.now();
      const dur = PHASE_TIMINGS.walkOut;
      const animate = (now) => {
        const t = Math.min(1, (now - startRef.current) / dur);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setPos({
          x: lerp(pauseX, destX, eased),
          y: lerp(pauseY, destY, eased),
        });
        setScale(lerp(region.pauseScale, region.endScale, eased));
        if (t < 1) animRef.current = requestAnimationFrame(animate);
        else setIsWalking(false);
      };
      animRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase]);

  useEffect(() => {
    if (!isWalking && phase !== 'walkIn' && phase !== 'walkOut') return;
    const interval = setInterval(() => {
      setFrameIdx(f => (f + 1) % (isWalking ? walkFrames : idleFrames));
    }, 120);
    return () => clearInterval(interval);
  }, [isWalking, walkFrames, idleFrames, phase]);

  useEffect(() => {
    if (phase === 'pause') {
      const interval = setInterval(() => {
        setFrameIdx(f => (f + 1) % idleFrames);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [phase, idleFrames]);

  const currentSrc = isWalking ? walkSrc : idleSrc;
  const currentFrames = isWalking ? walkFrames : idleFrames;
  const displayH = heroSize * scale;
  const ratio = fw / fh;
  const displayW = displayH * ratio;

  const needsFlip = phase === 'walkIn' ? (entryX > pauseX ? !facesLeft : facesLeft) : false;
  const walkOutFlip = phase === 'walkOut' || phase === 'pause' ? facesLeft : false;
  const shouldFlip = needsFlip || walkOutFlip;

  return (
    <div style={{
      position: 'absolute',
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      transform: `translate(-50%, -100%) ${shouldFlip ? 'scaleX(-1)' : ''}`,
      transition: phase === 'fadeOut' ? 'opacity 0.8s ease' : 'none',
      opacity: phase === 'fadeOut' ? 0 : 1,
      zIndex: 100 + index,
      filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.7))`,
      pointerEvents: 'none',
    }}>
      <div style={{
        width: displayW,
        height: displayH,
        overflow: 'hidden',
        backgroundImage: `url(${currentSrc})`,
        backgroundSize: `${currentFrames * displayW}px ${displayH}px`,
        backgroundPosition: `-${frameIdx * displayW}px 0`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }} />
    </div>
  );
}

export default function RegionWalkCutscene({ zoneId, onComplete }) {
  const regionId = getRegionForZone(zoneId);
  const region = regionId ? REGIONS[regionId] : null;
  const heroRoster = useGameStore(s => s.heroRoster);
  const activeHeroIds = useGameStore(s => s.activeHeroIds);
  const [phase, setPhase] = useState('init');
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 1280, h: 720 });
  const skipRef = useRef(false);

  const activeHeroes = useMemo(() => {
    const active = heroRoster.filter(h => activeHeroIds.includes(h.id)).slice(0, 3);
    if (active.length === 0 && heroRoster.length > 0) return heroRoster.slice(0, 3);
    return active;
  }, [heroRoster, activeHeroIds]);

  const heroSprites = useMemo(() => {
    return activeHeroes.map(h => getPlayerSprite(h.classId, h.raceId, h.namedHeroId));
  }, [activeHeroes]);

  useEffect(() => {
    if (!region) { onComplete(); return; }
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [region, onComplete]);

  useEffect(() => {
    if (!region || skipRef.current) return;
    const timers = [];

    timers.push(setTimeout(() => setFadeIn(true), 50));

    timers.push(setTimeout(() => {
      setTitleVisible(true);
    }, 600));

    timers.push(setTimeout(() => {
      if (!skipRef.current) setPhase('walkIn');
    }, PHASE_TIMINGS.fadeIn));

    timers.push(setTimeout(() => {
      if (!skipRef.current) setPhase('pause');
    }, PHASE_TIMINGS.fadeIn + PHASE_TIMINGS.walkIn));

    timers.push(setTimeout(() => {
      if (!skipRef.current) setPhase('walkOut');
    }, PHASE_TIMINGS.fadeIn + PHASE_TIMINGS.walkIn + PHASE_TIMINGS.pause));

    timers.push(setTimeout(() => {
      if (!skipRef.current) {
        setFadeOut(true);
        setPhase('fadeOut');
      }
    }, PHASE_TIMINGS.fadeIn + PHASE_TIMINGS.walkIn + PHASE_TIMINGS.pause + PHASE_TIMINGS.walkOut));

    timers.push(setTimeout(() => {
      if (!skipRef.current) {
        markRegionWalkSeen(regionId);
        onComplete();
      }
    }, PHASE_TIMINGS.fadeIn + PHASE_TIMINGS.walkIn + PHASE_TIMINGS.pause + PHASE_TIMINGS.walkOut + PHASE_TIMINGS.fadeOut));

    return () => timers.forEach(clearTimeout);
  }, [region, regionId, onComplete]);

  const handleSkip = useCallback(() => {
    if (skipRef.current) return;
    skipRef.current = true;
    markRegionWalkSeen(regionId);
    setFadeOut(true);
    setTimeout(() => onComplete(), 400);
  }, [regionId, onComplete]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSkip]);

  if (!region) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleSkip}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: '#000',
        cursor: 'pointer',
        opacity: fadeOut ? 0 : (fadeIn ? 1 : 0),
        transition: `opacity ${fadeOut ? '0.4s' : '0.8s'} ease`,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${region.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, rgba(0,0,0,0.5) 0%, ${region.tint} 30%, ${region.tint} 60%, rgba(0,0,0,0.6) 100%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
      }}>
        {heroSprites.map((sprite, i) => (
          <HeroWalker
            key={i}
            sprite={sprite}
            index={i}
            phase={phase}
            region={region}
            containerSize={containerSize}
            totalHeroes={heroSprites.length}
          />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        top: '6%', left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        opacity: titleVisible ? 1 : 0,
        transition: 'opacity 1.5s ease, transform 1s ease',
        pointerEvents: 'none',
        zIndex: 200,
      }}>
        <h1 className="font-warcraft" style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          letterSpacing: 6,
          lineHeight: 1.1,
          margin: 0,
          background: 'linear-gradient(90deg, #8B372E 0%, #DB6331 20%, #FAAC47 40%, #FFE0A0 50%, #FAAC47 60%, #DB6331 80%, #8B372E 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          WebkitTextStroke: '2px #000',
          paintOrder: 'stroke fill',
          animation: 'titleShimmer 6s linear infinite',
          filter: 'drop-shadow(0 0 20px rgba(250,172,71,0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
        }}>
          {region.title}
        </h1>
        <p style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
          color: 'rgba(200,180,140,0.8)',
          letterSpacing: 4,
          textTransform: 'uppercase',
          margin: '8px 0 0',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          {region.subtitle}
        </p>
      </div>

      <p style={{
        position: 'absolute',
        bottom: 20, left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'Jost', sans-serif",
        fontSize: '0.75rem',
        color: 'rgba(200,180,140,0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        zIndex: 200,
        pointerEvents: 'none',
      }}>
        Click or press Space to skip
      </p>
    </div>
  );
}
