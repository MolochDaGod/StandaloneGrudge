import React, { useState, useEffect } from 'react';
import useGameStore from '../stores/gameStore';

export default function TitleScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowMenu(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{
          fontSize: '1rem', color: 'var(--muted)', letterSpacing: 6,
          textTransform: 'uppercase', marginBottom: 10, opacity: 0.7,
          animation: 'fadeIn 1.5s ease'
        }}>
          A Dark Fantasy RPG
        </div>

        <h1 className="font-cinzel" style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          background: 'linear-gradient(135deg, #6ee7b7, #ffd700, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textShadow: 'none', marginBottom: 8,
          animation: 'fadeIn 1s ease', lineHeight: 1.1
        }}>
          GRUDGE<br/>WARLORDS
        </h1>

        <div style={{
          fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: 3,
          textTransform: 'uppercase', marginBottom: 60, opacity: 0.8,
          animation: 'fadeIn 2s ease'
        }}>
          The Void King Awaits
        </div>

        {showMenu && (
          <div style={{ animation: 'slideUp 0.5s ease', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <button onClick={() => setScreen('create')} style={{
              background: 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(110,231,183,0.05))',
              border: '2px solid var(--accent)', borderRadius: 12, padding: '16px 60px',
              color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: 2,
              transition: 'all 0.3s', width: 280,
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(110,231,183,0.2)'; e.target.style.boxShadow = '0 0 30px rgba(110,231,183,0.3)'; }}
            onMouseLeave={e => { e.target.style.background = 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(110,231,183,0.05))'; e.target.style.boxShadow = 'none'; }}
            >
              NEW GAME
            </button>

            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 20, opacity: 0.5 }}>
              Turn-Based RPG | 6 Races | 4 Classes | 24 Warlords
            </div>
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center',
        color: 'var(--muted)', fontSize: '0.7rem', opacity: 0.4
      }}>
        Inspired by Final Fantasy VII
      </div>
    </div>
  );
}
