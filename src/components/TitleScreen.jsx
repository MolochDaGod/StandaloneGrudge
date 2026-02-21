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

function LoginButton({ label, onClick, variant = 'default', icon, delay = 0, sublabel, disabled, active }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const variants = {
    grudge: {
      bg: hovered
        ? 'linear-gradient(135deg, rgba(250,172,71,0.3), rgba(219,99,49,0.15))'
        : 'linear-gradient(135deg, rgba(250,172,71,0.15), rgba(219,99,49,0.05))',
      border: active ? '2px solid rgba(110,231,183,0.6)' : '2px solid rgba(250,172,71,0.5)',
      color: active ? '#6ee7b7' : 'var(--accent)',
      fontSize: '1.25rem',
      padding: '16px 40px',
    },
    discord: {
      bg: hovered
        ? 'rgba(88,101,242,0.2)'
        : 'rgba(88,101,242,0.08)',
      border: active ? '1px solid rgba(110,231,183,0.5)' : '1px solid rgba(88,101,242,0.4)',
      color: active ? '#6ee7b7' : '#93a4f4',
      fontSize: '1.1rem',
      padding: '14px 36px',
    },
    default: {
      bg: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#888',
      fontSize: '1rem',
      padding: '12px 36px',
    },
  };

  const v = variants[variant] || variants.default;

  return (
    <button
      disabled={disabled}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: v.bg,
        border: v.border,
        borderRadius: 8,
        padding: v.padding,
        color: v.color,
        fontSize: v.fontSize,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'LifeCraft', 'Cinzel', serif",
        letterSpacing: 3,
        transition: 'all 0.25s ease',
        width: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transform: pressed ? 'scale(0.95)' : hovered ? 'scale(1.03) translateY(-1px)' : 'scale(1)',
        boxShadow: hovered
          ? variant === 'grudge'
            ? '0 0 30px rgba(250,172,71,0.3), 0 4px 20px rgba(0,0,0,0.4)'
            : '0 0 15px rgba(255,255,255,0.05), 0 4px 15px rgba(0,0,0,0.3)'
          : 'none',
        animation: `slideUp 0.5s ease ${delay}s both`,
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {hovered && <div style={{
        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        animation: 'lobbyCardShine 0.6s ease forwards',
        pointerEvents: 'none',
      }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <div style={{ textAlign: 'left' }}>
          <div>{label}</div>
          {sublabel && (
            <div style={{ fontSize: '0.6rem', fontWeight: 400, opacity: 0.6, letterSpacing: 1, fontFamily: "'Jost', sans-serif", marginTop: 2 }}>
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

const DiscordSvg = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={Math.round(size * 0.77)} viewBox="0 0 71 55" fill={color}>
    <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
  </svg>
);

export default function TitleScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const [fadeClass, setFadeClass] = useState(false);
  const [puterUser, setPuterUser] = useState(null);
  const [puterLoading, setPuterLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  useEffect(() => {
    setBgm('intro');
    const t1 = setTimeout(() => setFadeClass(true), 200);

    if (typeof window !== 'undefined' && window.puter?.auth?.isSignedIn?.()) {
      window.puter.auth.getUser().then(u => {
        setPuterUser(u);
        setAutoChecked(true);
      }).catch(() => setAutoChecked(true));
    } else {
      setAutoChecked(true);
    }

    return () => clearTimeout(t1);
  }, []);

  const handleGrudgeLogin = async () => {
    if (!window.puter) {
      handleGuest();
      return;
    }
    setPuterLoading(true);
    try {
      if (puterUser) {
        const session = {
          type: 'puter',
          puterUsername: puterUser.username,
          username: puterUser.username,
          loginTime: Date.now(),
        };
        localStorage.setItem('grudge-session', JSON.stringify(session));
        setScreen('intro');
        return;
      }
      await window.puter.auth.signIn();
      const user = await window.puter.auth.getUser();
      setPuterUser(user);
      const session = {
        type: 'puter',
        puterUsername: user.username,
        username: user.username,
        loginTime: Date.now(),
      };
      localStorage.setItem('grudge-session', JSON.stringify(session));
      setScreen('intro');
    } catch {}
    setPuterLoading(false);
  };

  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    try {
      const res = await fetch('/api/discord/login');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {}
    setDiscordLoading(false);
  };

  const handleGuest = () => {
    const session = {
      type: 'guest',
      username: 'Adventurer',
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

      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', maxWidth: 600, padding: '0 20px', marginTop: '-6vh' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
          marginBottom: 24,
        }}>
          <LoginButton
            label={puterUser ? `ENTER AS ${puterUser.username.toUpperCase()}` : 'LOGIN WITH GRUDGE'}
            sublabel={puterUser ? 'Grudge Studio Account' : 'Sign in to save progress'}
            onClick={handleGrudgeLogin}
            variant="grudge"
            active={!!puterUser}
            disabled={puterLoading}
            icon={
              <div style={{
                width: 24, height: 24, borderRadius: 4,
                background: puterUser
                  ? 'linear-gradient(135deg, #10b981, #34d399)'
                  : 'linear-gradient(135deg, #DB6331, #FAAC47)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                fontFamily: "'Jost', sans-serif",
                overflow: 'hidden',
              }}>
                {puterUser ? '\u2713' : <img src="/sprites/ui/grudge_logo.png" alt="G" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
              </div>
            }
            delay={0.3}
          />

          <LoginButton
            label="LOGIN WITH DISCORD"
            sublabel="Sync community & leaderboards"
            onClick={handleDiscordLogin}
            variant="discord"
            disabled={discordLoading}
            icon={<DiscordSvg size={22} color="#7289da" />}
            delay={0.45}
          />

          <LoginButton
            label="PLAY AS GUEST"
            sublabel="No account needed"
            onClick={handleGuest}
            variant="default"
            icon={<EssentialIcon name="Gamepad" size={18} style={{ opacity: 0.5 }} />}
            delay={0.55}
          />
        </div>

        <div style={{
          fontSize: '0.85rem', color: 'var(--muted)', letterSpacing: 8,
          textTransform: 'uppercase', marginBottom: 12, opacity: 0.5,
          animation: 'subtitleReveal 1.8s ease 0.2s both',
        }}>
          Grudge Studio Presents
        </div>

        <h1 className="font-warcraft" style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          background: 'linear-gradient(90deg, #8B372E 0%, #DB6331 20%, #FAAC47 40%, #FFE0A0 50%, #FAAC47 60%, #DB6331 80%, #8B372E 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          WebkitTextStroke: '2px #000',
          paintOrder: 'stroke fill',
          marginBottom: 4, lineHeight: 1.1,
          animation: 'titleShimmer 6s linear infinite, scaleIn 0.8s ease 0.1s both',
          filter: 'drop-shadow(0 0 20px rgba(250,172,71,0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.8)) drop-shadow(1px 1px 0 rgba(0,0,0,1)) drop-shadow(-1px -1px 0 rgba(0,0,0,1))',
        }}>
          GRUDGE<br/>WARLORDS
        </h1>

        <div className="font-cinzel" style={{
          fontSize: 'clamp(0.7rem, 1.5vw, 0.95rem)',
          color: 'rgba(250,172,71,0.7)',
          letterSpacing: 6, textTransform: 'uppercase', marginBottom: 0, marginTop: 4,
          animation: 'fadeIn 1s ease 0.5s both',
          fontWeight: 600,
        }}>
          Warlord Crafting Suite
        </div>

        <div style={{
          color: 'var(--muted)', fontSize: '0.85rem', marginTop: 20, opacity: 0.35,
          letterSpacing: 1,
          animation: 'fadeIn 1s ease 0.8s both',
        }}>
          6 Races &bull; 4 Classes &bull; 24 Warlords
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
