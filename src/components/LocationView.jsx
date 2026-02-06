import React from 'react';
import useGameStore from '../stores/gameStore';
import { locations } from '../data/enemies';

export default function LocationView() {
  const { currentLocation, startBattle, startBossBattle, returnToWorld, bossesDefeated, level } = useGameStore();
  const loc = locations.find(l => l.id === currentLocation);
  if (!loc) return null;

  const bossDefeated = loc.boss ? bossesDefeated.includes(loc.boss) : false;

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: loc.bgGradient, position: 'relative'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
      }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: 30, paddingTop: 60 }}>
        <button onClick={returnToWorld} style={{
          background: 'rgba(42,49,80,0.8)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 16px', color: 'var(--text)',
          cursor: 'pointer', marginBottom: 30, fontSize: '0.9rem'
        }}>
          ← Back to World Map
        </button>

        <div style={{
          background: 'rgba(20,26,43,0.9)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>{loc.icon}</div>
          <h1 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '2rem', marginBottom: 12 }}>
            {loc.name}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: 30, maxWidth: 500, margin: '0 auto 30px' }}>
            {loc.description}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 30, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(110,231,183,0.1)', border: '1px solid var(--accent)',
              padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', color: 'var(--accent)'
            }}>
              Level {loc.levelRange[0]} - {loc.levelRange[1]}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 350, margin: '0 auto' }}>
            <button onClick={() => startBattle(currentLocation)} style={{
              background: 'linear-gradient(135deg, var(--accent), #10b981)',
              border: 'none', borderRadius: 12, padding: '16px 30px',
              color: '#0b1020', fontWeight: 700, fontSize: '1.1rem',
              cursor: 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: 1,
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 20px rgba(110,231,183,0.4)'; }}
            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = 'none'; }}
            >
              ⚔️ Hunt Monsters
            </button>

            {loc.boss && !bossDefeated && (
              <button onClick={() => startBossBattle(loc.boss)} style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))',
                border: '2px solid var(--danger)', borderRadius: 12, padding: '16px 30px',
                color: 'var(--danger)', fontWeight: 700, fontSize: '1.1rem',
                cursor: 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: 1,
                transition: 'all 0.3s', animation: 'glow 2s infinite'
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.transform = 'none'; }}
              >
                👑 Challenge Boss
              </button>
            )}

            {loc.boss && bossDefeated && (
              <div style={{
                background: 'rgba(16,185,129,0.1)', border: '2px solid var(--success)',
                borderRadius: 12, padding: '16px 30px', color: 'var(--success)',
                fontWeight: 600, fontSize: '1rem'
              }}>
                ✅ Boss Defeated
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
