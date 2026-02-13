import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useGameStore from '../stores/gameStore';
import { setBgm } from '../utils/audioManager';
import { EssentialIcon } from '../data/uiSprites';
import SpriteAnimation from './SpriteAnimation';
import { getRaceClassSprite, namedHeroes } from '../data/spriteMap';
import { raceDefinitions } from '../data/races';
import { classDefinitions } from '../data/classes';

const RACES = Object.keys(raceDefinitions);
const CLASSES = Object.keys(classDefinitions);
const ALL_COMBOS = RACES.flatMap(r => CLASSES.map(c => ({ race: r, cls: c })));

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const HERO_ACTIONS = [
  { anim: 'walk', duration: 0, moving: true },
  { anim: 'idle', duration: 2500, moving: false },
  { anim: 'attack1', duration: 1200, moving: false },
  { anim: 'attack2', duration: 1200, moving: false },
  { anim: 'attack3', duration: 1400, moving: false },
  { anim: 'cast', duration: 1200, moving: false },
  { anim: 'block', duration: 800, moving: false },
];

function TitleHeroParade() {
  const [heroes, setHeroes] = useState([]);
  const heroIdCounter = useRef(0);
  const containerRef = useRef(null);

  const spawnHero = useCallback(() => {
    const namedHeroKeys = Object.keys(namedHeroes);
    const useNamed = Math.random() < 0.2 && namedHeroKeys.length > 0;

    let combo, sprite, displayName, heroColor;

    if (useNamed) {
      const nhKey = namedHeroKeys[Math.floor(Math.random() * namedHeroKeys.length)];
      const nh = namedHeroes[nhKey];
      combo = { race: nh.race, cls: nh.class };
      sprite = nh.sprite;
      displayName = nh.fullName;
      heroColor = nh.color || raceDefinitions[nh.race]?.color || '#fff';
    } else {
      combo = ALL_COMBOS[Math.floor(Math.random() * ALL_COMBOS.length)];
      sprite = getRaceClassSprite(combo.race, combo.cls);
      displayName = null;
      heroColor = null;
    }
    if (!sprite) return null;

    const fromLeft = Math.random() > 0.5;
    const yPos = 20 + Math.random() * 55;
    const baseSpeed = 0.3 + Math.random() * 0.5;
    const depthScale = 0.8 + (yPos / 75) * 0.6;
    const baseFrameW = sprite.frameWidth || 100;
    const sizeNorm = baseFrameW > 150 ? 0.55 : baseFrameW > 100 ? 0.75 : 1;
    const heroScale = Math.min((sprite.scale || 1) * depthScale * 2.0 * sizeNorm, 3.5);
    const id = heroIdCounter.current++;

    return {
      id,
      race: combo.race,
      cls: combo.cls,
      sprite,
      x: fromLeft ? -15 : 115,
      y: yPos,
      speed: fromLeft ? baseSpeed : -baseSpeed,
      flip: !fromLeft,
      scale: heroScale,
      currentAnim: 'walk',
      actionTimer: 3000 + Math.random() * 4000,
      opacity: 0,
      fadeIn: true,
      displayName: displayName,
      raceColor: heroColor || raceDefinitions[combo.race]?.color || '#fff',
      shadowSize: heroScale * 20,
      zIndex: Math.floor(yPos),
    };
  }, []);

  useEffect(() => {
    const initialCount = 4 + Math.floor(Math.random() * 3);
    const initial = [];
    const usedCombos = new Set();
    for (let i = 0; i < initialCount; i++) {
      let h = spawnHero();
      if (h) {
        const key = `${h.race}-${h.cls}`;
        if (usedCombos.has(key)) {
          h = spawnHero();
          if (!h) continue;
        }
        usedCombos.add(`${h.race}-${h.cls}`);
        h.x = 8 + (i / (initialCount - 1)) * 80 + (Math.random() - 0.5) * 10;
        h.opacity = 0;
        h.fadeIn = true;
        const actions = ['idle', 'walk', 'attack1'];
        h.currentAnim = actions[Math.floor(Math.random() * actions.length)];
        if (!h.sprite[h.currentAnim]) h.currentAnim = 'idle';
        initial.push(h);
      }
    }
    setHeroes(initial);
  }, [spawnHero]);

  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setHeroes(prev => {
        if (prev.length >= 8) return prev;
        const h = spawnHero();
        return h ? [...prev, h] : prev;
      });
    }, 3000 + Math.random() * 5000);

    return () => clearInterval(spawnInterval);
  }, [spawnHero]);

  useEffect(() => {
    let raf;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = now - lastTime;
      lastTime = now;

      setHeroes(prev => {
        let changed = false;
        const next = prev.map(h => {
          const updated = { ...h };

          if (updated.fadeIn) {
            updated.opacity = Math.min(1, updated.opacity + dt / 1000);
            if (updated.opacity >= 1) updated.fadeIn = false;
            changed = true;
          }

          if (updated.currentAnim === 'walk') {
            updated.x += updated.speed * (dt / 16);
            changed = true;
          }

          updated.actionTimer -= dt;
          if (updated.actionTimer <= 0) {
            if (updated.currentAnim === 'walk') {
              const actionPool = HERO_ACTIONS.filter(a => !a.moving && updated.sprite[a.anim]);
              if (actionPool.length > 0) {
                const action = actionPool[Math.floor(Math.random() * actionPool.length)];
                updated.currentAnim = action.anim;
                updated.actionTimer = action.duration + Math.random() * 600;
              } else {
                updated.actionTimer = 2000 + Math.random() * 3000;
              }
            } else {
              updated.currentAnim = 'walk';
              updated.actionTimer = 3000 + Math.random() * 5000;
            }
            changed = true;
          }

          return updated;
        }).filter(h => h.x > -20 && h.x < 120);

        if (next.length < prev.length) changed = true;
        return changed ? next : prev;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '75%',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 0,
    }}>
      {heroes.map(hero => (
        <div key={hero.id} style={{
          position: 'absolute',
          left: `${hero.x}%`,
          top: `${hero.y}%`,
          transform: 'translateX(-50%)',
          opacity: hero.opacity,
          transition: 'opacity 0.8s ease',
          zIndex: hero.zIndex,
        }}>
          <div style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: hero.shadowSize,
            height: hero.shadowSize * 0.3,
            background: `radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(2px)',
          }} />

          <div style={{
            filter: `drop-shadow(0 0 8px ${hero.raceColor}66) drop-shadow(0 0 16px ${hero.raceColor}22) drop-shadow(0 3px 6px rgba(0,0,0,0.7))`,
          }}>
            <SpriteAnimation
              spriteData={hero.sprite}
              animation={hero.currentAnim}
              scale={hero.scale}
              flip={hero.flip}
              loop={true}
              speed={hero.currentAnim === 'walk' ? 100 : 120}
            />
          </div>

          <div style={{
            position: 'absolute',
            bottom: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.5rem',
            color: hero.raceColor,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            whiteSpace: 'nowrap',
            opacity: 0.7,
            textShadow: `0 1px 4px rgba(0,0,0,0.9), 0 0 8px ${hero.raceColor}33`,
          }}>
            {hero.displayName || `${raceDefinitions[hero.race]?.name} ${classDefinitions[hero.cls]?.name}`}
          </div>
        </div>
      ))}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

function TitleParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '250,172,71' : '219,99,49',
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += (Math.random() - 0.5) * 0.01;
        p.opacity = Math.max(0.05, Math.min(0.5, p.opacity));
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.15})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

export default function TitleScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const [fadeClass, setFadeClass] = useState(false);

  useEffect(() => {
    setBgm('intro');
    const t1 = setTimeout(() => setFadeClass(true), 200);
    return () => clearTimeout(t1);
  }, []);

  const handleLogin = (method) => {
    const session = {
      type: method,
      username: method === 'guest' ? 'Adventurer' : null,
      loginTime: Date.now(),
    };
    localStorage.setItem('grudge-session', JSON.stringify(session));
    setScreen('intro');
  };

  return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '2% 3% 3% 3%',
        opacity: fadeClass ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }}>
        <TitleHeroParade />
        <TitleParticles />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 600, padding: '0 20px' }}>
          <div style={{
            fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: 8,
            textTransform: 'uppercase', marginBottom: 24, opacity: 0.5,
            animation: 'fadeIn 1.5s ease both',
          }}>
            Grudge Studio Presents
          </div>

          <h1 className="font-cinzel" style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            background: 'linear-gradient(135deg, #FAAC47, #DB6331, #8B372E)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8, lineHeight: 1.1,
            animation: 'titleGlow 4s ease-in-out infinite, scaleIn 0.8s ease 0.1s both',
          }}>
            GRUDGE<br/>WARLORDS
          </h1>

          <div style={{
            fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: 3,
            textTransform: 'uppercase', marginBottom: 50, opacity: 0.8,
            animation: 'fadeIn 1s ease 0.2s both',
          }}>
            The Void King Awaits
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <MenuButton
              label="PLAY AS GUEST"
              onClick={() => handleLogin('guest')}
              primary
              icon={<EssentialIcon name="Gamepad" size={20} style={{ marginRight: 8 }} />}
              delay={0.3}
            />

            <MenuButton
              label="CONNECT DISCORD"
              onClick={() => handleLogin('discord')}
              icon={
                <svg width="20" height="16" viewBox="0 0 71 55" fill="currentColor" style={{ marginRight: 8 }}>
                  <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
                </svg>
              }
              delay={0.45}
            />

          </div>

          <div style={{
            color: 'var(--muted)', fontSize: '0.7rem', marginTop: 40, opacity: 0.4,
            letterSpacing: 1,
            animation: 'fadeIn 1s ease 0.8s both',
          }}>
            Turn-Based RPG &bull; 6 Races &bull; 4 Classes &bull; 24 Warlords
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 8, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          color: 'var(--muted)', fontSize: '0.65rem', opacity: 0.3,
          animation: 'fadeIn 1s ease 0.6s both',
          zIndex: 3,
        }}>
          <span
            onClick={() => window.open('https://grudgestudio.com', '_blank')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = ''}
          >
            <EssentialIcon name="Home" size={12} />
            GRUDGE STUDIO
          </span>
          <span>&bull;</span>
          <span>&copy; 2026 Grudge Studio &bull; Inspired by Final Fantasy VII</span>
        </div>
      </div>
    );
}

function MenuButton({ label, onClick, primary, subtle, icon, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const baseStyle = {
    background: primary
      ? hovered
        ? 'rgba(250,172,71,0.25)'
        : 'linear-gradient(135deg, rgba(250,172,71,0.15), rgba(219,99,49,0.05))'
      : subtle
        ? 'transparent'
        : hovered
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.03)',
    border: primary
      ? '2px solid var(--accent)'
      : subtle
        ? '1px solid rgba(255,255,255,0.1)'
        : '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: primary ? '14px 50px' : '10px 40px',
    color: primary ? 'var(--accent)' : subtle ? 'var(--muted)' : '#ccc',
    fontSize: primary ? '1rem' : '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    letterSpacing: primary ? 3 : 2,
    transition: 'all 0.2s ease',
    width: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: pressed ? 'scale(0.95)' : hovered ? 'scale(1.03)' : 'scale(1)',
    boxShadow: hovered && primary
      ? '0 0 30px rgba(250,172,71,0.3), 0 0 60px rgba(219,99,49,0.1)'
      : hovered && !subtle
        ? '0 0 15px rgba(255,255,255,0.1)'
        : 'none',
    animation: primary
      ? `slideUp 0.5s ease ${delay}s both, ${hovered ? '' : 'glowPulse 3s ease-in-out infinite 2s'}`
      : `slideUp 0.5s ease ${delay}s both`,
  };

  return (
    <button
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {icon}{label}
    </button>
  );
}
