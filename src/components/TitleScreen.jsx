import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { setBgm } from '../utils/audioManager';
import { EssentialIcon } from '../data/uiSprites';

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
      pointerEvents: 'none', zIndex: 2,
    }} />
  );
}

function MenuButton({ label, onClick, primary, icon, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const baseStyle = {
    position: 'relative',
    overflow: 'hidden',
    background: primary
      ? hovered
        ? 'linear-gradient(135deg, rgba(250,172,71,0.3), rgba(219,99,49,0.15))'
        : 'linear-gradient(135deg, rgba(250,172,71,0.15), rgba(219,99,49,0.05))'
      : hovered
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.03)',
    border: primary
      ? '2px solid rgba(250,172,71,0.5)'
      : '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: primary ? '18px 60px' : '14px 50px',
    color: primary ? 'var(--accent)' : '#ccc',
    fontSize: primary ? '1.4rem' : '1.2rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'LifeCraft', 'Cinzel', serif",
    letterSpacing: primary ? 4 : 3,
    transition: 'all 0.25s ease',
    width: 340,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: pressed ? 'scale(0.95)' : hovered ? 'scale(1.04) translateY(-1px)' : 'scale(1)',
    boxShadow: hovered && primary
      ? '0 0 30px rgba(250,172,71,0.35), 0 0 60px rgba(219,99,49,0.15), 0 4px 20px rgba(0,0,0,0.4)'
      : hovered
        ? '0 0 20px rgba(255,255,255,0.1), 0 4px 15px rgba(0,0,0,0.3)'
        : primary
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : 'none',
    animation: primary
      ? `slideUp 0.5s ease ${delay}s both, ${hovered ? '' : 'borderGlow 3s ease-in-out infinite 2s'}`
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
      {hovered && <div style={{
        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
        animation: 'lobbyCardShine 0.6s ease forwards',
        pointerEvents: 'none',
      }} />}
      {icon}{label}
    </button>
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
      background: 'transparent',
      opacity: fadeClass ? 1 : 0,
      transition: 'opacity 1.5s ease',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/images/title-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center 30%, transparent 40%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.6) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      <TitleParticles />

      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', maxWidth: 600, padding: '0 20px' }}>
        <div style={{
          fontSize: '0.9rem', color: 'var(--muted)', letterSpacing: 8,
          textTransform: 'uppercase', marginBottom: 24, opacity: 0.5,
          animation: 'subtitleReveal 1.8s ease 0.2s both',
        }}>
          Grudge Studio Presents
        </div>

        <h1 className="font-cinzel" style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          background: 'linear-gradient(90deg, #8B372E 0%, #DB6331 20%, #FAAC47 40%, #FFE0A0 50%, #FAAC47 60%, #DB6331 80%, #8B372E 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          WebkitTextStroke: '2px #000',
          paintOrder: 'stroke fill',
          marginBottom: 8, lineHeight: 1.1,
          animation: 'titleShimmer 6s linear infinite, scaleIn 0.8s ease 0.1s both',
          filter: 'drop-shadow(0 0 20px rgba(250,172,71,0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.8)) drop-shadow(1px 1px 0 rgba(0,0,0,1)) drop-shadow(-1px -1px 0 rgba(0,0,0,1))',
        }}>
          GRUDGE<br/>WARLORDS
        </h1>

        <div style={{
          fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: 3,
          textTransform: 'uppercase', marginBottom: 50,
          animation: 'subtitleReveal 1.2s ease 0.6s both, taglinePulse 4s ease-in-out 2s infinite',
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
          color: 'var(--muted)', fontSize: '0.9rem', marginTop: 40, opacity: 0.4,
          letterSpacing: 1,
          animation: 'fadeIn 1s ease 0.8s both',
        }}>
          Turn-Based RPG &bull; 6 Races &bull; 4 Classes &bull; 24 Warlords
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 8, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        color: 'var(--muted)', fontSize: '0.8rem', opacity: 0.3,
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
        <span>&copy; 2026 Grudge Studio</span>
      </div>
    </div>
  );
}
