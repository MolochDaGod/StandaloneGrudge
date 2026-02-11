import React, { useState, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import { setBgm } from '../utils/audioManager';
import { EssentialIcon } from '../data/uiSprites';

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
        opacity: fadeClass ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }}>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 600, padding: '0 20px' }}>
          <div style={{
            fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: 8,
            textTransform: 'uppercase', marginBottom: 24, opacity: 0.5,
          }}>
            Grudge Studio Presents
          </div>

          <h1 className="font-cinzel" style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            background: 'linear-gradient(135deg, #6ee7b7, #ffd700, #ef4444)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: 'none', marginBottom: 8, lineHeight: 1.1,
          }}>
            GRUDGE<br/>WARLORDS
          </h1>

          <div style={{
            fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: 3,
            textTransform: 'uppercase', marginBottom: 50, opacity: 0.8,
          }}>
            The Void King Awaits
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <MenuButton
              label="PLAY AS GUEST"
              onClick={() => handleLogin('guest')}
              primary
              icon={<EssentialIcon name="Gamepad" size={20} style={{ marginRight: 8 }} />}
            />

            <MenuButton
              label="CONNECT DISCORD"
              onClick={() => handleLogin('discord')}
              icon={
                <svg width="20" height="16" viewBox="0 0 71 55" fill="currentColor" style={{ marginRight: 8 }}>
                  <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
                </svg>
              }
            />

            <MenuButton
              label="GRUDGE STUDIO"
              onClick={() => window.open('https://grudgestudio.com', '_blank')}
              subtle
              icon={<EssentialIcon name="Home" size={16} style={{ marginRight: 8 }} />}
            />
          </div>

          <div style={{
            color: 'var(--muted)', fontSize: '0.7rem', marginTop: 40, opacity: 0.4,
            letterSpacing: 1,
          }}>
            Turn-Based RPG &bull; 6 Races &bull; 4 Classes &bull; 24 Warlords
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center',
          color: 'var(--muted)', fontSize: '0.65rem', opacity: 0.3,
        }}>
          &copy; 2026 Grudge Studio &bull; Inspired by Final Fantasy VII
        </div>
      </div>
    );
}

function MenuButton({ label, onClick, primary, subtle, icon }) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    background: primary
      ? hovered
        ? 'rgba(110,231,183,0.25)'
        : 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(110,231,183,0.05))'
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
    transition: 'all 0.3s',
    width: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: hovered && primary ? '0 0 30px rgba(110,231,183,0.3)' : 'none',
  };

  return (
    <button
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}{label}
    </button>
  );
}
