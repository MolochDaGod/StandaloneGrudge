import React, { useEffect } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { locations } from '../data/enemies';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';

import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { setBgm } from '../utils/audioManager';

export default function WorldMap() {
  const { level, xp, xpToNext, gold, playerName, playerClass, playerRace, playerHealth, playerMaxHealth,
    playerMana, playerMaxMana, setScreen, enterLocation, getUnlockedLocations, restAtInn,
    victories, unspentPoints, skillPoints, heroRoster, activeHeroIds, maxHeroSlots,
    setActiveHeroes, locationsCleared } = useGameStore();
  const raceDef = playerRace ? raceDefinitions[playerRace] : null;

  const unlockedLocs = getUnlockedLocations();
  const cls = classDefinitions[playerClass];

  const canCreateNewHero = heroRoster.length < maxHeroSlots;

  useEffect(() => {
    setBgm('ambient');
  }, []);

  const toggleHeroActive = (heroId) => {
    if (activeHeroIds.includes(heroId)) {
      if (activeHeroIds.length <= 1) return;
      setActiveHeroes(activeHeroIds.filter(id => id !== heroId));
    } else {
      if (activeHeroIds.length >= 3) return;
      setActiveHeroes([...activeHeroIds, heroId]);
    }
  };

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
          <SpriteAnimation spriteData={getPlayerSprite(playerClass, playerRace)} animation="idle" scale={1.2} speed={150} />
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
            {(unspentPoints > 0 || skillPoints > 0 || heroRoster.some(h => (h.unspentPoints || 0) > 0 || (h.skillPoints || 0) > 0)) && (
              <button onClick={() => setScreen('account')} style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)',
                borderRadius: 8, padding: '6px 12px', color: 'var(--danger)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, animation: 'glow 2s infinite'
              }}>
                Points Available!
              </button>
            )}
            <button onClick={() => setScreen('account')} style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
              border: '1px solid var(--gold)', borderRadius: 8,
              padding: '6px 12px', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            }}>⚔️ War Council</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {heroRoster.length > 0 && (
          <div style={{
            marginBottom: 20, padding: 16, background: 'rgba(20,26,43,0.8)',
            border: '1px solid var(--border)', borderRadius: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1rem' }}>
                War Party ({activeHeroIds.length}/3)
              </h3>
              {canCreateNewHero && (
                <button onClick={() => setScreen('heroCreate')} style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1))',
                  border: '2px solid var(--gold)', borderRadius: 8, padding: '6px 14px',
                  color: 'var(--gold)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                  animation: 'glow 2s infinite',
                }}>
                  + Recruit New Hero
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {heroRoster.map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const heroRace = hero.raceId ? raceDefinitions[hero.raceId] : null;
                const isActive = activeHeroIds.includes(hero.id);
                const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                return (
                  <div key={hero.id} onClick={() => toggleHeroActive(hero.id)} style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(110,231,183,0.05))'
                      : 'rgba(42,49,80,0.3)',
                    border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                    transition: 'all 0.2s', minWidth: 140, textAlign: 'center',
                    opacity: isActive ? 1 : 0.6,
                  }}>
                    <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={1} speed={150} />
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--muted)', marginTop: 4 }}>
                      {hero.name}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>
                      Lv.{hero.level} {heroRace?.name} {heroCls?.name}
                    </div>
                    {heroStats && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{
                          height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${(hero.currentHealth / heroStats.health) * 100}%`,
                            background: '#22c55e', borderRadius: 2,
                          }} />
                        </div>
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.55rem', marginTop: 4,
                      color: isActive ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: 600,
                    }}>
                      {isActive ? 'ACTIVE' : 'RESERVE'}
                    </div>
                  </div>
                );
              })}
              {canCreateNewHero && (
                <div onClick={() => setScreen('heroCreate')} style={{
                  background: 'rgba(255,215,0,0.05)',
                  border: '2px dashed var(--gold)',
                  borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                  transition: 'all 0.2s', minWidth: 140, textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  opacity: 0.6, minHeight: 100,
                }}>
                  <div style={{ fontSize: '1.5rem', color: 'var(--gold)' }}>+</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginTop: 4 }}>Recruit Hero</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--muted)', marginTop: 2 }}>
                    {heroRoster.length}/{maxHeroSlots} slots
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
            const isCleared = locationsCleared.includes(loc.id);
            return (
              <div key={loc.id} style={{
                background: isLocked ? 'rgba(20,26,43,0.5)' : loc.bgGradient,
                border: `2px solid ${isLocked ? 'var(--border)' : (isCleared ? 'var(--gold)' : 'rgba(110,231,183,0.3)')}`,
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
                    {isCleared && <span style={{ color: 'var(--gold)', marginLeft: 8, fontSize: '0.8rem' }}>✓</span>}
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
          <div><div style={{ color: 'var(--accent)', fontWeight: 700 }}>{heroRoster.length}/{maxHeroSlots}</div><div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Heroes</div></div>
        </div>
      </div>
    </div>
  );
}
