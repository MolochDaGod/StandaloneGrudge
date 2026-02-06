import React, { useEffect, useState, useCallback, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite } from '../data/spriteMap';

const locationBackgrounds = {
  verdant_plains: '/backgrounds/verdant_plains.png',
  dark_forest: '/backgrounds/dark_forest.png',
  cursed_ruins: '/backgrounds/cursed_ruins.png',
  blood_canyon: '/backgrounds/blood_canyon.png',
  dragon_peaks: '/backgrounds/dragon_peaks.png',
  shadow_citadel: '/backgrounds/shadow_citadel.png',
  demon_gate: '/backgrounds/demon_gate.png',
  void_throne: '/backgrounds/void_throne.png',
};

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

  const [displayFloats, setDisplayFloats] = useState([]);
  const [playerAnim, setPlayerAnim] = useState('idle');
  const [enemyAnim, setEnemyAnim] = useState('idle');
  const [playerFlash, setPlayerFlash] = useState(false);
  const [enemyFlash, setEnemyFlash] = useState(false);
  const logRef = useRef(null);

  const cls = classDefinitions[playerClass];
  const enemy = battleState?.enemy;
  const phase = battleState?.phase;

  const playerSprite = getPlayerSprite(playerClass);
  const enemySprite = enemy ? getEnemySprite(enemy.templateId) : null;

  const isDeadRef = useRef({ player: false, enemy: false });
  const bgImage = locationBackgrounds[currentLocation] || null;

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  useEffect(() => {
    if (floatingTexts.length > 0) {
      setDisplayFloats(floatingTexts.map((f, i) => ({ ...f, id: Date.now() + i })));
      const isPlayerHit = floatingTexts.some(f => f.x < 40);
      const isEnemyHit = floatingTexts.some(f => f.x > 40);
      if (isPlayerHit && !isDeadRef.current.player) {
        setPlayerFlash(true);
        setPlayerAnim('hurt');
        setTimeout(() => {
          setPlayerFlash(false);
          if (!isDeadRef.current.player) setPlayerAnim('idle');
        }, 500);
      }
      if (isEnemyHit && !isDeadRef.current.enemy) {
        setEnemyFlash(true);
        setEnemyAnim('hurt');
        setTimeout(() => {
          setEnemyFlash(false);
          if (!isDeadRef.current.enemy) setEnemyAnim('idle');
        }, 500);
      }
      setTimeout(() => setDisplayFloats([]), 1500);
    }
  }, [floatingTexts]);

  useEffect(() => {
    if (phase === 'enemy_turn' && enemy && enemy.health > 0) {
      setEnemyAnim('attack1');
      setTimeout(() => {
        if (!isDeadRef.current.enemy) setEnemyAnim('idle');
      }, 800);
    }
  }, [phase]);

  useEffect(() => {
    if (enemy && enemy.health <= 0) {
      isDeadRef.current.enemy = true;
      setEnemyAnim('death');
    }
  }, [enemy?.health]);

  useEffect(() => {
    if (phase === 'defeat') {
      isDeadRef.current.player = true;
      setPlayerAnim('death');
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'player_turn' || phase === 'enemy_turn') {
      isDeadRef.current = { player: false, enemy: false };
    }
  }, [phase]);

  const getAbilityAnim = useCallback((ability) => {
    if (!ability) return 'attack1';
    if (ability.type === 'heal' || ability.id === 'heal' || ability.id === 'divine_heal') {
      return playerSprite.heal ? 'heal' : 'attack1';
    }
    if (ability.type === 'buff' || ability.id === 'war_cry' || ability.id === 'howl') {
      return playerSprite.block ? 'block' : 'attack1';
    }
    const attackAnims = ['attack1', 'attack2', 'attack3'].filter(a => playerSprite[a]);
    if (attackAnims.length <= 1) return 'attack1';
    if (ability.damage >= 2.0) return attackAnims[attackAnims.length - 1];
    if (ability.damage >= 1.5 && attackAnims.length > 1) return attackAnims[1];
    return 'attack1';
  }, [playerSprite]);

  const handleAbility = useCallback((abilityId) => {
    if (phase !== 'player_turn') return;
    const ability = cls?.abilities.find(a => a.id === abilityId);
    const anim = getAbilityAnim(ability);
    setPlayerAnim(anim);
    setTimeout(() => {
      if (!isDeadRef.current.player) setPlayerAnim('idle');
    }, 600);
    useAbility(abilityId);
  }, [phase, useAbility, cls, getAbilityAnim]);

  useEffect(() => {
    if (phase !== 'player_turn') return;
    const abilities = cls?.abilities;
    if (!abilities) return;

    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= abilities.length) {
        const ability = abilities[num - 1];
        const onCd = (cooldowns[ability.id] || 0) > 0;
        const noMana = ability.manaCost > playerMana;
        const noStamina = ability.staminaCost > playerStamina;
        if (!onCd && !noMana && !noStamina) {
          handleAbility(ability.id);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, cls, cooldowns, playerMana, playerStamina, handleAbility]);

  if (!battleState || !enemy) return null;

  const isVictory = phase === 'victory';
  const isDefeat = phase === 'defeat';
  const isPlayerTurn = phase === 'player_turn';
  const isBoss = battleState.isBoss;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {bgImage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.35, zIndex: 0,
        }} />
      )}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(11,16,32,0.3) 0%, rgba(11,16,32,0.5) 50%, rgba(11,16,32,0.85) 100%)',
        zIndex: 0,
      }} />

      <div style={{
        flex: '0 0 auto', padding: '8px 20px', background: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', zIndex: 2, backdropFilter: 'blur(4px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="font-cinzel" style={{ color: isBoss ? 'var(--gold)' : 'var(--accent)', fontSize: '0.85rem' }}>
            {isBoss ? 'BOSS BATTLE' : 'BATTLE'}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Turn {battleState.turnCount}</span>
        </div>
        {phase === 'player_turn' && (
          <div style={{
            color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 10px', background: 'rgba(110,231,183,0.15)',
            borderRadius: 6, border: '1px solid var(--accent)'
          }}>YOUR TURN</div>
        )}
        {phase === 'enemy_turn' && !isVictory && !isDefeat && (
          <div style={{
            color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600,
            padding: '3px 10px', background: 'rgba(239,68,68,0.15)',
            borderRadius: 6, border: '1px solid var(--danger)',
            animation: 'pulse 1s infinite'
          }}>ENEMY TURN</div>
        )}
        {(isVictory || isDefeat) && (
          <button onClick={returnToWorld} style={{
            background: 'var(--border)', border: 'none', borderRadius: 8,
            padding: '5px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem'
          }}>
            Return
          </button>
        )}
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 1, minHeight: 0
      }}>
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'space-between',
          alignItems: 'stretch', padding: '10px 16px', gap: 16, minHeight: 0
        }}>
          <div style={{
            flex: '1 1 0', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)', borderRadius: 14,
            border: `1px solid ${isPlayerTurn ? 'var(--accent)' : 'var(--border)'}`,
            padding: '12px 8px', minWidth: 0,
            transition: 'border-color 0.3s',
            boxShadow: playerFlash ? '0 0 30px rgba(239,68,68,0.4), inset 0 0 20px rgba(239,68,68,0.15)' : 'none',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: isPlayerTurn ? `drop-shadow(0 0 12px ${cls?.color}60)` : 'none',
              transition: 'filter 0.3s',
            }}>
              <SpriteAnimation
                spriteData={playerSprite}
                animation={playerAnim}
                scale={2.2}
                speed={150}
                loop={playerAnim === 'idle' || playerAnim === 'walk'}
              />
            </div>
            <div className="font-cinzel" style={{ color: 'var(--text)', fontSize: '0.85rem', marginTop: 6 }}>{playerName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Lv.{level} {cls?.name}</div>
            <div style={{ width: '85%', maxWidth: 160, marginTop: 8 }}>
              <HPBar current={playerHealth} max={playerMaxHealth} color="#22c55e" label="HP" />
              <div style={{ marginTop: 3 }}>
                <HPBar current={playerMana} max={playerMaxMana} color="#3b82f6" label="MP" />
              </div>
              <div style={{ marginTop: 3 }}>
                <HPBar current={playerStamina} max={playerMaxStamina} color="#f59e0b" label="SP" />
              </div>
            </div>
            {playerBuffs.length > 0 && (
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                {playerBuffs.map((b, i) => (
                  <span key={i} style={{
                    background: 'rgba(110,231,183,0.2)', padding: '2px 5px',
                    borderRadius: 4, fontSize: '0.6rem', color: 'var(--accent)'
                  }}>
                    {b.source} ({b.duration})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{
            flex: '0 0 auto', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', padding: '0 4px'
          }}>
            <div style={{ color: 'var(--gold)', fontFamily: "'Cinzel', serif", fontSize: '1.2rem', opacity: 0.5 }}>
              VS
            </div>
            {displayFloats.map(f => (
              <div key={f.id} style={{
                color: f.color, fontWeight: 700, fontSize: '1.1rem',
                animation: 'floatUp 1.5s ease forwards', pointerEvents: 'none',
                textShadow: '0 0 10px rgba(0,0,0,0.8)', marginTop: 4
              }}>
                {f.text}
              </div>
            ))}
          </div>

          <div style={{
            flex: '1 1 0', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)', borderRadius: 14,
            border: `1px solid ${(phase === 'enemy_turn' && !isVictory && !isDefeat) ? 'var(--danger)' : 'var(--border)'}`,
            padding: '12px 8px', minWidth: 0,
            opacity: enemy.health <= 0 ? 0.5 : 1,
            transition: 'border-color 0.3s, opacity 0.5s',
            boxShadow: enemyFlash ? '0 0 30px rgba(239,68,68,0.4), inset 0 0 20px rgba(239,68,68,0.15)' : 'none',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: isBoss ? `drop-shadow(0 0 16px ${enemy.color}60)` : 'none',
            }}>
              <SpriteAnimation
                spriteData={enemySprite}
                animation={enemyAnim}
                scale={2.2}
                flip={true}
                speed={150}
                loop={enemyAnim === 'idle'}
              />
            </div>
            <div className="font-cinzel" style={{ color: 'var(--text)', fontSize: '0.85rem', marginTop: 6 }}>{enemy.name}</div>
            <div style={{ width: '85%', maxWidth: 160, marginTop: 8 }}>
              <HPBar current={enemy.health} max={enemy.maxHealth} color="#ef4444" label="HP" height={14} />
            </div>
            {enemy.buffs?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                {enemy.buffs.map((b, i) => (
                  <span key={i} style={{
                    background: 'rgba(239,68,68,0.2)', padding: '2px 5px',
                    borderRadius: 4, fontSize: '0.6rem', color: '#ef4444'
                  }}>
                    {b.source} ({b.duration})
                  </span>
                ))}
              </div>
            )}
            {enemy.dots?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                {enemy.dots.map((d, i) => (
                  <span key={i} style={{
                    background: 'rgba(239,68,68,0.2)', padding: '2px 5px',
                    borderRadius: 4, fontSize: '0.6rem', color: '#f97316'
                  }}>
                    Bleed {d.duration}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {(isVictory || isDefeat) && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', animation: 'slideUp 0.5s ease', zIndex: 20,
            background: 'rgba(11,16,32,0.85)', padding: '24px 40px', borderRadius: 16,
            border: `2px solid ${isVictory ? 'var(--gold)' : 'var(--danger)'}`,
            backdropFilter: 'blur(8px)',
          }}>
            <div className="font-cinzel" style={{
              fontSize: '2rem',
              color: isVictory ? 'var(--gold)' : 'var(--danger)',
              textShadow: `0 0 20px ${isVictory ? 'rgba(255,215,0,0.4)' : 'rgba(239,68,68,0.4)'}`
            }}>
              {isVictory ? 'VICTORY!' : 'DEFEAT'}
            </div>
            {isVictory && (
              <div style={{ color: 'var(--accent)', marginTop: 8, fontSize: '0.85rem' }}>
                +{enemy.xpReward} XP | +{enemy.goldReward} Gold
              </div>
            )}
            {isDefeat && (
              <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: '0.8rem' }}>
                Recover at 50% HP, lose 10% gold.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              {isVictory && currentLocation && (
                <button onClick={() => startBattle(currentLocation)} style={{
                  background: 'linear-gradient(135deg, var(--accent), #10b981)',
                  border: 'none', borderRadius: 10, padding: '10px 20px',
                  color: '#0b1020', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                }}>
                  Fight Again
                </button>
              )}
              <button onClick={returnToWorld} style={{
                background: isDefeat ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))' : 'var(--border)',
                border: isDefeat ? '2px solid var(--danger)' : 'none',
                borderRadius: 10, padding: '10px 20px',
                color: isDefeat ? 'var(--danger)' : 'var(--text)',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
              }}>
                {isDefeat ? 'Retreat & Recover' : 'Return to World'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{
        flex: '0 0 80px', background: 'rgba(0,0,0,0.6)',
        borderTop: '1px solid var(--border)', padding: '6px 12px',
        overflow: 'auto', fontSize: '0.75rem', zIndex: 2,
        backdropFilter: 'blur(4px)',
      }} ref={logRef}>
        <div style={{
          color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 600,
          marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase'
        }}>Battle Log</div>
        {battleLog.map((msg, i) => (
          <div key={i} style={{
            color: i === battleLog.length - 1 ? 'var(--text)' : 'var(--muted)',
            padding: '1px 0', opacity: i === battleLog.length - 1 ? 1 : 0.7,
            fontSize: '0.75rem',
          }}>
            {msg}
          </div>
        ))}
      </div>

      {!isVictory && !isDefeat && (
        <div style={{
          flex: '0 0 100px',
          background: isPlayerTurn ? 'rgba(14,22,48,0.95)' : 'rgba(30,10,10,0.95)',
          borderTop: `2px solid ${isPlayerTurn ? 'var(--accent)' : 'var(--danger)'}`,
          padding: '10px 12px', zIndex: 2,
          backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          transition: 'background 0.3s, border-color 0.3s',
        }}>
          {isPlayerTurn ? (
            <>
              <div style={{
                textAlign: 'center', marginBottom: 6, color: 'var(--muted)',
                fontSize: '0.7rem', letterSpacing: 1
              }}>
                Choose an action <span style={{ color: 'var(--accent)' }}>(1-{cls?.abilities.length})</span>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {cls?.abilities.map((ability, idx) => {
                  const onCd = (cooldowns[ability.id] || 0) > 0;
                  const noMana = ability.manaCost > playerMana;
                  const noStamina = ability.staminaCost > playerStamina;
                  const disabled = onCd || noMana || noStamina;
                  return (
                    <button key={ability.id} onClick={() => !disabled && handleAbility(ability.id)}
                      title={`${ability.description}\n${ability.manaCost ? `MP: ${ability.manaCost}` : ''} ${ability.staminaCost ? `SP: ${ability.staminaCost}` : ''}`}
                      style={{
                        background: disabled ? 'rgba(42,49,80,0.3)' : 'linear-gradient(135deg, rgba(42,49,80,0.8), rgba(42,49,80,0.5))',
                        border: `2px solid ${disabled ? 'var(--border)' : 'var(--accent)'}`,
                        borderRadius: 10, padding: '8px 12px', minWidth: 110,
                        color: disabled ? 'var(--muted)' : 'var(--text)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', textAlign: 'center', opacity: disabled ? 0.5 : 1,
                        position: 'relative'
                      }}
                      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
                      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'none'; }}}
                    >
                      <div style={{
                        position: 'absolute', top: -6, left: -6,
                        background: disabled ? '#444' : 'var(--accent)', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700,
                        color: disabled ? '#888' : '#0b1020', border: '2px solid rgba(0,0,0,0.3)'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontSize: '1.1rem', marginBottom: 1 }}>{ability.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{ability.name}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 1 }}>
                        {ability.manaCost > 0 && <span style={{ color: '#3b82f6' }}>{ability.manaCost} MP </span>}
                        {ability.staminaCost > 0 && <span style={{ color: '#f59e0b' }}>{ability.staminaCost} SP</span>}
                      </div>
                      {onCd && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'var(--danger)', borderRadius: '50%',
                          width: 18, height: 18, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700
                        }}>
                          {cooldowns[ability.id]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{
              color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600,
              animation: 'pulse 1s infinite', textAlign: 'center'
            }}>
              {enemy.name} is attacking...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
