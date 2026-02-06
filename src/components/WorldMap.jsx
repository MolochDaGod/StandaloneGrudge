import React from 'react';
import useGameStore from '../stores/gameStore';
import { locations } from '../data/enemies';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';

export default function WorldMap() {
  const { level, xp, xpToNext, gold, playerName, playerClass, playerRace, playerHealth, playerMaxHealth,
    playerMana, playerMaxMana, setScreen, enterLocation, getUnlockedLocations, restAtInn,
    victories, unspentPoints, skillPoints } = useGameStore();
  const raceDef = playerRace ? raceDefinitions[playerRace] : null;

  const unlockedLocs = getUnlockedLocations();
  const cls = classDefinitions[playerClass];

  const HealthBar = ({ current, max, color, label }) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 2 }}>
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${(current/max)*100}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'radial-gradient(circle at 30% 20%, rgba(110,231,183,0.04), transparent 50%), rgba(11,16,32,0.75)',
    }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.9), rgba(20,26,43,0.7))',
        borderBottom: '2px solid var(--border)', padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SpriteAnimation spriteData={getPlayerSprite(playerClass)} animation="idle" scale={1.2} speed={150} />
          <div>
            <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{playerName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Lv.{level} {raceDef ? raceDef.name + ' ' : ''}{cls?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 120 }}>
            <HealthBar current={playerHealth} max={playerMaxHealth} color="#22c55e" label="HP" />
            <HealthBar current={playerMana} max={playerMaxMana} color="#3b82f6" label="MP" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', fontWeight: 600 }}>💰 {gold}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>XP: {xp}/{xpToNext}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {unspentPoints > 0 && (
              <button onClick={() => setScreen('character')} style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)',
                borderRadius: 8, padding: '6px 12px', color: 'var(--danger)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, animation: 'glow 2s infinite'
              }}>
                Stats ({unspentPoints})
              </button>
            )}
            {skillPoints > 0 && (
              <button onClick={() => setScreen('skills')} style={{
                background: 'rgba(168,85,247,0.2)', border: '1px solid var(--purple)',
                borderRadius: 8, padding: '6px 12px', color: 'var(--purple)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, animation: 'glow 2s infinite'
              }}>
                Skills ({skillPoints})
              </button>
            )}
            <button onClick={() => setScreen('character')} style={{
              background: 'var(--border)', border: 'none', borderRadius: 8,
              padding: '6px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem'
            }}>📊 Stats</button>
            <button onClick={() => setScreen('skills')} style={{
              background: 'var(--border)', border: 'none', borderRadius: 8,
              padding: '6px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem'
            }}>🌳 Skills</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.5rem' }}>World Map</h2>
          <button onClick={restAtInn} style={{
            background: 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(110,231,183,0.05))',
            border: '1px solid var(--accent)', borderRadius: 8, padding: '8px 16px',
            color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
          }}>
            🏨 Rest at Inn ({level * 5}g)
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {locations.map((loc) => {
            const isUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel);
            const isLocked = !isUnlocked;
            return (
              <div key={loc.id} style={{
                background: isLocked ? 'rgba(20,26,43,0.5)' : loc.bgGradient,
                border: `2px solid ${isLocked ? 'var(--border)' : 'rgba(110,231,183,0.3)'}`,
                borderRadius: 14, padding: 20, cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.5 : 1, transition: 'all 0.3s', position: 'relative',
                overflow: 'hidden', minHeight: 160,
              }}
              onClick={() => !isLocked && enterLocation(loc.id)}
              onMouseEnter={e => { if (!isLocked) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.6))',
                  borderRadius: 12
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{loc.icon}</div>
                  <h3 className="font-cinzel" style={{ color: 'var(--text)', marginBottom: 6, fontSize: '1.1rem' }}>
                    {loc.name}
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 10 }}>
                    {isLocked ? `Unlocks at Level ${loc.unlockLevel}` : loc.description}
                  </p>
                  {!isLocked && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(0,0,0,0.4)', padding: '3px 8px',
                        borderRadius: 4, fontSize: '0.7rem', color: 'var(--accent)'
                      }}>
                        Lv.{loc.levelRange[0]}-{loc.levelRange[1]}
                      </span>
                      {loc.boss && (
                        <span style={{
                          background: 'rgba(239,68,68,0.3)', padding: '3px 8px',
                          borderRadius: 4, fontSize: '0.7rem', color: '#ef4444'
                        }}>
                          BOSS
                        </span>
                      )}
                    </div>
                  )}
                  {isLocked && (
                    <div style={{ fontSize: '1.5rem', position: 'absolute', top: 10, right: 10 }}>🔒</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 20, padding: 16, background: 'rgba(20,26,43,0.8)',
          border: '1px solid var(--border)', borderRadius: 10,
          display: 'flex', justifyContent: 'space-around', textAlign: 'center'
        }}>
          <div><div style={{ color: 'var(--accent)', fontWeight: 700 }}>{victories}</div><div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Victories</div></div>
          <div><div style={{ color: 'var(--gold)', fontWeight: 700 }}>{level}</div><div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Level</div></div>
          <div><div style={{ color: 'var(--gold)', fontWeight: 700 }}>{gold}</div><div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Gold</div></div>
        </div>
      </div>
    </div>
  );
}
