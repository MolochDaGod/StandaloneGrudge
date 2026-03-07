import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { setBgm, getMusicMuted, setMusicMuted } from '../utils/audioManager';
import { EssentialIcon } from '../data/uiSprites';
import { pullSave } from '../services/cloudSync';

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
  const [muted, setMuted] = useState(() => getMusicMuted());
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [cloudRestore, setCloudRestore] = useState(null); // { data, source }

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMusicMuted(next);
  };

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

  // Shared helper: authenticate with Puter → store session → try cloud pull
  const completePuterAuth = async (user) => {
    let grudgeId = null;
    try {
      const r = await fetch('/api/auth/puter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puterUsername: user.username, puterUuid: user.uuid || null }),
      });
      const data = await r.json();
      if (data.sessionToken) localStorage.setItem('grudge_session_token', data.sessionToken);
      grudgeId = data.user?.grudgeId || null;
    } catch {}
    const session = {
      type: 'puter', puterUsername: user.username, username: user.username,
      grudgeId, loginTime: Date.now(),
    };
    localStorage.setItem('grudge-session', JSON.stringify(session));

    // Attempt cloud pull
    try {
      const pull = await pullSave();
      if (pull.success && pull.data && pull.data.gameState) {
        // Cloud save exists — check if local save also exists
        const localSave = localStorage.getItem('grudge-warlords-storage');
        if (localSave) {
          // Both exist — offer choice
          setCloudRestore({ data: pull.data.gameState, source: pull.source });
          return; // don't navigate yet
        } else {
          // No local save — auto-restore from cloud
          localStorage.setItem('grudge-warlords-storage', JSON.stringify({ state: pull.data.gameState, version: 4 }));
        }
      }
    } catch {}
    setScreen('intro');
  };

  const handleRestoreCloud = () => {
    if (cloudRestore?.data) {
      localStorage.setItem('grudge-warlords-storage', JSON.stringify({ state: cloudRestore.data, version: 4 }));
      window.location.reload(); // reload to hydrate zustand from restored data
    }
  };

  const handleKeepLocal = () => {
    setCloudRestore(null);
    setScreen('intro');
  };

  const handleGrudgeLogin = async () => {
    if (!window.puter) {
      setShowLoginForm(true);
      return;
    }
    setPuterLoading(true);
    try {
      if (puterUser) {
        await completePuterAuth(puterUser);
        setPuterLoading(false);
        return;
      }
      await window.puter.auth.signIn();
      const user = await window.puter.auth.getUser();
      setPuterUser(user);
      await completePuterAuth(user);
    } catch {}
    setPuterLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!formUsername || !formPassword) { setFormError('Enter username and password'); return; }
    setFormLoading(true); setFormError('');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: formUsername, password: formPassword }) });
      const data = await r.json();
      if (!r.ok) { setFormError(data.error || 'Failed'); setFormLoading(false); return; }
      if (data.sessionToken) localStorage.setItem('grudge_session_token', data.sessionToken);
      const session = { type: 'grudge', username: data.user?.username || formUsername, accountId: data.user?.id, grudgeId: data.user?.grudgeId || null, loginTime: Date.now() };
      localStorage.setItem('grudge-session', JSON.stringify(session));
      setScreen('intro');
    } catch { setFormError('Server unreachable'); }
    setFormLoading(false);
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

      <button
        onClick={toggleMute}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, padding: '8px 12px',
          color: muted ? '#ef4444' : '#6ee7b7',
          cursor: 'pointer',
          fontFamily: "'LifeCraft', 'Cinzel', serif",
          fontSize: '0.85rem', letterSpacing: 2,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s ease',
          animation: 'fadeIn 1s ease 0.6s both',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
      >
        <span style={{ fontSize: '1.1rem' }}>{muted ? '🔇' : '🔊'}</span>
        <span>{muted ? 'MUTED' : 'SOUND'}</span>
      </button>

      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', maxWidth: 600, padding: '0 20px', marginTop: '-6vh' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
          marginBottom: 24,
        }}>
          {!showLoginForm ? (
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
          ) : (
            <form onSubmit={handleFormSubmit} style={{
              width: 360, display: 'flex', flexDirection: 'column', gap: 8,
              background: 'rgba(250,172,71,0.08)', border: '2px solid rgba(250,172,71,0.3)',
              borderRadius: 8, padding: '16px 20px',
              animation: 'slideUp 0.3s ease both',
            }}>
              <div style={{ fontFamily: "'LifeCraft', 'Cinzel', serif", fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: 2, textAlign: 'center', marginBottom: 4 }}>
                {isRegister ? 'CREATE GRUDGE ID' : 'GRUDGE LOGIN'}
              </div>
              <input
                type="text" placeholder="Username" value={formUsername}
                onChange={e => setFormUsername(e.target.value)} autoComplete="username"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#e8dcc8', fontSize: '0.95rem', fontFamily: "'Jost', sans-serif", outline: 'none' }}
              />
              <input
                type="password" placeholder="Password" value={formPassword}
                onChange={e => setFormPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#e8dcc8', fontSize: '0.95rem', fontFamily: "'Jost', sans-serif", outline: 'none' }}
              />
              {formError && <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>{formError}</div>}
              <button type="submit" disabled={formLoading} style={{
                padding: '10px', background: 'linear-gradient(135deg, #DB6331, #FAAC47)', border: 'none',
                borderRadius: 6, color: '#0a0a12', fontWeight: 700, fontSize: '0.95rem',
                fontFamily: "'LifeCraft', 'Cinzel', serif", letterSpacing: 2, cursor: formLoading ? 'wait' : 'pointer',
                opacity: formLoading ? 0.6 : 1,
              }}>
                {formLoading ? 'CONNECTING...' : isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => { setIsRegister(!isRegister); setFormError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", opacity: 0.8 }}>
                  {isRegister ? 'Already have an account? Sign in' : 'New? Create account'}
                </button>
                <button type="button" onClick={() => setShowLoginForm(false)}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}>
                  Back
                </button>
              </div>
            </form>
          )}

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

      {cloudRestore && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(15,15,25,0.95)', border: '2px solid rgba(250,172,71,0.4)',
            borderRadius: 12, padding: '28px 32px', maxWidth: 420, width: '90%',
            textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(147,197,253,0.2), rgba(59,130,246,0.2))',
              border: '2px solid rgba(147,197,253,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem',
            }}>
              ☁
            </div>
            <h3 className="font-cinzel" style={{ color: '#FAAC47', fontSize: '1.1rem', marginBottom: 8 }}>
              Cloud Save Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 20 }}>
              You have save data in the cloud from <span style={{ color: '#93c5fd' }}>{cloudRestore.source || 'Puter KV'}</span>.
              Would you like to restore it or keep your current local save?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleRestoreCloud} style={{
                background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                border: 'none', borderRadius: 8, color: '#fff', padding: '10px 24px',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                fontFamily: "'Cinzel', serif", letterSpacing: 1,
              }}>
                Restore Cloud Save
              </button>
              <button onClick={handleKeepLocal} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, color: '#94a3b8', padding: '10px 24px',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                fontFamily: "'Cinzel', serif", letterSpacing: 1,
              }}>
                Keep Local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
