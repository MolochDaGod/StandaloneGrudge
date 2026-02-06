import React, { useEffect, useState } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';

function HPBar({ current, max, color, height = 12, label }) {
  const pct = Math.max(0, (current / max) * 100);
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 2 }}>
          <span>{label}</span><span>{Math.floor(current)}/{Math.floor(max)}</span>
        </div>
      )}
      <div style={{ height, background: 'rgba(0,0,0,0.5)', borderRadius: height/2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: height/2, transition: 'width 0.5s ease', position: 'relative'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)',
            borderRadius: `${height/2}px ${height/2}px 0 0`
          }} />
        </div>
      </div>
    </div>
  );
}

export default function BattleScreen() {
  const {
    battleState, battleLog, playerHealth, playerMaxHealth, playerMana, playerMaxMana,
    playerStamina, playerMaxStamina, playerClass, level, playerName, cooldowns,
    useAbility, returnToWorld, floatingTexts, playerBuffs, startBattle, currentLocation
  } = useGameStore();

  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [displayFloats, setDisplayFloats] = useState([]);

  const cls = classDefinitions[playerClass];
  const enemy = battleState?.enemy;
  const phase = battleState?.phase;

  useEffect(() => {
    if (floatingTexts.length > 0) {
      setDisplayFloats(floatingTexts.map((f, i) => ({ ...f, id: Date.now() + i })));
      const isPlayerHit = floatingTexts.some(f => f.x < 40);
      const isEnemyHit = floatingTexts.some(f => f.x > 40);
      if (isPlayerHit) { setShakePlayer(true); setTimeout(() => setShakePlayer(false), 300); }
      if (isEnemyHit) { setShakeEnemy(true); setTimeout(() => setShakeEnemy(false), 300); }
      setTimeout(() => setDisplayFloats([]), 1500);
    }
  }, [floatingTexts]);

  if (!battleState || !enemy) return null;

  const isVictory = phase === 'victory';
  const isDefeat = phase === 'defeat';
  const isPlayerTurn = phase === 'player_turn';
  const isBoss = battleState.isBoss;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0a0e1a 0%, #141a2b 40%, #1a1a2e 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15,
        background: `radial-gradient(circle at 50% 60%, ${enemy.color}40, transparent 60%)`,
      }} />

      <div style={{
        flex: '0 0 auto', padding: '10px 20px', background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
            {isBoss ? '👑 BOSS BATTLE' : '⚔️ BATTLE'}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Turn {battleState.turnCount}</span>
        </div>
        {(isVictory || isDefeat) && (
          <button onClick={returnToWorld} style={{
            background: 'var(--border)', border: 'none', borderRadius: 8,
            padding: '6px 16px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem'
          }}>
            Return to World
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 30px', minHeight: 0 }}>
          <div style={{
            textAlign: 'center', animation: shakePlayer ? 'shake 0.3s ease' : 'none',
            transition: 'all 0.3s'
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: `linear-gradient(135deg, ${cls?.color}40, ${cls?.color}15)`,
              border: `3px solid ${cls?.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', margin: '0 auto 10px',
              boxShadow: isPlayerTurn ? `0 0 20px ${cls?.color}40` : 'none'
            }}>
              {cls?.icon}
            </div>
            <div className="font-cinzel" style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{playerName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Lv.{level} {cls?.name}</div>
            <div style={{ width: 160, marginTop: 8 }}>
              <HPBar current={playerHealth} max={playerMaxHealth} color="#22c55e" label="HP" />
              <div style={{ marginTop: 4 }}>
                <HPBar current={playerMana} max={playerMaxMana} color="#3b82f6" label="MP" />
              </div>
              <div style={{ marginTop: 4 }}>
                <HPBar current={playerStamina} max={playerMaxStamina} color="#f59e0b" label="SP" />
              </div>
            </div>
            {playerBuffs.length > 0 && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                {playerBuffs.map((b, i) => (
                  <span key={i} style={{
                    background: 'rgba(110,231,183,0.2)', padding: '2px 6px',
                    borderRadius: 4, fontSize: '0.65rem', color: 'var(--accent)'
                  }}>
                    {b.source} ({b.duration})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ color: 'var(--gold)', fontFamily: "'Cinzel', serif", fontSize: '1.5rem', opacity: 0.6 }}>
            VS
          </div>

          <div style={{
            textAlign: 'center', animation: shakeEnemy ? 'shake 0.3s ease' : 'none',
            transition: 'all 0.3s', opacity: enemy.health <= 0 ? 0.3 : 1
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: `linear-gradient(135deg, ${enemy.color}40, ${enemy.color}15)`,
              border: `3px solid ${enemy.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', margin: '0 auto 10px',
              boxShadow: isBoss ? `0 0 30px ${enemy.color}50` : 'none'
            }}>
              {enemy.icon}
            </div>
            <div className="font-cinzel" style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{enemy.name}</div>
            <div style={{ width: 160, marginTop: 8 }}>
              <HPBar current={enemy.health} max={enemy.maxHealth} color="#ef4444" label="HP" height={14} />
            </div>
            {enemy.buffs?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                {enemy.buffs.map((b, i) => (
                  <span key={i} style={{
                    background: 'rgba(239,68,68,0.2)', padding: '2px 6px',
                    borderRadius: 4, fontSize: '0.65rem', color: '#ef4444'
                  }}>
                    {b.source} ({b.duration})
                  </span>
                ))}
              </div>
            )}
            {enemy.dots?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                {enemy.dots.map((d, i) => (
                  <span key={i} style={{
                    background: 'rgba(239,68,68,0.2)', padding: '2px 6px',
                    borderRadius: 4, fontSize: '0.65rem', color: '#f97316'
                  }}>
                    🩸 {d.duration}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {displayFloats.map(f => (
          <div key={f.id} style={{
            position: 'absolute', left: `${f.x}%`, top: `${f.y}%`,
            color: f.color, fontWeight: 700, fontSize: '1.3rem',
            animation: 'floatUp 1.5s ease forwards', pointerEvents: 'none',
            textShadow: '0 0 10px rgba(0,0,0,0.8)', zIndex: 10
          }}>
            {f.text}
          </div>
        ))}

        {(isVictory || isDefeat) && (
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', animation: 'slideUp 0.5s ease', zIndex: 20
          }}>
            <div className="font-cinzel" style={{
              fontSize: '2.5rem',
              color: isVictory ? 'var(--gold)' : 'var(--danger)',
              textShadow: `0 0 30px ${isVictory ? 'rgba(255,215,0,0.5)' : 'rgba(239,68,68,0.5)'}`
            }}>
              {isVictory ? '🏆 VICTORY!' : '💀 DEFEAT'}
            </div>
            {isVictory && (
              <div style={{ color: 'var(--accent)', marginTop: 10, fontSize: '0.9rem' }}>
                +{enemy.xpReward} XP | +{enemy.goldReward} Gold
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
              {isVictory && currentLocation && (
                <button onClick={() => startBattle(currentLocation)} style={{
                  background: 'linear-gradient(135deg, var(--accent), #10b981)',
                  border: 'none', borderRadius: 10, padding: '12px 24px',
                  color: '#0b1020', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
                }}>
                  Fight Again
                </button>
              )}
              <button onClick={returnToWorld} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '12px 24px', color: 'var(--text)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem'
              }}>
                Return to World
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{
        flex: '0 0 120px', background: 'rgba(0,0,0,0.6)',
        borderTop: '2px solid var(--border)', padding: '8px 16px',
        overflow: 'auto', fontSize: '0.8rem'
      }}>
        {battleLog.map((msg, i) => (
          <div key={i} style={{
            color: i === battleLog.length - 1 ? 'var(--text)' : 'var(--muted)',
            padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.03)'
          }}>
            {msg}
          </div>
        ))}
      </div>

      {isPlayerTurn && !isVictory && !isDefeat && (
        <div style={{
          flex: '0 0 auto', background: 'linear-gradient(180deg, rgba(20,26,43,0.95), rgba(14,22,48,0.98))',
          borderTop: '2px solid var(--accent)', padding: '12px 16px'
        }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {cls?.abilities.map(ability => {
              const onCd = (cooldowns[ability.id] || 0) > 0;
              const noMana = ability.manaCost > playerMana;
              const noStamina = ability.staminaCost > playerStamina;
              const disabled = onCd || noMana || noStamina;
              return (
                <button key={ability.id} onClick={() => !disabled && useAbility(ability.id)}
                  title={`${ability.description}\n${ability.manaCost ? `MP: ${ability.manaCost}` : ''} ${ability.staminaCost ? `SP: ${ability.staminaCost}` : ''}`}
                  style={{
                    background: disabled ? 'rgba(42,49,80,0.3)' : 'linear-gradient(135deg, rgba(42,49,80,0.8), rgba(42,49,80,0.5))',
                    border: `2px solid ${disabled ? 'var(--border)' : 'var(--accent)'}`,
                    borderRadius: 10, padding: '10px 14px', minWidth: 120,
                    color: disabled ? 'var(--muted)' : 'var(--text)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', textAlign: 'center', opacity: disabled ? 0.5 : 1,
                    position: 'relative'
                  }}
                  onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--gold)'; }}
                  onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                >
                  <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>{ability.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{ability.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 2 }}>
                    {ability.manaCost > 0 && <span style={{ color: '#3b82f6' }}>{ability.manaCost} MP </span>}
                    {ability.staminaCost > 0 && <span style={{ color: '#f59e0b' }}>{ability.staminaCost} SP</span>}
                  </div>
                  {onCd && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'var(--danger)', borderRadius: '50%',
                      width: 20, height: 20, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700
                    }}>
                      {cooldowns[ability.id]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
